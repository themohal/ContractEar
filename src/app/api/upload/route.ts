import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAuthUser, unauthorizedResponse, checkUsageLimit, incrementUsage } from "@/lib/auth";
import { processAnalysisInMemory } from "@/lib/process-analysis";
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
          : usage.expired
            ? "Your billing cycle has expired. Please renew your subscription to continue."
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

    // Read audio into memory
    const buffer = Buffer.from(await file.arrayBuffer());

    // Create analysis record — always start processing immediately
    const { error: insertError } = await supabase.from("analyses").insert({
      id,
      user_id: user.id,
      file_name: file.name,
      audio_path: "",
      source_type: "upload",
      status: "processing",
      tier: usage.plan,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to create analysis record" },
        { status: 500 }
      );
    }

    // Increment usage and log
    incrementUsage(user.id, id).catch(() => {});

    // Process in-memory (fire-and-forget)
    processAnalysisInMemory(id, buffer, file.name, file.type).catch((err) => {
      console.error("Processing failed in upload:", err);
    });

    return NextResponse.json({
      id,
      fileName: file.name,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
