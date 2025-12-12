"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true); 
  useEffect(() => {
    async function check() {
  
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // ถ้าไม่มี session ให้ดีดไปหน้า login
        router.push("/auth/login");
      } else {
        // ถ้ามี session ให้เลิกโหลดและแสดงเนื้อหา
        setLoading(false);
      }
    }

    check();
  }, [router, supabase]);


  if (loading) {
    return null; // หรือใส่ <LoadingSpinner /> ตรงนี้
  }

  return <>{children}</>;
}