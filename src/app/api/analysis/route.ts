import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "No analysis ID provided" },
      { status: 400 }
    );
  }

  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from("analyses")
    .select("status, result, processing_error, file_name, created_at")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Analysis not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    status: data.status,
    result: data.result,
    error: data.processing_error,
    fileName: data.file_name,
    createdAt: data.created_at,
  });
}
