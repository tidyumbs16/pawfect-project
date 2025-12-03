// app/api/auth/session/route.ts
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return Response.json({ ok: false, user: null });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .single();

  return Response.json({
    ok: true,
    user: {
      id: session.user.id,
      email: session.user.email,
      username: profile?.username ?? "",
    },
  });
}
