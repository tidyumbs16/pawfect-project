import { Elysia, t } from "elysia";
import { createClient } from "@supabase/supabase-js";
import { cors } from "@elysiajs/cors";
import { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import * as dotenv from 'dotenv';
import { supabase } from "@/lib/supabase-client";
import { SupabaseClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI,Part,Content} from "@google/generative-ai";
dotenv.config();

interface GeminiPart {
  text?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
}

interface GeminiContent {
  role: "user" | "model";
  parts: GeminiPart[];
}

interface GeminiResponse {
  candidates?: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
  error?: {
    code: number;
    message: string;
    status: string;
  };
}




// --- CONFIGURATION ---
const RAW_SUPABASE_URL = process.env.SUPABASE_URL;
const RAW_SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!RAW_SUPABASE_URL || !RAW_SUPABASE_KEY) {
    // โค้ดนี้จะหยุด Server ทันทีหากไม่มีคีย์
    throw new Error("❌ Fatal: Supabase Environment Keys are missing. Please check .env file.");
}

const SUPABASE_URL = RAW_SUPABASE_URL; 
const SUPABASE_KEY = RAW_SUPABASE_KEY;

if (!GEMINI_API_KEY) {
    throw new Error("❌ Fatal: Gemini API Key is missing. Please check .env file.");
}

console.log("🔍 CHECKING ENV VARS:");
console.log("URL:", SUPABASE_URL ? "✅ Found" : "❌ Missing");
console.log("KEY:", SUPABASE_KEY ? "✅ Found" : "❌ Missing");
console.log("GEMINI:", GEMINI_API_KEY ? "✅ Found" : "❌ Missing");

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);


async function listModels() {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
  const data = await response.json();
  console.log("มึงใช้ตัวพวกนี้ได้:", JSON.stringify(data, null, 2));
}

listModels();


const model = genAI.getGenerativeModel({ 
  model: "gemini-robotics-er-1.5-preview" // มึงใช้ตัวนี้ได้เลย แรงและฉลาดมาก!
});

console.log("✅ Pawfect AI System Ready ");


const prisma = new PrismaClient();

