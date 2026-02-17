import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAuthUser, unauthorizedResponse, checkUsageLimit } from "@/lib/auth";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const usage = await checkUsageLimit(user.id);
    if (!usage.allowed) {
      const msg =
        usage.plan === "none"
          ? "Please choose a plan before uploading."
          : `You've reached your monthly limit of ${usage.limit} analyses. Upgrade your plan for more.`;
      return NextResponse.json({ error: msg }, { status: 403 });
    }

    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    if (parsed.protocol !== "https:") {
      return NextResponse.json(
        { error: "URL must use HTTPS" },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "ContractEar/1.0" },
      });
    } catch {
      clearTimeout(timeout);
      return NextResponse.json(
        {
          error:
            "Could not fetch audio from URL. The file may be protected or unavailable. Please download it and upload directly.",
        },
        { status: 400 }
      );
    }
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            "Could not access the audio file. Please download it and upload directly.",
        },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    const isAudio =
      contentType.includes("audio/") ||
      contentType.includes("video/") ||
      contentType.includes("application/octet-stream");

    if (!isAudio) {
      return NextResponse.json(
        {
          error:
            "URL does not point to an audio file. Please provide a direct link to an audio file.",
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 25MB." },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const id = randomUUID();
    const ext = url.split(".").pop()?.split("?")[0]?.substring(0, 5) || "mp3";
    const fileName = `url_audio.${ext}`;
    const storagePath = `${id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("audio-uploads")
      .upload(storagePath, buffer, {
        contentType: contentType || "audio/mpeg",
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to store audio file" },
        { status: 500 }
      );
    }

    const initialStatus = usage.plan === "single" ? "pending" : "paid";

    const { error: insertError } = await supabase.from("analyses").insert({
      id,
      user_id: user.id,
      file_name: url,
      audio_path: storagePath,
      source_type: "url",
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
