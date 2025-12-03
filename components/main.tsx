'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabase-client";

import {
  HeartIcon,
  UserIcon,
} from '@heroicons/react/24/solid';

const PawfectHero = () => {
  const [username, setUsername] = useState<string | null>(null);

  // ===========================
  // โหลดข้อมูล User จาก Supabase
  // ===========================
  useEffect(() => {
    async function loadUser() {
      const { data: sessionData } = await supabaseClient().auth.getSession();

      if (!sessionData.session) return;

      const userId = sessionData.session.user.id;

      const { data: profile } = await supabaseClient()
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .single();

      if (profile) {
        setUsername(profile.username);
      }
    }

    loadUser();
  }, []);

  // ===========================
  // ฟังก์ชัน Logout
  // ===========================
  const handleLogout = async () => {
    await supabaseClient().auth.signOut();
    setUsername(null);
  };

  return (
    
   <div className="relative w-full h-[650px] md:h-[906px]    ">

  <Image
    src="/Frame 54.png"
    alt="Hero"
    fill
    priority
    className="
      object-cover 
      object-center 
      w-auto 
      h-auto 
     -z-10
      absolute 
      inset-0 
      scale-[1.26]
         /* เพิ่มการขยายภาพ */
    "
  />

  
    
    </div>






 


);


};

export default PawfectHero;