const app = new Elysia()
  .use(cors())
  .decorate("prisma", prisma)

  // 2. Middleware: Inject Prisma & Supabase into Context
  .derive(({ headers }) => {
  const authHeader = headers["authorization"] || headers["Authorization"];
  
  let token: string | null = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const rawToken = authHeader.split(" ")[1]?.trim();
    // ✅ ดักเผื่อหน้าบ้านส่ง "null" (string) มาอีกชั้น
    if (rawToken && rawToken !== "null") {
      token = rawToken;
    }
  }

  // ✅ บอก TypeScript ว่านี่คือ Object ที่มี Key และ Value เป็น String
  const globalHeaders: Record<string, string> = {};
  
  if (token) {
    globalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    global: {
      headers: globalHeaders,
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

    // =========================
    // PATCH: อัปเดตสถานะ (⭐ สำคัญ)
    // =========================
   .patch(
  "/:id",
  async ({ params, body, set }) => {
    try {
      const { id } = params;
      const { status } = body;

      if (!id) {
        set.status = 400;
        return { error: "id is required" };
      }

      if (!["pending", "completed"].includes(status)) {
        set.status = 400;
        return { error: "Invalid status value" };
      }

      const updated = await prisma.appointments.update({
        where: { id },
        data: { status },
      });

      return updated;
    } catch (error) {
      console.error("PATCH /api/appointment/:id error:", error);
      set.status = 500;
      return { error: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      status: t.String(),
    }),
  }
)

    // =========================
    // DELETE: ลบกิจกรรม
    // =========================
    .delete("/:id", async ({ params, set }) => {
      try {
        const { id } = params;
        if (!id) {
          set.status = 400;
          return { error: "id is required" };
        }

        await prisma.appointments.delete({
          where: { id },
        });

        return { success: true };
      } catch (error) {
        console.error("DELETE /api/appointment/:id error:", error);
        set.status = 500;
        return { error: "Internal Server Error" };
      }
    })
)



.get("/notifications/grouped", async ({ query }) => {
    const { user_id } = query as { user_id?: string };
    if (!user_id) {
        return { error: "user_id required" };
    }

    const now = new Date();

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 🚀 ส่วนที่ 1: การดึงข้อมูลนัดหมาย (เพื่อแสดงผล)
    const appointments = await prisma.appointments.findMany({
        where: {
            pets: {
                owner_id: user_id,
            },
            // ✅ Logic การกรองใหม่: ใช้ OR เพื่อแยกเงื่อนไขการลบตามช่วงเวลา
            OR: [
                // Case 1: นัดหมายวันนี้หรือในอนาคต (ต้องแสดงเสมอ แม้จะมี Record ใน dismissed_notifications)
                {
                    appointment_date: {
                        gte: todayStart, // วันนี้หรือในอนาคต
                    }
                },
                // Case 2: นัดหมายในอดีต (จะแสดงได้ต่อเมื่อ 'ยังไม่' ถูก Dismissed)
                {
                    appointment_date: {
                        lt: todayStart, // ในอดีต
                    },
                    dismissed_notifications: {
                        none: {
                            user_id,
                            is_deleted: true 
                        },
                    }
                }
            ]
        },
        include: {
            pets: {
                select: {
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            appointment_date: "asc",
        },
    });

    const today: typeof appointments = [];
    const upcoming: typeof appointments = [];
    const past: typeof appointments = [];

    for (const a of appointments) {
        if (a.appointment_date >= todayStart && a.appointment_date <= todayEnd) {
            today.push(a);
        } else if (a.appointment_date > todayEnd) {
            upcoming.push(a);
        } else {
            past.push(a);
        }
    }

    // 🚀 ส่วนที่ 2: การคำนวณ Unread Count (ใช้ dismissed_notifications เพื่อกรองรายการที่ "อ่านแล้ว")
    const unreadCount = await prisma.appointments.count({
        where: {
            pets: {
                owner_id: user_id,
            },
            appointment_date: {
gte: todayStart, // นับเฉพาะนัดหมายที่ยังไม่ถึงกำหนด (Today หรือ Future)
            },
            dismissed_notifications: {
                none: {
                    user_id, // และยังไม่มี Record การ "อ่านแล้ว" (Dismiss)
                },
            },
        },
    });

    return {
        ok: true,
        unreadCount,
        groups: {
            today,
            upcoming,
            past,
        },
    };
})





.post("/notifications/dismiss", async ({ body }) => {
    const { user_id, appointment_id } = body as {
        user_id: string;
        appointment_id: string;
    };

    if (!user_id || !appointment_id) {
        return { error: "missing params" };
    }

    try {
        // ✅ ใช้ upsert แทนการเช็ค existing เอง
        await prisma.dismissed_notifications.upsert({
            where: {
                // ตรงนี้ต้องมั่นใจว่าใน schema มึงทำ @@unique([user_id, appointment_id]) ไว้
                user_id_appointment_id: {
                    user_id: user_id,
                    appointment_id: appointment_id
                }
            },
            update: { 
                is_deleted: true // 👈 ถ้ามี Record แล้ว (เช่น แค่เคยอ่าน) ให้เปลี่ยนเป็น "ลบ"
            },
            create: { 
                user_id, 
                appointment_id, 
                is_deleted: true // 👈 ถ้ายังไม่มี ให้สร้างใหม่พร้อมสถานะ "ลบ"
            }
        });

        return { ok: true };
    } catch (error) {
        console.error("Dismiss notification error:", error);
        return { error: "Failed to dismiss notification" };
    }
})




.post("/notifications/mark-all-read", async ({ body }) => {
    const { user_id } = body as { user_id?: string };

    if (!user_id) {
        return { error: "user_id required" };
    }

    try {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
      
    
        const appointmentsToMarkAsRead = await prisma.appointments.findMany({
            where: {
                pets: {
                    owner_id: user_id,
                },
                // ✅ เงื่อนไขใหม่: กรองเฉพาะวันนี้หรือในอนาคต
                appointment_date: {
                   gte: todayStart,
                },
                dismissed_notifications: {
                    none: {
                        user_id,
                    },
                },
            },
            select: {
                id: true,
            },
        });

        // 2. เตรียมข้อมูลและ Bulk Create
        const dismissedData = appointmentsToMarkAsRead.map(appointment => ({
            user_id: user_id,
            appointment_id: appointment.id,
        }));

        if (dismissedData.length === 0) {
            return { ok: true, message: "No unread notifications to mark." };
        }

        const result = await prisma.dismissed_notifications.createMany({
            data: dismissedData,
            skipDuplicates: true,
        });

        return { 
            ok: true, 
            count: result.count,
            message: `Successfully marked ${result.count} future notifications as read.`
        };

    } catch (error) {
        console.error("Mark all read error:", error);
        return { error: "Failed to mark all notifications as read" };
    }
})










  // --- GROUP 4: DIARIES ---
.group("/api/diaries", (app) =>
  app
    /* =======================
      1. GET: ดึงรายการ diary ทั้งหมดของสัตว์เลี้ยง (หน้า List)
    ======================== */
    .get("/:petId", async ({ params, prisma }) => {
      return prisma.diary.findMany({
        where: { pet_id: params.petId },
        orderBy: { log_date: "desc" },
      })
    })

    /* =======================
      2. GET: ดึงข้อมูล diary แค่ใบเดียว (หน้า Detail - image_dfd909)
    ======================== */
    .get("/detail/:diaryId", async ({ params, prisma }) => {
      const diary = await prisma.diary.findUnique({
        where: { id: params.diaryId },
      });
      if (!diary) throw new Error("ไม่พบข้อมูลไดอารี่");
      return diary;
    })

    /* =======================
      3. POST: สร้าง diary ใหม่ + upload รูป
    ======================== */
    .post("/", async ({ request, prisma, supabase }) => { 
      const formData = await request.formData()
      const pet_id = formData.get("pet_id") as string
      const title = formData.get("title") as string
      const content = formData.get("content") as string | null
      const log_date = formData.get("log_date") as string
      const images = formData.getAll("images") as File[]
      
      const imageUrls: string[] = []
      for (const file of images) {
        if (file instanceof File && file.size > 0) {
          const url = await uploadDiaryImage(file, pet_id, supabase) 
          imageUrls.push(url)
        }
      }

      return prisma.diary.create({
        data: {
          pet_id,
          title,
          content,
          log_date: new Date(log_date),
          image_urls: imageUrls,
        },
      })
    })

    /* =======================
      4. PUT: แก้ไข diary (จัดการทั้งรูปเก่าและรูปใหม่ - image_dfdc10)
    ======================== */
    .put("/:diaryId", async ({ params, request, prisma, supabase }) => {
      const formData = await request.formData();
      
      // ดึงข้อมูลเดิมจาก DB มาก่อน
      const diary = await prisma.diary.findUnique({ where: { id: params.diaryId } });
      if (!diary) throw new Error("Diary not found");

      const title = formData.get("title") as string;
      const content = formData.get("content") as string | null;
      const log_date = formData.get("log_date") as string;
      
      // รูปที่จะเก็บไว้ และ รูปที่จะลบทิ้ง (ส่งมาจากหน้าบ้าน)
      const keepUrls = JSON.parse(formData.get("keep_urls") as string || "[]");
      const deleteUrls = JSON.parse(formData.get("delete_urls") as string || "[]");
      const newFiles = formData.getAll("new_images") as File[];

      // ✅ ลบรูปที่ User กดลบ (x) ออกจาก Storage
      if (deleteUrls.length > 0) {
        await Promise.all(deleteUrls.map((url: string) => deleteDiaryImage(url, supabase)));
      }

      // ✅ อัปโหลดรูปใหม่ (ถ้ามี)
      const newUploadedUrls: string[] = [];
      for (const file of newFiles) {
        if (file instanceof File && file.size > 0) {
          const url = await uploadDiaryImage(file, diary.pet_id, supabase);
          newUploadedUrls.push(url);
        }
      }

      // ✅ รวมร่าง URL: รูปเก่าที่เหลืออยู่ + รูปใหม่ที่เพิ่งอัป
      const finalImageUrls = [...keepUrls, ...newUploadedUrls];

      return prisma.diary.update({
        where: { id: params.diaryId },
        data: {
          title,
          content,
          log_date: new Date(log_date),
          image_urls: finalImageUrls,
        },
      });
    })

    /* =======================
      5. DELETE: ลบ diary และรูปทั้งหมดในนั้น
    ======================== */
    .delete("/:diaryId", async ({ params, prisma, supabase }) => {
      const diary = await prisma.diary.findUnique({
        where: { id: params.diaryId },
      })

      if (!diary) throw new Error("Diary not found");

      if (diary.image_urls?.length) {
        await Promise.all(
          diary.image_urls.map(url => deleteDiaryImage(url, supabase))
        );
      }

      return prisma.diary.delete({
        where: { id: params.diaryId },
      })
    })
)




  // --- GROUP 5: CHATBOT with Gemini AI ---

     .group('/api/chatbot', (app) => 
    app
      .onBeforeHandle(({ token, set }) => {
        if (!token) {
          set.status = 401;
          return { error: "Login ก่อนนะมึง" };
        }
      })


      
      .post('/chat', async ({ body, set }) => {
  const { message, history, imageBase64, imageType } = body;
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    console.log("--- STARTING STRICT TYPE FETCH ---");

    // เตรียมก้อนข้อมูลแบบระบุ Type ชัดเจน
    const contents: GeminiContent[] = [
      {
        role: "user",
        parts: [{ text: "Instructions: คุณคือ 'Pawfect AI' ผู้เชี่ยวชาญด้านสัตว์เลี้ยงแสนเป็นมิตร... เข้าใจบทบาทแล้วใช่ไหม?" }]
      },
      {
        role: "model",
        parts: [{ text: "เข้าใจแล้วค่ะ! ฉันคือ Pawfect AI พร้อมช่วยเหลือคุณค่ะ" }]
      },
      ...(history as GeminiContent[] || [])
    ];

    const currentParts: GeminiPart[] = [{ text: message }];
    
    if (imageBase64 && imageType) {
      currentParts.push({
        inlineData: {
          mimeType: imageType,
          data: imageBase64
        }
      });
    }

    contents.push({ role: "user", parts: currentParts });

    const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-robotics-er-1.5-preview:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents })
  }
);

    // Cast ข้อมูลขากลับเป็น Interface ที่เราทำไว้
    const data = (await response.json()) as GeminiResponse;

    if (!response.ok) {
      console.error("❌ Google Error Detail:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Google API Failure");
    }

    const aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    console.log("✅ AI RESPONDED:", aiResponseText?.substring(0, 50) + "...");

    return {
      role: "model",
      text: aiResponseText || "AI นิ่งเงียบไปว่ะมึง"
    };

  } catch (err) {
    const error = err as Error;
    console.error("--- CRITICAL ERROR ---", error.message);
    set.status = 500;
    return { error: "พังว่ะมึง: " + error.message };
  }
}, {
  body: t.Object({
    message: t.String(),
    history: t.Optional(t.Array(t.Object({
      role: t.Union([t.Literal('user'), t.Literal('model')]),
      parts: t.Array(t.Object({ 
        text: t.Optional(t.String()),
        inlineData: t.Optional(t.Object({
          mimeType: t.String(),
          data: t.String()
        }))
      }))
    }))),
    imageBase64: t.Optional(t.String()),
    imageType: t.Optional(t.String())
  })
})
     )





  .listen(3001);

