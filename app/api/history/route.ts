import { NextRequest, NextResponse } from "next/server";
import { supabase, getAuthenticatedUser } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getAuthenticatedUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    if (!supabase) return NextResponse.json({ error: "DB error" }, { status: 500 });

    const { data, error } = await supabase
      .from("searches")
      .select(`
        id, query, created_at,
        recommendations (product_name, score)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
