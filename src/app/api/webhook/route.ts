import { NextRequest, NextResponse } from "next/server";
import { verifyPaddleWebhook } from "@/lib/paddle";
import { getServiceSupabase } from "@/lib/supabase";
import { processAnalysis } from "@/lib/process-analysis";
import { incrementUsage } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("paddle-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const isValid = verifyPaddleWebhook(
      rawBody,
      signature,
      process.env.PADDLE_WEBHOOK_SECRET!
    );

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const supabase = getServiceSupabase();

    // Handle single analysis payment
    if (event.event_type === "transaction.completed") {
      const customData = event.data?.custom_data;
      const transactionId = event.data?.id;

      // Single analysis payment
      if (customData?.analysis_id) {
        const analysisId = customData.analysis_id;

        const { data: analysis } = await supabase
          .from("analyses")
          .select("status, user_id")
          .eq("id", analysisId)
          .single();

        if (analysis?.status === "pending") {
          await supabase
            .from("analyses")
            .update({
              status: "paid",
              paddle_transaction_id: transactionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", analysisId);

          // Increment usage counter
          if (analysis.user_id) {
            await incrementUsage(analysis.user_id);
          }

          try {
            await processAnalysis(analysisId);
          } catch (err) {
            console.error("Processing failed in webhook:", err);
          }
        }
      }

      // Plan payment (subscription or pay-per-use activation)
      if (customData?.tier && customData?.user_id) {
        const { tier, user_id } = customData;
        const limits: Record<string, number> = {
          single: 0,
          basic: 20,
          pro: 50,
        };

        await supabase
          .from("profiles")
          .update({
            plan: tier,
            analyses_limit: limits[tier] || 0,
            analyses_used: 0,
            billing_cycle_start: new Date().toISOString(),
            paddle_subscription_id: transactionId,
            paddle_customer_id: event.data?.customer_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user_id);
      }
    }

    // Handle subscription cancellation
    if (event.event_type === "subscription.canceled") {
      const customerId = event.data?.customer_id;
      if (customerId) {
        await supabase
          .from("profiles")
          .update({
            plan: "none",
            analyses_limit: 0,
            paddle_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_customer_id", customerId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
