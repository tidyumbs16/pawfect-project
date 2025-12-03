import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { email, password, username } = await req.json();

  // signup
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }

  // Insert profile
  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      username: username,
      avatar_url: null,
    });
  }

  return NextResponse.json({ success: true });
}
