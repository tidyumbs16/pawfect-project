// lib/supabase-server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { parse } from "cookie";

export function supabaseServer(req: Request) {
  const cookieHeader = req.headers.get("Cookie") ?? "";
  const cookies = parse(cookieHeader);

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookies[name];
        },
        set(name: string, value: string, options: CookieOptions) {},
        remove(name: string, options: CookieOptions) {},
      },
    }
  );
}
