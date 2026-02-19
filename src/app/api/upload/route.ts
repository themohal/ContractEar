import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAuthUser, unauthorizedResponse, checkUsageLimit, incrementUsage } from "@/lib/auth";
import { processAnalysis } from "@/lib/process-analysis";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/x-m4a",
  "audio/mp3",
  "audio/ogg",
  "audio/flac",
];
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    // Check usage limits
    const usage = await checkUsageLimit(user.id);
    if (!usage.allowed) {
      const msg =
        usage.plan === "none"
          ? "Please choose a plan before uploading."
          : `You've reached your monthly limit of ${usage.limit} analyses. Upgrade your plan for more.`;
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload an audio file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const id = randomUUID();
    const ext = file.name.split(".").pop() || "mp3";
    const storagePath = `${id}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("audio-uploads")
      .upload(storagePath, buffer, {
        contentType: file.type,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Determine status based on plan: subscribers skip payment
    const initialStatus = usage.plan === "single" ? "pending" : "processing";

    const { error: insertError } = await supabase.from("analyses").insert({
      id,
      user_id: user.id,
      file_name: file.name,
      audio_path: storagePath,
      source_type: "upload",
      status: initialStatus,
      tier: usage.plan,
    });

    if (insertError) {
      await supabase.storage.from("audio-uploads").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create analysis record" },
        { status: 500 }
      );
    }

    // For subscription users, start processing immediately
    if (usage.plan !== "single") {
      incrementUsage(user.id).catch(() => {});
      processAnalysis(id).catch((err) => {
        console.error("Processing failed in upload:", err);
      });
    }

    return NextResponse.json({
      id,
      requiresPayment: usage.plan === "single",
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
