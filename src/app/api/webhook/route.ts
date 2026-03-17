import { NextRequest, NextResponse } from "next/server";
import { verifyLemonSqueezyWebhook } from "@/lib/lemonsqueezy";
import { getServiceSupabase } from "@/lib/supabase";
import { processAnalysis } from "@/lib/process-analysis";
import { incrementUsage } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    console.log("[Webhook] Received event");
    console.log("[Webhook] Has signature:", !!signature);
    console.log("[Webhook] Has secret:", !!process.env.LEMONSQUEEZY_WEBHOOK_SECRET);

    if (!signature) {
      console.log("[Webhook] REJECTED: Missing signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const isValid = verifyLemonSqueezyWebhook(
      rawBody,
      signature,
      process.env.LEMONSQUEEZY_WEBHOOK_SECRET!
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
    const eventName = event.meta?.event_name;
    const customData = event.meta?.custom_data;

    console.log("[Webhook] Event type:", eventName);
    console.log("[Webhook] Custom data:", JSON.stringify(customData));

    // Handle single analysis payment (one-time order)
    if (eventName === "order_created") {
      const orderId = String(event.data?.id);
      const lsAmount = parseFloat(event.data?.attributes?.total_formatted?.replace(/[^0-9.]/g, "") || "0");
      const customerId = String(event.data?.attributes?.customer_id || "");

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
              ls_order_id: orderId,
              updated_at: new Date().toISOString(),
            })
            .eq("id", analysisId)
            .eq("status", "pending")
            .select("id");

          if (!claimed || claimed.length === 0) {
            console.log("[Webhook] Analysis already advanced past pending, skipping");
          } else {
            if (analysis.user_id) {
              await incrementUsage(analysis.user_id, analysisId);
            }

            // Insert billing record for single analysis payment
            if (analysis.user_id) {
              await supabase.from("billing_records").insert({
                user_id: analysis.user_id,
                event_type: "single_payment",
                plan_tier: "single",
                amount: lsAmount || 3.99,
                currency: event.data?.attributes?.currency || "USD",
                ls_order_id: orderId,
                ls_customer_id: customerId || null,
                status: "completed",
              });
            }

            processAnalysis(analysisId).catch((err) => {
              console.error("Processing failed in webhook:", err);
            });
          }
        }
      }

      // Plan payment (one-time tier activation via order)
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
            ls_subscription_id: null,
            ls_customer_id: customerId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user_id);

        if (updateError) {
          console.error("[Webhook] Profile update failed:", updateError);
        } else {
          console.log("[Webhook] Profile updated successfully to plan:", tier);
        }

        const eventType = tier === "single" ? "single_payment" : "subscription_created";
        await supabase.from("billing_records").insert({
          user_id,
          event_type: eventType,
          plan_tier: tier,
          amount: lsAmount || planPrices[tier] || 0,
          currency: event.data?.attributes?.currency || "USD",
          ls_order_id: orderId,
          ls_customer_id: customerId || null,
          status: "completed",
        });
      }
    }

    // Handle subscription created
    if (eventName === "subscription_created") {
      const customerId = String(event.data?.attributes?.customer_id || "");
      const subscriptionId = String(event.data?.id);

      if (customData?.tier && customData?.user_id) {
        const { tier, user_id } = customData;
        const limits: Record<string, number> = { basic: 20, pro: 50 };
        const planPrices: Record<string, number> = { basic: 29, pro: 79 };

        await supabase
          .from("profiles")
          .update({
            plan: tier,
            analyses_limit: limits[tier] || 0,
            analyses_used: 0,
            billing_cycle_start: new Date().toISOString(),
            ls_subscription_id: subscriptionId,
            ls_customer_id: customerId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user_id);

        await supabase.from("billing_records").insert({
          user_id,
          event_type: "subscription_created",
          plan_tier: tier,
          amount: planPrices[tier] || 0,
          currency: event.data?.attributes?.currency || "USD",
          ls_customer_id: customerId || null,
          ls_subscription_id: subscriptionId,
          status: "completed",
        });
      }
    }

    // Handle subscription payment (renewal)
    if (eventName === "subscription_payment_success") {
      const subscriptionId = String(event.data?.attributes?.subscription_id || "");
      const customerId = String(event.data?.attributes?.customer_id || "");
      const lsAmount = parseFloat(event.data?.attributes?.total_formatted?.replace(/[^0-9.]/g, "") || "0");

      // Find user by subscription ID or customer ID
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("id, plan, analyses_limit")
        .or(`ls_subscription_id.eq.${subscriptionId},ls_customer_id.eq.${customerId}`)
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

        const planPrices: Record<string, number> = { basic: 29, pro: 79 };
        await supabase.from("billing_records").insert({
          user_id: userProfile.id,
          event_type: "subscription_renewed",
          plan_tier: userProfile.plan,
          amount: lsAmount || planPrices[userProfile.plan] || 0,
          currency: event.data?.attributes?.currency || "USD",
          ls_customer_id: customerId || null,
          ls_subscription_id: subscriptionId,
          status: "completed",
        });

        console.log("[Webhook] Renewal processed, usage reset for user:", userProfile.id);
      }
    }

    // Handle subscription cancellation
    if (eventName === "subscription_cancelled") {
      const customerId = String(event.data?.attributes?.customer_id || "");
      const subscriptionId = String(event.data?.id);

      if (customerId) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id, plan")
          .eq("ls_customer_id", customerId)
          .single();

        await supabase
          .from("profiles")
          .update({
            plan: "none",
            analyses_limit: 0,
            ls_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("ls_customer_id", customerId);

        if (userProfile) {
          await supabase.from("billing_records").insert({
            user_id: userProfile.id,
            event_type: "subscription_canceled",
            plan_tier: userProfile.plan || "none",
            amount: 0,
            currency: "USD",
            ls_customer_id: customerId,
            ls_subscription_id: subscriptionId || null,
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