console.log(`🦊 Elysia Server is running at ${app.server?.hostname}:${app.server?.port}`);





// ใน Backend: ฟังก์ชัน deleteDiaryImage
async function deleteDiaryImage(url: string, supabaseClient: SupabaseClient) {
  try {
    const bucketName = 'diaries';
    const rawPath = url.includes('http') ? url.split(`/${bucketName}/`)[1] : url;
    
    if (!rawPath) return;

    // ✅ ไม้ตาย: แยกด้วย / -> ลบช่องว่างแต่ละส่วน -> กรองค่าว่างออก -> รวมใหม่
    const path = decodeURIComponent(rawPath)
      .split('/')
      .map(part => part.trim())
      .filter(part => part.length > 0)
      .join('/');

    console.log("🛠️ Path ที่คลีนแล้วจริงๆ:", `"${path}"`);

    const { error } = await supabaseClient.storage
      .from(bucketName)
      .remove([path]);

    if (error) {
      console.error("❌ Storage API Error:", error);
      throw error;
    }
    console.log("✅ ลบสำเร็จ!");
  } catch (err) {
    console.error("💥 ลบรูปพัง:", err);
    throw err;
  }
}




// ✅ เพิ่ม supabaseClient เข้าไปในช่องรับค่า
async function uploadDiaryImage(
  file: File,
  pet_id: string,
  supabaseClient: SupabaseClient // 👈 รับกุญแจที่มี Token มาจาก Handler
): Promise<string> {

  if (!file.type.startsWith("image/")) {
    throw new Error("Invalid file type")
  }

  const ext = file.name.split(".").pop() || "jpg"
  const filePath = `${pet_id}/${crypto.randomUUID()}.${ext}`

  // ✅ เปลี่ยนจาก 'supabase' (ตัวแปร global) เป็น 'supabaseClient' (ตัวที่มี Token)
  const { error } = await supabaseClient.storage
    .from('diaries')
    .upload(filePath, file, {
      contentType: file.type,
    })

  if (error) {
    throw error
  }

  const { data } = supabaseClient.storage
    .from('diaries')
    .getPublicUrl(filePath)

  return data.publicUrl
}

