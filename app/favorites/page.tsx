"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import FavoriteCard from '@/components/FavoriteCard'; // เช็ค path ให้ถูกนะมึง
import { useRouter } from 'next/navigation';

// --- Interface (ห้ามหาย) ---
interface IFavoriteItem { favId: number; nameTh: string; nameEn: string; meaning: string; tag: string; }
interface IPetNameRecord { name: string; meaning: string; type: string; }
interface IFavoriteResponse { id: number; pet_names: IPetNameRecord | IPetNameRecord[] | null; }

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<IFavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState("ทั้งหมด"); // State ควบคุมแท็บ
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 🚩 ถ้าไม่มี session ให้เตะไปหน้า login ทันที
        router.push('/auth/login'); 
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) { setUserId(session.user.id); fetchFavorites(session.user.id); } 
      else { setLoading(false); }
    };
    getSession();
  }, []);

  const fetchFavorites = async (currentUserId: string) => {
    try {
      const { data, error } = await supabase.from('favorites').select(`id, pet_names ( name, meaning, type )`).eq('user_id', currentUserId);
      if (data) {
        const rawData = data as unknown as IFavoriteResponse[];
        const cleanedData = rawData.map((item) => {
          const pet = Array.isArray(item.pet_names) ? item.pet_names[0] : item.pet_names;
          if (!pet) return null;
          const rawName = pet.name.replace(/\*/g, '').trim();
          return {
            favId: item.id,
            nameTh: rawName.split(' (')[0].trim(),
            nameEn: (rawName.match(/\(([^)]+)\)/) || [])[1] || "",
            meaning: pet.meaning.replace(/\*/g, '').trim(),
            tag: pet.type || "" // แท็กจาก DB
          };
        }).filter((f): f is IFavoriteItem => f !== null);
        setFavorites(cleanedData);
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const removeFavorite = async (favId: number) => {
    const { error } = await supabase.from('favorites').delete().eq('id', favId);
    if (!error) { setFavorites(prev => prev.filter(f => f.favId !== favId)); }
  };

  const tabs = ["ทั้งหมด", "น่ารัก / น่ากอด", "เท่ / เจ๋ง", "ความหมายดี", "ชื่อสั้นจําง่าย", "อื่นๆ"];

  // 🔥🔥🔥 นี่คือ Logic แสดงข้อมูลแยกแท็บที่มึงถามหา 🔥🔥🔥
  const filteredFavorites = favorites.filter((item) => {
    if (activeTab === "ทั้งหมด") return true;

    // แยก tag จาก DB ออกเป็น array (เผื่อมีหลาย tag เช่น "น่ารัก, เท่")
    const itemTags = item.tag.split(/[,\/\s|]+/).map(t => t.trim());

    if (activeTab === "น่ารัก / น่ากอด") {
      return itemTags.some(t => t === "น่ารัก" || t === "น่ากอด");
    }
    if (activeTab === "เท่ / เจ๋ง") {
      return itemTags.some(t => t === "เท่" || t === "เจ๋ง");
    }
    if (activeTab === "มีความหมายดี") {
      return itemTags.includes("มีความหมายดี");
    }
    if (activeTab === "ชื่อสั้นจําง่าย") {
      return itemTags.includes("ชื่อสั้นจําง่าย");
    }
    if (activeTab === "อื่นๆ") {
      const mainTags = ["น่ารัก", "น่ากอด", "เท่", "เจ๋ง", "มีความหมายดี", "ชื่อสั้นจําง่าย"];
      // ถ้าแท็กในตัวมัน ไม่มีอันไหนอยู่ในกลุ่มด้านบนเลย ให้มาอยู่ "อื่นๆ"
      return itemTags.every(t => !mainTags.includes(t)) || item.tag === "";
    }
    return false;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex flex-col items-center">
      <h1 className="text-4xl font-black text-[#4A628A] mb-3  ">Favorites</h1>
      <h2 className="text-lg text-[#4A628A] mb-8">ชื่อโปรดของคุณ</h2>

      {/* --- UI TAB ของมึงเป๊ะๆ (ใส่ Logic setActiveTab แล้ว) --- */}
      <div className="w-full max-w-[1152px] h-[70px] mb-8 bg-white/50 border border-white p-1.5 rounded-xl shadow-xl">
        <div className="flex gap-2 mb-8 no-scrollbar max-w- w-full justify-center pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)} // 🔥 เปลี่ยนแท็บตรงนี้
              className={`px-6 py-2.5 rounded-[1rem] text-sm font-bold transition-all shadow-sm border whitespace-nowrap w-full mt-1.5 ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-[#FE972A] via-[#FA972A] to-[#FFBE39] text-white border-transparent text-[16px] ' 
                  : 'bg-[#C0C0C0]/20 text-[#C0C0C0] text-[16px] border-slate-100 '
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- Main Container สีส้มของมึง --- */}
      <div className="w-full max-w-6xl rounded-lg p-6 shadow-sm bg-linear-to-t from-[#FA972A] via-[#FE972A] to-[#FFBE39]">
        <div className="flex flex-wrap gap-5 justify-center">
          {filteredFavorites.length > 0 ? (
            filteredFavorites.map((item) => (
              <FavoriteCard
                key={item.favId}
                nameTh={item.nameTh}
                nameEn={item.nameEn}
                tag={item.tag}
                meaning={item.meaning}
                onRemove={() => removeFavorite(item.favId)}
              />
            ))
          ) : (
            <div className="py-24 text-center">
              <Image src="/notype.png" alt="Empty" width={300} height={200} className="mx-auto opacity-70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}