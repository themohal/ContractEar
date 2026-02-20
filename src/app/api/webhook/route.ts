import { NextRequest, NextResponse } from "next/server";
import { verifyPaddleWebhook } from "@/lib/paddle";
import { getServiceSupabase } from "@/lib/supabase";
import { processAnalysis } from "@/lib/process-analysis";
import { incrementUsage } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("paddle-signature");

    console.log("[Webhook] Received event");
    console.log("[Webhook] Has signature:", !!signature);
    console.log("[Webhook] Has secret:", !!process.env.PADDLE_WEBHOOK_SECRET);

    if (!signature) {
      console.log("[Webhook] REJECTED: Missing signature");
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

    console.log("[Webhook] Signature valid:", isValid);

    if (!isValid) {
      console.log("[Webhook] REJECTED: Invalid signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const supabase = getServiceSupabase();

    console.log("[Webhook] Event type:", event.event_type);
    console.log("[Webhook] Custom data:", JSON.stringify(event.data?.custom_data));

    // Handle single analysis payment
    if (event.event_type === "transaction.completed") {
      const customData = event.data?.custom_data;
      const transactionId = event.data?.id;
      const paddleAmount = parseFloat(event.data?.details?.totals?.total || "0") / 100;

      // Single analysis payment
      if (customData?.analysis_id) {
        const analysisId = customData.analysis_id;

        const { data: analysis } = await supabase
          .from("analyses")
          .select("status, user_id")
          .eq("id", analysisId)
          .single();

        if (analysis?.status === "pending") {
          // Atomically claim: only update if still "pending"
          const { data: claimed } = await supabase
            .from("analyses")
            .update({
              status: "paid",
              paddle_transaction_id: transactionId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", analysisId)
            .eq("status", "pending")
            .select("id");

          if (!claimed || claimed.length === 0) {
            // Already picked up by confirm-payment, skip
            console.log("[Webhook] Analysis already advanced past pending, skipping");
          } else {
            // Increment usage counter and log
            if (analysis.user_id) {
              await incrementUsage(analysis.user_id, analysisId);
            }

            // Insert billing record for single analysis payment
            if (analysis.user_id) {
              await supabase.from("billing_records").insert({
                user_id: analysis.user_id,
                event_type: "single_payment",
                plan_tier: "single",
                amount: paddleAmount || 3.99,
                currency: event.data?.currency_code || "USD",
                paddle_transaction_id: transactionId,
                paddle_customer_id: event.data?.customer_id || null,
                status: "completed",
              });
            }

            // Fire-and-forget — don't block the webhook response
            processAnalysis(analysisId).catch((err) => {
              console.error("Processing failed in webhook:", err);
            });
          }
        }
      }

      // Plan payment (subscription or pay-per-use activation)
      if (customData?.tier && customData?.user_id) {
        const { tier, user_id } = customData;
        console.log("[Webhook] Updating plan for user:", user_id, "to tier:", tier);
        const limits: Record<string, number> = {
          single: 0,
          basic: 20,
          pro: 50,
        };
        const planPrices: Record<string, number> = {
          single: 3.99,
          basic: 29,
          pro: 79,
        };

        const { error: updateError } = await supabase
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

        if (updateError) {
          console.error("[Webhook] Profile update failed:", updateError);
        } else {
          console.log("[Webhook] Profile updated successfully to plan:", tier);
        }

        // Insert billing record for plan subscription
        const eventType = tier === "single" ? "single_payment" : "subscription_created";
        await supabase.from("billing_records").insert({
          user_id,
          event_type: eventType,
          plan_tier: tier,
          amount: paddleAmount || planPrices[tier] || 0,
          currency: event.data?.currency_code || "USD",
          paddle_transaction_id: transactionId,
          paddle_customer_id: event.data?.customer_id || null,
          paddle_subscription_id: tier !== "single" ? transactionId : null,
          status: "completed",
        });
      }
    }

    // Handle subscription renewal (Paddle sends transaction.paid for recurring charges)
    if (event.event_type === "transaction.paid") {
      const customData = event.data?.custom_data;
      const transactionId = event.data?.id;
      const paddleAmount = parseFloat(event.data?.details?.totals?.total || "0") / 100;
      const subscriptionId = event.data?.subscription_id;

      // Only handle if it's a subscription renewal (has subscription_id but no tier in custom_data)
      // New subscriptions are handled by transaction.completed above
      if (subscriptionId && !customData?.tier) {
        // Find user by subscription ID or customer ID
        const customerId = event.data?.customer_id;
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, plan, analyses_limit")
          .or(`paddle_subscription_id.eq.${subscriptionId},paddle_customer_id.eq.${customerId}`)
          .single();

        if (userProfile && userProfile.plan !== "none" && userProfile.plan !== "single") {
          console.log("[Webhook] Subscription renewal for user:", userProfile.id, "plan:", userProfile.plan);

          // Reset usage for new billing cycle
          await supabase
            .from("profiles")
            .update({
              analyses_used: 0,
              billing_cycle_start: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", userProfile.id);

          // Insert billing record for renewal
          const planPrices: Record<string, number> = {
            basic: 29,
            pro: 79,
          };
          await supabase.from("billing_records").insert({
            user_id: userProfile.id,
            event_type: "subscription_renewed",
            plan_tier: userProfile.plan,
            amount: paddleAmount || planPrices[userProfile.plan] || 0,
            currency: event.data?.currency_code || "USD",
            paddle_transaction_id: transactionId,
            paddle_customer_id: customerId || null,
            paddle_subscription_id: subscriptionId,
            status: "completed",
          });

          console.log("[Webhook] Renewal processed, usage reset for user:", userProfile.id);
        }
      }
    }

    // Handle subscription cancellation
    if (event.event_type === "subscription.canceled") {
      const customerId = event.data?.customer_id;
      if (customerId) {
        // Find user by customer ID before updating
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, plan")
          .eq("paddle_customer_id", customerId)
          .single();

        await supabase
          .from("profiles")
          .update({
            plan: "none",
            analyses_limit: 0,
            paddle_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("paddle_customer_id", customerId);

        // Insert billing record for cancellation
        if (userProfile) {
          await supabase.from("billing_records").insert({
            user_id: userProfile.id,
            event_type: "subscription_canceled",
            plan_tier: userProfile.plan || "none",
            amount: 0,
            currency: "USD",
            paddle_customer_id: customerId,
            paddle_subscription_id: event.data?.id || null,
            status: "completed",
          });
        }
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
