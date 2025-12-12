import { Elysia, t } from "elysia";
import { createClient } from "@supabase/supabase-js";
import { cors } from "@elysiajs/cors";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

// --- CONFIGURATION ---
const SUPABASE_URL = "https://ftnpmacfevlvboeohnkc.supabase.co"
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0bnBtYWNmZXZsdmJvZW9obmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyNjU4OTUsImV4cCI6MjA3ODg0MTg5NX0.zfP7A0RmLpssIZ77aU1NPaqjXiUgk2ZpbqcwyGZLzzU"

console.log("🔍 CHECKING ENV VARS:");
console.log("URL:", SUPABASE_URL ? "✅ Found" : "❌ Missing");
console.log("KEY:", SUPABASE_KEY ? "✅ Found" : "❌ Missing");

const prisma = new PrismaClient();

const app = new Elysia()
  .use(cors())
  .decorate("prisma", prisma)

  // 2. Middleware: Inject Prisma & Supabase into Context
  .derive(({ headers }) => {
    const authHeader = headers["authorization"];
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
    });

    return { supabase, token, prisma };
  })

  // --- GROUP 1: AUTHENTICATION ---
  .group("/api/auth", (app) =>
    app
      .post("/register", async ({ body, supabase, set, prisma }) => {
        const { email, password, username } = body;

        // 1. Create User in Supabase Auth
        const { data, error } = await supabase.auth.signUp({ email, password });

        if (error) {
          set.status = 400;
          return { success: false, message: error.message };
        }

        // 2. Create Profile in Database via Prisma
        if (data.user) {
          try {
            await prisma.profiles.create({
              data: {
                id: data.user.id,
                username: username,
                avatar_url: null,
              }
            });
          } catch (dbError) {
            console.error("DB Profile Creation Error:", dbError);
            // ไม่ return error เพราะ Auth สำเร็จแล้ว แค่ Profile อาจจะยังไม่มา
          }
        }

        return { success: true };
      }, {
        body: t.Object({
          email: t.String(),
          password: t.String(),
          username: t.String()
        })
      })

      .post("/login", async ({ body, supabase, set }) => {
        console.log("🔥 Login Request Received:", body.email);

        try {
          const { email, password } = body;
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set.status = 400;
            return { ok: false, message: error.message };
          }

          return {
            ok: true,
            user: data.user,
            session: data.session,
          };

        } catch (err) {
          console.error("💀 SERVER CRASH:", err);
          set.status = 500;
          return { ok: false, message: "Internal Server Error" };
        }
      }, {
        body: t.Object({
          email: t.String(),
          password: t.String()
        })
      })

      .post("/logout", async ({ supabase }) => {
        await supabase.auth.signOut();
        return { ok: true };
      })

      .get("/session", async ({ supabase, token, prisma }) => {
        if (!token) return { ok: false, user: null };

        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          return { ok: false, user: null };
        }

        // Fetch Profile via Prisma
        const profile = await prisma.profiles.findUnique({
          where: { id: user.id },
          select: { username: true }
        });

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

  // --- GROUP 2: PROFILE ---
  .group("/api/profile", (app) =>
    app.put("/update", async ({ body, supabase, token, prisma }) => {
      if (!token) return { ok: false, message: "Unauthorized" };

      const { id, ...updates } = body;

      // Validate Owner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== id) return { ok: false, message: "Forbidden" };

      try {
        await prisma.profiles.update({
          where: { id: id },
          data: updates
        });
        return { ok: true };
      } catch (e) {
        // แก้ไข: ใช้ Type Check แทน any
        const message = e instanceof Error ? e.message : String(e);
        return { ok: false, message };
      }
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


  .group("/api/pets", (app) =>
  app
    // GET: ดึงสัตว์เลี้ยงทั้งหมด
    .get("/", async ({ prisma }) => {
  try {
    const pets = await prisma.pet.findMany({
      orderBy: { createdAt: "desc" }
    })

    const petsWithOwner = await Promise.all(
      pets.map(async (pet) => {
        const owner = await prisma.profiles.findUnique({
          where: { id: pet.owner_id },
          select: {
            id: true,
            username: true,
            avatar_url: true,
          },
        })

        return {
          ...pet,
          owner,
        }
      })
    )

    return petsWithOwner
  } catch (error) {
    console.error("Error fetching pets:", error)
    return { error: "Failed to fetch pets" }
  }
})


    // POST: เพิ่มสัตว์เลี้ยง
.post(
  "/",
  async ({ body, prisma, supabase, token, set }) => {
    const { name, image } = body;

    // ✅ ต้องมี token
    if (!token) {
      set.status = 401;
      return { error: "Unauthorized: Please login first" };
    }

    // ✅ ดึง user จาก token
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      set.status = 401;
      return { error: "Invalid token or user not found" };
    }

    const owner_id = user.id; // ✅ ได้ uuid ชัวร์

    try {
      const newPet = await prisma.pet.create({
        data: {
          name,
          image,
          owner_id, // ✅ ไม่เป็น null แน่นอน
        },
      });

      return newPet;
    } catch (err) {
      console.error("Error creating pet:", err);
      set.status = 500;
      return { error: "Failed to create pet" };
    }
  },
  {
    body: t.Object({
      name: t.String(),
      image: t.Optional(t.Nullable(t.String())),
    }),
  }
)


    // GET: ดึงสัตว์เลี้ยงตาม ID
.get("/:id", async ({ prisma, params, set }) => {
  const id = params.id

  try {
    const pet = await prisma.pet.findUnique({
      where: { id }
    })

    if (!pet) {
      set.status = 404
      return { error: `Pet with ID ${id} not found` }
    }

    const owner = await prisma.profiles.findUnique({
      where: { id: pet.owner_id },
      select: {
        id: true,
        username: true,
        avatar_url: true,
      },
    })

    return {
      ...pet,
      owner,
    }
  } catch (error) {
    console.error(`Error fetching pet ${id}:`, error)
    return { error: "Failed to fetch pet details" }
  }
})


    // PATCH: แก้ไขข้อมูลสัตว์เลี้ยง (ต้องเป็นเจ้าของเท่านั้น)
    .patch(
      "/:id",
      async ({ body, prisma, supabase, token, params, set }) => {
        const petId = params.id;
        const { name, image } = body;

        // 1. ตรวจสอบการยืนยันตัวตน
        if (!token) {
          set.status = 401; // Unauthorized
          return { error: "Unauthorized: Please log in to update a pet." };
        }

        const { data: { user } } = await supabase.auth.getUser(token);
        const owner_id = user?.id;

        if (!owner_id) {
          set.status = 401; // Unauthorized
          return { error: "Unauthorized: Invalid authentication token." };
        }

        // 2. ดึงสัตว์เลี้ยงเดิมและตรวจสอบความเป็นเจ้าของ
        const existingPet = await prisma.pet.findUnique({
          where: { id: petId },
        });

        if (!existingPet) {
          set.status = 404; // Not Found
          return { error: `Pet with ID ${petId} not found.` };
        }

        if (existingPet.owner_id !== owner_id) {
          set.status = 403; // Forbidden
          return { error: "Forbidden: You do not own this pet." };
        }

        // 3. เตรียมข้อมูลสำหรับอัปเดต (เพื่อไม่ให้เกิดการอัปเดตค่า null/undefined โดยไม่จำเป็น)
        const dataToUpdate: { name?: string; image?: string | null } = {};
        if (name !== undefined) dataToUpdate.name = name;
        if (image !== undefined) dataToUpdate.image = image;

        // 4. ทำการอัปเดต
        try {
          const updatedPet = await prisma.pet.update({
            where: { id: petId },
            data: dataToUpdate,
          });
          return updatedPet;
        } catch (error) {
          console.error(`Error updating pet ${petId}:`, error);
          return { error: "Failed to update pet" };
        }
      },
      {
        // Schema สำหรับการอัปเดตแบบ Partial (บางส่วน)
        body: t.Object({
          name: t.Optional(t.String()),
          image: t.Optional(t.Nullable(t.String())), // อนุญาตให้เป็น null เพื่อลบภาพได้
        }),
      }
    )

    // DELETE: ลบสัตว์เลี้ยง (ต้องเป็นเจ้าของเท่านั้น)
    .delete("/:id", async ({ prisma, supabase, token, params, set }) => {
      const petId = params.id;

      // 1. ตรวจสอบการยืนยันตัวตน
      if (!token) {
        set.status = 401; // Unauthorized
        return { error: "Unauthorized: Please log in to delete a pet." };
      }

      const { data: { user } } = await supabase.auth.getUser(token);
      const owner_id = user?.id;

      if (!owner_id) {
        set.status = 401; // Unauthorized
        return { error: "Unauthorized: Invalid authentication token." };
      }

      // 2. ดึงสัตว์เลี้ยงเดิมและตรวจสอบความเป็นเจ้าของ
      const existingPet = await prisma.pet.findUnique({
        where: { id: petId },
      });

      if (!existingPet) {
        set.status = 404; // Not Found
        // แม้ว่าจะไม่พบสัตว์เลี้ยง แต่เราจะตอบกลับว่าสำเร็จเพื่อหลีกเลี่ยงการเปิดเผยข้อมูล (Idempotency)
        // แต่ในบริบทนี้ เพื่อการดีบั๊กและชัดเจน เราจะใช้ 404
        return { error: `Pet with ID ${petId} not found.` };
      }

      if (existingPet.owner_id !== owner_id) {
        set.status = 403; // Forbidden
        return { error: "Forbidden: You do not own this pet." };
      }

      // 3. ทำการลบ
      try {
        await prisma.pet.delete({
          where: { id: petId },
        });
        set.status = 204; // No Content (การลบสำเร็จ)
        return null;
      } catch (error) {
        console.error(`Error deleting pet ${petId}:`, error);
        set.status = 500;
        return { error: "Failed to delete pet" };
      }
    })
)



.group("/api/appointment", (app) =>
  app
    // GET: ดึงกิจกรรมทั้งหมดของสัตว์ตัวนี้
    .get("/", async ({ query }) => {
      try {
        const { pet_id } = query;
        if (!pet_id) return { error: "pet_id is required" };

        const appointments = await prisma.appointments.findMany({
          where: { pet_id }, // ใช้ string UUID ตรงๆ
          orderBy: { appointment_date: "asc" },
        });

        return appointments;
      } catch (error) {
        console.error("GET /api/appointment error:", error);
        return { error: "Internal Server Error" };
      }
    })

    // POST: เพิ่มกิจกรรมใหม่
    .post(
      "/",
      async ({ body }) => {
        try {
          const { title, description, appointment_date, pet_id, } = body;

          if (!title || !appointment_date || !pet_id) {
            return { error: "title, appointment_date, and pet_id are required" };
          }

          const newAppointment = await prisma.appointments.create({
            data: {
              title,
              description,
              appointment_date: new Date(appointment_date), // แปลง string → Date
              pet_id, // UUID string
              status: "pending",
              is_notification_enabled: true,
            },
          });

          console.log("Created appointment:", newAppointment);
          return newAppointment;
        } catch (error) {
          console.error("POST /api/appointment error:", error);
          return { error: "Internal Server Error" };
        }
      },
      {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          appointment_date: t.String(),
 pet_id: t.String(),
        }),
      }
    )

    // DELETE: ลบกิจกรรม
    .delete("/:id", async ({ params }) => {
      try {
        const { id } = params;
        if (!id) return { error: "id is required" };

        await prisma.appointments.delete({
          where: { id }, // UUID string
        });

        return { message: "Deleted" };
      } catch (error) {
        console.error("DELETE /api/appointment/:id error:", error);
        return { error: "Internal Server Error" };
      }
    })
)






  // --- GROUP 4: DIARIES (เพิ่มใหม่ให้ครบวงจร) ---
  .group("/api/diaries", (app) =>
    app
      // GET: ดึง Diary ตาม Pet ID
      .get("/:petId", async ({ params, prisma }) => {
        try {
          const diaries = await prisma.diary.findMany({
            where: { pet_id: params.petId },
            orderBy: { created_at: 'desc' }
          });
          return diaries;
        } catch (error) {
          return { error: "Failed to fetch diaries" };
        }
      })

      // POST: สร้าง Diary
      .post("/", async ({ body, prisma }) => {
        const { pet_id, title, content, image_url } = body;
        try {
          const newDiary = await prisma.diary.create({
            data: {
              pet_id,
              title,
              content,
              image_urls: image_url ? [image_url] : [], // สมมติ schema เก็บเป็น String[]
            }
          });
          return newDiary;
        } catch (error) {
          return { error: "Failed to create diary" };
        }
      }, {
        body: t.Object({
          pet_id: t.String(),
          title: t.String(),
          content: t.Optional(t.String()),
          image_url: t.Optional(t.Nullable(t.String()))
        })
      })
  )

  .listen(3001);

console.log(`🦊 Elysia Server is running at ${app.server?.hostname}:${app.server?.port}`);