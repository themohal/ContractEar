import { getServiceSupabase } from "./supabase";
import { getOpenAI } from "./openai";
import { getPromptForPlan, getModelForPlan, getMaxTokensForPlan } from "./prompts";

const MAX_RETRIES = 3;

async function withRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.error(`Attempt ${attempt}/${retries} failed:`, lastError.message);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, attempt * 2000));
      }
    }
  }
  throw lastError;
}

export async function processAnalysis(analysisId: string) {
  const supabase = getServiceSupabase();
  const openai = getOpenAI();

  // Get the analysis record
  const { data: analysis, error: fetchError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .single();

  if (fetchError || !analysis) {
    throw new Error("Analysis not found");
  }

  // Get user's plan
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", analysis.user_id)
    .single();

  const userPlan = profile?.plan || "single";
  const systemPrompt = getPromptForPlan(userPlan);
  const model = getModelForPlan(userPlan);
  const maxTokens = getMaxTokensForPlan(userPlan);

  // Atomically claim processing — only proceed if not already completed/errored
  // This prevents double-processing from concurrent webhook + confirm-payment calls
  if (analysis.status === "completed" || analysis.status === "error") {
    console.log(`Analysis ${analysisId} already ${analysis.status}, skipping`);
    return;
  }

  // Update status to processing
  await supabase
    .from("analyses")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", analysisId);

  try {
    // Download audio from Supabase Storage
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("audio-uploads")
      .download(analysis.audio_path);

    if (downloadError || !audioData) {
      throw new Error("Failed to download audio file");
    }

    // Transcribe with Whisper (3 retries)
    const transcript = await withRetry(async () => {
      const file = new File([audioData], "audio.mp3", { type: "audio/mpeg" });
      const transcription = await openai.audio.transcriptions.create({
        model: "whisper-1",
        file: file,
        response_format: "verbose_json",
        timestamp_granularities: ["segment"],
      });
      return typeof transcription === "string"
        ? transcription
        : transcription.text || "";
    });

    // Store transcript temporarily
    await supabase
      .from("analyses")
      .update({ transcript, updated_at: new Date().toISOString() })
      .eq("id", analysisId);

    // Analyze with plan-based model and prompt (3 retries)
    const result = await withRetry(async () => {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze this transcript:\n\n${transcript}`,
          },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from GPT-4o");
      }

      return JSON.parse(content);
    });

    // Update with results, clear transcript
    await supabase
      .from("analyses")
      .update({
        status: "completed",
        result,
        transcript: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    // Delete audio file from storage
    await supabase.storage
      .from("audio-uploads")
      .remove([analysis.audio_path]);
  } catch (err) {
    const rawMessage = err instanceof Error ? err.message : "Processing failed";
    const message = rawMessage.includes("API key")
      ? "Service configuration error. Please contact support."
      : rawMessage.replace(/sk-[a-zA-Z0-9]+/g, "***");
    await supabase
      .from("analyses")
      .update({
        status: "error",
        processing_error: message,
        transcript: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    // Always delete audio on error
    await supabase.storage
      .from("audio-uploads")
      .remove([analysis.audio_path]);

    throw err;
  }
}
