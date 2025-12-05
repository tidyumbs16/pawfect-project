"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";

// ✅ 1. กำหนด URL Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ICONS (เหมือนเดิม)
const IconHome = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const IconHeart = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
    <path fillRule="evenodd" clipRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
  </svg>
);

const IconProfile = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5">
    <path fillRule="evenodd" clipRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-5.5-2.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM10 12a5.99 5.99 0 00-4.793 2.39A6.483 6.483 0 0010 16.5a6.483 6.483 0 004.793-2.11A5.99 5.99 0 0010 12z" />
  </svg>
);

export default function Navbar() {
  const supabase = supabaseClient();
  const [username, setUsername] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  // 🔥 โหลด session จาก API ของ Bun
  useEffect(() => {
    async function loadUser() {
      // 1. ดึง Token จาก Local Storage ของ Browser ก่อน
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return; // ถ้าไม่มี session ก็ไม่ต้องยิงไปถาม Backend

      // 2. ยิงไปหา Bun Backend พร้อมแนบ Token ไปยืนยันตัวตน
      try {
        const res = await fetch(`${API_URL}/api/auth/session`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}` // ✅ สำคัญมาก! ต้องแนบ Token
          }
        });

        const json = await res.json();
        if (json.ok) setUsername(json.user.username);
        
      } catch (error) {
        console.error("Failed to load user session:", error);
      }
    }

    loadUser();
  }, [supabase]); // ใส่ dependency เพื่อความชัวร์



  // 🔥 Logout Logic
  const confirmLogout = async () => {
    try {
      // 1. ลบ Session ใน Browser (Supabase) **สำคัญที่สุด**
      await supabase.auth.signOut();

      // 2. บอก Backend ว่า Logout (Optional แต่ทำไว้ก็ดี)
      // เราแนบ token เก่าไปบอก backend ให้รับรู้ (ถ้า backend มี logic จัดการ)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
         await fetch(`${API_URL}/api/auth/logout`, { 
            method: "POST",
            headers: { "Authorization": `Bearer ${session.access_token}` }
         });
      }

    } catch (error) {
      console.error("Logout error", error);
    }

    setShowPopup(false);
    // 3. รีเฟรชหน้าเว็บเพื่อเคลียร์ State ทุกอย่าง
    window.location.href = "/";
  };

  const cancelLogout = () => setShowPopup(false);

  return (
    <>
      <nav className="bg-[#F67F00] text-white w-full py-3 px-2 shadow-md ">
        <div className="flex items-center justify-between pl-12 pr-12">

          {/* LEFT */}
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold">🐾 Pawfect Name</Link>

            <ul className="flex items-center gap-6 ml-10">
              <li><Link href="/" className="flex items-center gap-1.5 hover:text-gray-200"><IconHome />Home</Link></li>
              <li><Link href="/about" className="hover:text-gray-200">About Us</Link></li>
              <li><Link href="#section5" className="hover:text-gray-200">Contact Us</Link></li>
            </ul>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-6">

            {username && (
              <span className="text-white font-semibold text-lg">
                Welcome, {username} 👋🏻✨
              </span>
            )}

            <Link href="/favorites" className="flex items-center gap-1.5 hover:text-gray-200">
              <IconHeart /> Favorites
            </Link>

            <Link href="/profile" className="flex items-center gap-1.5 hover:text-gray-200">
              <IconProfile /> Profile
            </Link>

            {username ? (
              <button
                onClick={() => setShowPopup(true)}
                className="flex items-center gap-1.5 bg-white/25 text-white py-1.5 px-3 rounded-xl hover:bg-white/40 transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/login" // ✅ ตรวจสอบว่าหน้า Login คุณอยู่ที่ Path นี้จริงไหม
                className="flex items-center gap-1.5 bg-white/25 text-white py-1.5 px-6 rounded-xl hover:bg-white/40 transition"
              >
                Sign In
              </Link>
            )}

          </div>
        </div>
      </nav>

      {/* POPUP */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="relative w-[520px] rounded-3xl shadow-xl text-center overflow-hidden bg-white/80 backdrop-blur-xl">

            <div className="pt-10 pb-4">
              <h2 className="text-4xl font-bold text-[#E07502]">“จะไปจริงๆหรอ Meow”</h2>

              <div className="flex justify-center gap-4 mt-6">
                <button onClick={cancelLogout} className="px-8 py-3 bg-white text-gray-700 rounded-xl shadow">
                  ยกเลิก
                </button>
                <button onClick={confirmLogout} className="px-11 py-3 bg-[#FA9529] text-white rounded-xl shadow">
                  ใช่
                </button>
              </div>
            </div>

            <div className="w-full flex justify-center mt-2">
              <img src="/catcry.png" className="w-[260px] object-contain translate-y-3" />
            </div>

          </div>
        </div>
      )}
    </>
  );
}