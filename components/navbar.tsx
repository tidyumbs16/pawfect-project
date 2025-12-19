"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Bell } from "lucide-react";
import NotificationItem from "@/components/NotificationItem";
import Tab from "@/components/Tab";
import { useNotifications } from "@/hooks/useNotifications";

// ✅ 1. กำหนด URL Backend
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ICONS
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
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "past">("today");

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    dismissNotification,
    refresh,
    resetUnreadCount,
  } = useNotifications(userId);

  const ref = useRef<HTMLDivElement>(null);

  // 🔥 โหลด session จาก API ของ Bun
  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
        const res = await fetch(`${API_URL}/api/auth/session`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${session.access_token}`
          }
        });

        const json = await res.json();
        if (json.ok) {
          setUsername(json.user.username);
          setUserId(json.user.id);
        }

      } catch (error) {
        console.error("Failed to load user session:", error);
      }
    }

    loadUser();
  }, []); // ✅ แก้แล้ว

  // 🔥 Logout Logic
  const confirmLogout = async () => {
    try {
      await supabase.auth.signOut();

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
    window.location.href = "/";
  };

  const cancelLogout = () => setShowPopup(false);

  // ปิด dropdown เมื่อคลิกนอก
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const currentNotifications = notifications[activeTab];



  useEffect(() => {
    if (open && unreadCount > 0 && resetUnreadCount) {
      // เมื่อ Dropdown ถูกเปิดและมีแจ้งเตือนที่ยังไม่ได้อ่าน
      resetUnreadCount();
    }
  }, [open, unreadCount, resetUnreadCount]);

  return (
    <>
      <nav className="bg-[#F67F00] text-white w-full py-3 px-2 shadow-md">
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

              {/* ✅ Notification */}
            <div className="relative" ref={ref}>
              <button
                onClick={() => setOpen(!open)}
                className="relative flex items-center gap-1.5 hover:text-gray-200"
              >
                <Bell size={20} />
                {/* ✅ Badge แสดงจำนวนการแจ้งเตือน */}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown */}
              {open && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-lg border border-gray-100 z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b font-semibold text-slate-700 flex items-center justify-between">
                    แจ้งเตือนกิจกรรมนัดหมาย
                    <div className="flex items-center gap-2">
                  
                      
                    
                     
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex px-3 py-2 gap-2">
                    <Tab
                      label="วันนี้"
                      active={activeTab === "today"}
                      onClick={() => setActiveTab("today")}
                    />
                    <Tab
                      label="กำลังมาถึง"
                      active={activeTab === "upcoming"}
                      onClick={() => setActiveTab("upcoming")}
                    />
                    <Tab
                      label="ที่ผ่านมา"
                      active={activeTab === "past"}
                      onClick={() => setActiveTab("past")}
                    />
                  
                  </div>


                  {/* Content */}
                  <div className="max-h-96 overflow-y-auto px-2">
                    {isLoading ? (
                      <div className="py-8 text-center text-gray-400">
                        กำลังโหลด...
                      </div>
                    ) : error ? (
                      <div className="py-8 text-center text-red-400">
                        เกิดข้อผิดพลาด: {error}
                      </div>
                    ) : currentNotifications.length === 0 ? (
                      <div className="py-8 text-center text-gray-400">
                        ไม่มีการแจ้งเตือน
                      </div>
                    ) : (
                      currentNotifications.map((notif) => (
 <NotificationItem
 key={notif.id}
notification={notif}
onDismiss={dismissNotification}
              
                           isPastTab={activeTab === "past"}
                           isToday={activeTab === "today"}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>


            {username ? (
              <button
                onClick={() => setShowPopup(true)}
                className="flex items-center gap-1.5 bg-white/25 text-white py-1.5 px-3 rounded-xl hover:bg-white/40 transition"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/auth/login"
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
              <h2 className="text-4xl font-bold text-[#E07502]">จะไปจริงๆหรอ Meow</h2>

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
              <img src="/catcry.png" className="w-[260px] object-contain translate-y-3" alt="cat crying" />
            </div>

          </div>
        </div>
      )}
    </>
  );
}