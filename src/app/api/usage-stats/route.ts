import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse } from "@/lib/auth";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const supabase = getServiceSupabase();

  // Fetch all analyses for this user from last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const { data: analyses, error } = await supabase
    .from("analyses")
    .select("created_at, status")
    .eq("user_id", user.id)
    .gte("created_at", twelveMonthsAgo.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch usage stats" },
      { status: 500 }
    );
  }

  // Build daily counts for last 30 days
  const daily: Record<string, number> = {};
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    daily[key] = 0;
  }

  // Build monthly counts for last 12 months
  const monthly: Record<string, number> = {};
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthly[key] = 0;
  }

  for (const a of analyses || []) {
    const date = new Date(a.created_at);
    const dayKey = date.toISOString().split("T")[0];
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (dayKey in daily) daily[dayKey]++;
    if (monthKey in monthly) monthly[monthKey]++;
  }

  const dailyData = Object.entries(daily).map(([date, count]) => ({
    date,
    count,
  }));

  const monthlyData = Object.entries(monthly).map(([month, count]) => ({
    month,
    count,
  }));

  return NextResponse.json({
    daily: dailyData,
    monthly: monthlyData,
    total: (analyses || []).length,
  });
}
