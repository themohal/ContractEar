import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return unauthorizedResponse();

    const { analysisId } = await request.json();

    if (!analysisId) {
      return NextResponse.json(
        { error: "No analysis ID provided" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    const { data: analysis, error } = await supabase
      .from("analyses")
      .select("user_id, status, audio_path")
      .eq("id", analysisId)
      .single();

    if (error || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    if (analysis.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete audio from storage (may already be cleaned up after processing)
    if (analysis.audio_path) {
      await supabase.storage
        .from("audio-uploads")
        .remove([analysis.audio_path]);
    }

    // Delete the analysis record
    await supabase.from("analyses").delete().eq("id", analysisId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
