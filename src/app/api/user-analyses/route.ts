import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("analyses")
    .select("id, file_name, status, created_at, result")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }

  return NextResponse.json({ analyses: data || [] });
}
