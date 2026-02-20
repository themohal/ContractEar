import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAuthUser, unauthorizedResponse, incrementUsage } from "@/lib/auth";
import { processAnalysis } from "@/lib/process-analysis";

async function verifyPaddleTransaction(
  transactionId: string
): Promise<boolean> {
  const paddleBase =
    process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
      ? "sandbox-api.paddle.com"
      : "api.paddle.com";

  try {
    const res = await fetch(
      `https://${paddleBase}/transactions/${transactionId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        },
      }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return data.data?.status === "completed" || data.data?.status === "paid";
  } catch {
    return false;
  }
}

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
      .select("status, user_id, tier, paddle_transaction_id")
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

    // If still "pending", verify payment directly with Paddle as webhook fallback
    if (analysis.status === "pending") {
      if (!analysis.paddle_transaction_id) {
        return NextResponse.json(
          { error: "Payment required before processing" },
          { status: 402 }
        );
      }

      const isPaid = await verifyPaddleTransaction(
        analysis.paddle_transaction_id
      );
      if (!isPaid) {
        return NextResponse.json(
          { error: "Payment required before processing" },
          { status: 402 }
        );
      }

      // Atomically claim: only update if still "pending" (webhook may have already handled it)
      const { data: claimed } = await supabase
        .from("analyses")
        .update({
          status: "paid",
          updated_at: new Date().toISOString(),
        })
        .eq("id", analysisId)
        .eq("status", "pending")
        .select("id");

      if (!claimed || claimed.length === 0) {
        // Webhook already advanced this — return current status
        return NextResponse.json({ status: "processing" });
      }
    }

    // Atomically move from "paid" to "processing" — prevents double-processing
    const { data: started } = await supabase
      .from("analyses")
      .update({
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId)
      .eq("status", "paid")
      .select("id");

    if (!started || started.length === 0) {
      // Already processing or completed — just report current status
      return NextResponse.json({ status: "processing" });
    }

    // Increment usage for subscription plans (single is handled in webhook)
    if (analysis.tier !== "single") {
      await incrementUsage(user.id, analysisId);
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
