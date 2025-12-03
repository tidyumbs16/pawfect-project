// app/api/auth/logout/route.ts
import { supabaseServer } from "@/lib/supabase-server";

export async function POST() {
  const supabase = await supabaseServer();

  await supabase.auth.signOut();

  return Response.json({ ok: true });
}
