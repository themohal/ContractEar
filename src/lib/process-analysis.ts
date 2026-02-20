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

/**
 * Process analysis with audio buffer passed directly in memory.
 * No Supabase storage upload/download needed.
 */
export async function processAnalysisInMemory(
  analysisId: string,
  audioBuffer: Buffer,
  fileName: string,
  contentType: string
) {
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

  // Skip if already completed/errored
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
    // Transcribe with Whisper directly from memory buffer (3 retries)
    const transcript = await withRetry(async () => {
      // Copy to a fresh ArrayBuffer to avoid SharedArrayBuffer type issues
      const ab = new ArrayBuffer(audioBuffer.byteLength);
      new Uint8Array(ab).set(new Uint8Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.byteLength));
      const file = new File([ab], fileName, { type: contentType });
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

    // Single (pay-per-use) is one-time: reset plan to "none" after completion
    if (userPlan === "single") {
      await supabase
        .from("profiles")
        .update({
          plan: "none",
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysis.user_id);
    }
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

    // Single plan: also reset on error so the one-time use is consumed
    if (userPlan === "single") {
      await supabase
        .from("profiles")
        .update({
          plan: "none",
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysis.user_id);
    }

    throw err;
  }
}

/**
 * Legacy: Process analysis by downloading audio from Supabase storage.
 * Kept for webhook/confirm-payment flows that may still reference it.
 */
export async function processAnalysis(analysisId: string) {
  const supabase = getServiceSupabase();
  const openai = getOpenAI();

  const { data: analysis, error: fetchError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .single();

  if (fetchError || !analysis) {
    throw new Error("Analysis not found");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", analysis.user_id)
    .single();

  const userPlan = profile?.plan || "single";
  const systemPrompt = getPromptForPlan(userPlan);
  const model = getModelForPlan(userPlan);
  const maxTokens = getMaxTokensForPlan(userPlan);

  if (analysis.status === "completed" || analysis.status === "error") {
    console.log(`Analysis ${analysisId} already ${analysis.status}, skipping`);
    return;
  }

  await supabase
    .from("analyses")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", analysisId);

  try {
    const { data: audioData, error: downloadError } = await supabase.storage
      .from("audio-uploads")
      .download(analysis.audio_path);

    if (downloadError || !audioData) {
      throw new Error("Failed to download audio file");
    }

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

    await supabase
      .from("analyses")
      .update({ transcript, updated_at: new Date().toISOString() })
      .eq("id", analysisId);

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

    await supabase
      .from("analyses")
      .update({
        status: "completed",
        result,
        transcript: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    if (analysis.audio_path) {
      await supabase.storage
        .from("audio-uploads")
        .remove([analysis.audio_path]);
    }

    // Single (pay-per-use) is one-time: reset plan to "none" after completion
    if (userPlan === "single") {
      await supabase
        .from("profiles")
        .update({
          plan: "none",
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysis.user_id);
    }
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

    if (analysis.audio_path) {
      await supabase.storage
        .from("audio-uploads")
        .remove([analysis.audio_path]);
    }

    // Single plan: also reset on error so the one-time use is consumed
    if (userPlan === "single") {
      await supabase
        .from("profiles")
        .update({
          plan: "none",
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysis.user_id);
    }

    throw err;
  }
}
