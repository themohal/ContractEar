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

    const variantId =
      tier === "basic"
        ? process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_BASIC
        : process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_PRO;

    if (!variantId) {
      return NextResponse.json(
        { error: "Variant not configured" },
        { status: 500 }
      );
    }

    console.log("[create-subscription] Store ID:", process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID);
    console.log("[create-subscription] Variant ID:", variantId);

    const response = await fetch(
      "https://api.lemonsqueezy.com/v1/checkouts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
          Accept: "application/vnd.api+json",
          "Content-Type": "application/vnd.api+json",
        },
        body: JSON.stringify({
          data: {
            type: "checkouts",
            attributes: {
              checkout_data: {
                custom: {
                  user_id: user.id,
                  tier,
                },
              },
              product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
              },
            },
            relationships: {
              store: {
                data: {
                  type: "stores",
                  id: process.env.NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID,
                },
              },
              variant: {
                data: {
                  type: "variants",
                  id: variantId,
                },
              },
            },
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Lemon Squeezy API error:", await response.text());
      return NextResponse.json(
        { error: "Failed to create subscription checkout" },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json({ checkoutUrl: data.data.attributes.url });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
