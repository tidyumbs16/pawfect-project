import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// 1. เพิ่มคำว่า async ตรงนี้
export async function supabaseServer() {
  // 2. เพิ่มคำว่า await ตรงนี้
  const cookieStore = await cookies(); 

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // กรณีรันใน Server Component จะ set cookie ไม่ได้ ให้ปล่อยผ่านไป
          }
        },
      },
    }
  );
}