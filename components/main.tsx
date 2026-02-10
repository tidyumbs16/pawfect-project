'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";

import {
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

// ✅ 1. กำหนด API URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const PawfectHero = () => {
  const [username, setUsername] = useState<string | null>(null);



  useEffect(() => {
    async function loadUser() {
      // 1. ดึง Token จาก LocalStorage
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) return;

      try {
        // 2. ยิงไปหา Bun Backend แทนการ Query เอง
        const res = await fetch(`${API_URL}/api/auth/session`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}` // แนบ Token ไปด้วย
          }
        });

        const json = await res.json();

        // 3. ถ้าสำเร็จ ให้ setUsername จากข้อมูลที่ Backend ส่งมา
        if (json.ok) {
          setUsername(json.user.username);
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    }

    loadUser();
  }, [supabase]);

  // ===========================
  // ฟังก์ชัน Logout (เผื่อได้ใช้ในอนาคต)
  // ===========================
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsername(null);
    window.location.reload(); // รีเฟรชหน้าจอเพื่อเคลียร์สถานะ
  };

  return (
    <div className="relative w-full h-[650px] md:h-[906px] -mt-9 z-0">
  <Image
    src="/dogmain2.png"
    alt="Hero"
    fill
    priority
    className="
      object-contain  /* ✅ ปรับเป็น contain เพื่อให้เห็นรูปครบทั้งใบ ไม่โดนตัดขอบ */
      -z-10
      absolute 
      inset-0 
    "
  />
</div>
  );
};

export default PawfectHero;