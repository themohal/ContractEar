import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const { tier } = await request.json();

    if (tier !== "basic" && tier !== "pro") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const priceId =
      tier === "basic"
        ? process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_BASIC
        : process.env.NEXT_PUBLIC_PADDLE_PRICE_ID_PRO;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price not configured" },
        { status: 500 }
      );
    }

    // Create a Paddle subscription checkout
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
        items: [{ price_id: priceId, quantity: 1 }],
        custom_data: { user_id: user.id, tier },
        checkout: {
          settings: {
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
            display_mode: "overlay",
            theme: "dark",
          },
        },
      }),
    });

    if (!response.ok) {
      console.error("Paddle API error:", await response.text());
      return NextResponse.json(
        { error: "Failed to create subscription checkout" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ transactionId: data.data.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
