import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "./supabase";
import { createClient } from "@supabase/supabase-js";

export async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return user;
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Please sign in to continue" },
    { status: 401 }
  );
}

export async function getUserProfile(userId: string) {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function ensureProfile(userId: string, email: string) {
  const supabase = getServiceSupabase();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .single();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      plan: "none",
      analyses_used: 0,
      analyses_limit: 0,
      billing_cycle_start: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean;
  plan: string;
  used: number;
  limit: number;
}> {
  const supabase = getServiceSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, analyses_used, analyses_limit, billing_cycle_start")
    .eq("id", userId)
    .single();

  if (!profile) {
    return { allowed: false, plan: "none", used: 0, limit: 0 };
  }

  // No plan — must subscribe first
  if (profile.plan === "none") {
    return { allowed: false, plan: "none", used: 0, limit: 0 };
  }

  // Single (pay-per-use) always allowed — they pay per analysis
  if (profile.plan === "single") {
    return {
      allowed: true,
      plan: "single",
      used: profile.analyses_used,
      limit: 0,
    };
  }

  // Check if billing cycle needs reset (monthly)
  const cycleStart = new Date(profile.billing_cycle_start);
  const now = new Date();
  const daysSinceCycle = Math.floor(
    (now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceCycle >= 30) {
    // Reset cycle
    await supabase
      .from("profiles")
      .update({
        analyses_used: 0,
        billing_cycle_start: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", userId);

    return {
      allowed: true,
      plan: profile.plan,
      used: 0,
      limit: profile.analyses_limit,
    };
  }

  return {
    allowed: profile.analyses_used < profile.analyses_limit,
    plan: profile.plan,
    used: profile.analyses_used,
    limit: profile.analyses_limit,
  };
}

export async function incrementUsage(userId: string) {
  const supabase = getServiceSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("analyses_used")
    .eq("id", userId)
    .single();

  if (!profile) return;

  await supabase
    .from("profiles")
    .update({
      analyses_used: profile.analyses_used + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
}
