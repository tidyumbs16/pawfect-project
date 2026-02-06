# สรุปโครงสร้างโปรเจกต์ Pawfect Project

เอกสารสรุปโครงสร้างโปรเจกต์และคำอธิบายโดยย่อ (สำหรับนักพัฒนา)

---

## ภาพรวม (Overview)
- **ชื่อโปรเจกต์:** Pawfect Project
- **เทคสแตก:** Next.js 16 (App Router), React 19, TypeScript 5 (strict), Tailwind CSS 4, Supabase (DB + Auth)
- **จุดประสงค์:** เว็บตั้งชื่อสัตว์เลี้ยง พร้อมระบบสมาชิก, หน้าป้องกัน (protected routes), และการเรียกใช้งาน Supabase

---

## คำสั่งสำคัญ
- **เริ่ม dev:** `npm run dev`
- **build:** `npm run build`
- **start:** `npm run start`
- **lint:** `npm run lint`

---

## ตัวแปรสิ่งแวดล้อมที่ต้องมี
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## โครงสร้างโฟลเดอร์หลัก (Top-level)
- `app/` - Next.js App Router (หน้า, layouts, API endpoints ตามโครงสร้าง App Router)
- `components/` - React components (client components, UI ซ้ำ)
- `lib/` - utilities (รวม `supabase-client.ts`, `supabase-server.ts`, `prisma.ts`)
- `prisma/` - schema และการตั้งค่า `schema.prisma`
- `public/` - static assets (fonts, images)
- `server/` - server entry (มี `index.ts` สำหรับงาน server-side เพิ่มเติม)
- ไฟล์ config: `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`

---

## รายละเอียดสำคัญใน `app/`
- `app/layout.tsx` - layout หลักของแอป
- `app/globals.css` - สไตล์ global (Tailwind + custom)
- หน้า (pages) ตัวอย่าง:
  - `app/page.tsx` - หน้า landing
  - `app/auth/login/page.tsx` - หน้าเข้าสู่ระบบ
  - `app/profile/page.tsx` - หน้าโปรไฟล์ (protected)
  - `app/favorites/page.tsx` - หน้าเก็บรายการที่ชอบ (protected)
  - `app/api/auth/*` - API routes สำหรับ auth (login/register/session/logout ตามแนวทางของโปรเจกต์)

---

## คอมโพเนนต์สำคัญ (`components/`)
- `ProtectedClient.tsx` - Wrapper ฝั่ง client สำหรับตรวจสอบ session โดยเรียก `/api/auth/session` และ redirect ถ้าไม่ authenticated
- `navbar.tsx` - Navigation
- `section*.tsx` (section, section2..5) - ส่วนประกอบหน้าหลัก
- การจัดชื่อไฟล์: ใช้ PascalCase สำหรับ component

---

## Auth & Flow (สำคัญ)
สรุปจากไฟล์แนวทางภายในโปรเจกต์:
- ใช้ Supabase สำหรับ Auth และฐานข้อมูล
- Cookie-based token: token ถูกเก็บใน cookie pattern `*-auth-token`
- **Middleware (`middleware.ts`)**: ตรวจสอบ cookie สำหรับเส้นทางที่ถูกป้องกัน (`/profile`, `/favorites`, `/ranking`)
- **API endpoints**: อยู่ใน `app/api/auth/` (POST `/login`, POST `/register`, GET `/session`, POST `/logout`)
- **Client requests**: ต้องส่ง `credentials: "include"` เมื่อเรียก API auth เพื่อให้ cookie ถูกส่ง
- **Server Supabase client:** ใช้ `lib/supabase-server.ts` (Server client factory) และ Next.js 16 pattern (`await cookies()` เมื่อจำเป็น)

---

## `lib/` (Utilities)
- `supabase-client.ts` - ฟังก์ชันสร้าง Supabase client ฝั่ง browser
- `supabase-server.ts` - ฟังก์ชันสร้าง Supabase client ฝั่ง server (รองรับ async cookies)
- `prisma.ts` - การตั้งค่า Prisma client (เชื่อมต่อ DB ตาม `prisma/schema.prisma`)

---

## Prisma
- `prisma/schema.prisma` - schema ของฐานข้อมูล

---

## Public assets
- `public/font/` - ไฟล์ฟอนต์
- อื่น ๆ: รูปภาพสัตว์หรือไอคอนที่ใช้งานใน UI

---

## Server folder
- `server/index.ts` - จุด entry server-side ของโปรเจกต์ (อาจใช้สำหรับงาน background หรือ API เพิ่มเติม)

---

## โค้ดการตั้งค่าและคอนเวนชันที่ควรรู้
- TypeScript: strict mode เปิดใช้งาน
- Styling: Tailwind utility classes ถูกใช้เป็นหลัก (ไม่มี CSS modules ยกเว้น `globals.css`)
- Path alias: มีการตั้งค่า alias (`@/*`) ตามเอกสาร
- Linting: ESLint config ต่อ Next.js + TypeScript

---

## หมายเหตุจากเอกสารแนวทาง (copilot-instructions.md)
- ให้ใช้ `ProtectedClient` ครอบหน้าที่ต้องการ session validation
- API route pattern: `export async function POST(req: Request) { ... return NextResponse.json({ ok: boolean, ... }) }`
- Cookie handling: สำคัญ — `*-auth-token` + `credentials: "include"` ใน fetch
- รักษาข้อความภาษาไทยตามต้นฉบับเมื่อแก้ UI

---

## Next steps / ตัวเลือกเพิ่มเติม
- ต้องการไฟล์เป็น `.docx` หรือ `.doc` ให้บอก ผมจะแปลงจาก Markdown เป็น Word ให้
- ต้องการให้ผมเพิ่มรายละเอียดเชิงลึกของแต่ละไฟล์ (เช่น โค้ดตัวอย่าง หรือลิงก์ไปยังไฟล์) บอกมาได้เลย

---

เอกสารนี้สร้างโดยอัตโนมัติจากโครงสร้าง workspace ปัจจุบัน ณ วันที่ 2026-02-07
