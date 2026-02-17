import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorizedResponse, ensureProfile, getUserProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  const profile = await getUserProfile(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}

export async function POST(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorizedResponse();

  try {
    await ensureProfile(user.id, user.email || "");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 500 }
    );
  }
}
