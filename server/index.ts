// src/index.ts
import { Elysia, t } from "elysia";
import { createClient } from "@supabase/supabase-js";
import { cors } from "@elysiajs/cors";

const SUPABASE_URL="https://ftnpmacfevlvboeohnkc.supabase.co"
const SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bnBtYWNmZXZsdmJvZW9obmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjU4OTUsImV4cCI6MjA3ODg0MTg5NX0.zfP7A0RmLpssIZ77aU1NPaqjXiUgk2ZpbqcwyGZLzzU"

console.log("🔍 CHECKING ENV VARS:");
console.log("URL:", SUPABASE_URL ? "✅ Found" : "❌ Missing"); // อย่าปริ้นท์ค่าเต็ม เดี๋ยว Key หลุด
console.log("KEY:", SUPABASE_KEY ? "✅ Found" : "❌ Missing");

const app = new Elysia()
  // ✅ 1. ใส่ CORS ก่อน เพื่อแก้ปัญหา Cross-Origin
  .use(cors())

  // ✅ 2. สร้าง supabase client ให้ทุก Request
  .derive(({ headers }) => {
    const authHeader = headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });

    return { supabase, token };
  })

  .group("/api/auth", (app) =>
    app
      .post("/register", async ({ body, supabase, set }) => {
        const { email, password, username } = body;

        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          set.status = 400;
          return { success: false, message: error.message };
        }

        if (data.user) {
          await supabase.from("profiles").insert({
            id: data.user.id,
            username: username,
            avatar_url: null,
          });
        }

        return { success: true };
      }, {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          username: t.String()
        })
      })

      // POST /api/auth/login
      .post("/login", async ({ body, supabase, set }) => {
    console.log("🔥 Login Request Received:", body); // 1. ดูว่ามีข้อมูลส่งมาไหม

    try {
        const { email, password } = body;
        
        // เช็คก่อนว่าค่ามาครบไหม
        if (!email || !password) {
             throw new Error("Email or Password missing");
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("❌ Supabase Error:", error.message); // 2. ดู Error จาก Supabase
            set.status = 400;
            return { ok: false, message: error.message };
        }

        console.log("✅ Login Success:", data.user?.email); // 3. ถ้าสำเร็จ
        
        return {
            ok: true,
            user: data.user,
            session: data.session, 
        };

    } catch (err) {
        // 4. จับ Error ที่ทำให้ Server 500 (Crashing)
        console.error("💀 SERVER CRASH:", err);
        set.status = 500;
        return { ok: false, message: "Internal Server Error", details: String(err) };
    }
}, {
    body: t.Object({
        email: t.String(),
        password: t.String()
    })
})

      // POST /api/auth/logout
      .post("/logout", async ({ supabase }) => {
        await supabase.auth.signOut();
        return { ok: true };
      })
      
      // GET /api/auth/session
      .get("/session", async ({ supabase, token }) => {
        if (!token) return { ok: false, user: null };

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          return { ok: false, user: null };
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        return {
          ok: true,
          user: {
            id: user.id,
            email: user.email,
            username: profile?.username ?? "",
          },
        };
      })
  )

  // ✅ 4.  Group: /api/profile 
  .group("/api/profile", (app) => 
     app.put("/update", async ({ body, supabase, token }) => {
        if (!token) return { ok: false, message: "Unauthorized" };
        
        const { id, ...updates } = body;
        
        //  ตรวจสอบว่าคนเรียกคือเจ้าของ ID จริง
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.id !== id) return { ok: false, message: "Forbidden" };

        const { error } = await supabase
           .from("profiles")
           .update(updates)
           .eq("id", id);
           
        if (error) return { ok: false, message: error.message };
        return { ok: true };
     }, {
        body: t.Object({
           id: t.String(),
           username: t.String(),
           bio: t.Optional(t.String()),
           gender: t.Optional(t.String()),
           birthdate: t.Optional(t.String())
        })
     })
  )

  .listen(8080);

console.log(`🦊 Elysia Server is running at ${app.server?.hostname}:${app.server?.port}`);