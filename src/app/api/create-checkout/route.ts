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
                  analysis_id: analysisId,
                  user_id: user.id,
                },
              },
              product_options: {
                redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/analysis/${analysisId}?paid=1`,
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
                  id: process.env.NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ID_SINGLE,
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
        { error: "Failed to create checkout" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const checkoutUrl = data.data.attributes.url;

    // Save a reference so we can track this checkout
    const supabase = getServiceSupabase();
    await supabase
      .from("analyses")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysisId);

    return NextResponse.json({ checkoutUrl });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
