import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

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

    const paddleBase =
      process.env.NEXT_PUBLIC_PADDLE_ENV === "sandbox"
        ? "sandbox-api.paddle.com"
        : "api.paddle.com";

    const response = await fetch(`https://${paddleBase}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        items: [
          {
            price_id: process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_SINGLE,
            quantity: 1,
          },
        ],
        custom_data: { analysis_id: analysisId, user_id: user.id },
        checkout: {
          settings: {
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${analysisId}?paid=1`,
            display_mode: "overlay",
            theme: "dark",
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("Paddle API error:", await response.text());
      return NextResponse.json(
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const transactionId = data.data.id;

    // Save the Paddle transaction ID so we can verify payment later
    const supabase = getServiceSupabase();
    await supabase
      .from("analyses")
      .update({
        paddle_transaction_id: transactionId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    return NextResponse.json({ transactionId });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
