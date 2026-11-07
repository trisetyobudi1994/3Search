import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rec_id, status } = body;

    if (!rec_id || !["success", "failed"].includes(status)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "Database belum siap" }, { status: 500 });
    }

    const { error } = await supabase.from("feedback").insert({
      recommendation_id: rec_id,
      status: status,
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Feedback error:", err);
    return NextResponse.json({ error: "Gagal menyimpan feedback" }, { status: 500 });
  }
}