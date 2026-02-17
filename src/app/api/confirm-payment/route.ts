import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAuthUser, unauthorizedResponse, incrementUsage } from "@/lib/auth";
import { processAnalysis } from "@/lib/process-analysis";

export async function POST(request: NextRequest) {
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
      .select("status, user_id, tier")
      .eq("id", analysisId)
      .single();

    if (error || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (analysis.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (
      analysis.status === "completed" ||
      analysis.status === "processing"
    ) {
      return NextResponse.json({ status: analysis.status });
    }

    if (analysis.status === "error") {
      return NextResponse.json({ status: "error" });
    }

    // Only process if payment is confirmed (status = "paid")
    // "pending" means unpaid — do NOT process
    if (analysis.status === "pending") {
      return NextResponse.json(
        { error: "Payment required before processing" },
        { status: 402 }
      );
    }

    // Status is "paid" — safe to start processing
    await supabase
      .from("analyses")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    // Increment usage for subscription plans (single is handled in webhook)
    if (analysis.tier !== "single") {
      await incrementUsage(user.id);
    }

    processAnalysis(analysisId).catch((err) => {
      console.error("Processing failed in confirm-payment:", err);
    });

    return NextResponse.json({ status: "processing" });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
