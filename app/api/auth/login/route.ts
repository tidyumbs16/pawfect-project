import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

 const supabase = await supabaseServer();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message });
  }

  // สำคัญ!! Response ต้องสร้างใหม่เพื่อให้ Supabase เซ็ต cookie ลงไปได้
  const res = NextResponse.json({
    ok: true,
    user: data.user,
  });

  return res;
}
