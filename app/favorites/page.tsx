"use client";
import React, { useState, useEffect } from 'react';
import { Heart, Trophy, ChevronLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase-client'; // ⚠️ ตรวจสอบ Path ของมึงด้วย
import Image from 'next/image';

// กำหนด Interface ให้ตรงกับที่ดึงจาก DB
interface IFavoriteItem {
  favId: number;
  nameTh: string;
  nameEn: string;
  meaning: string;
  tag: string;
}
interface IPetNameRecord {
  name: string;
  meaning: string;
  type: string;
}

// โครงสร้างข้อมูลจากการ Join ในตาราง favorites
interface IFavoriteResponse {
  id: number;
  pet_names: IPetNameRecord | IPetNameRecord[] | null; 
}

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<IFavoriteItem[]>([]);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 1. ดึง User Session ก่อน
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        fetchFavorites(session.user.id);
      } else {
        setLoading(false);
      }
    };
    getSession();
  }, []);

  // 2. ฟังก์ชันดึงข้อมูลจาก Supabase แบบ Join Table
  const fetchFavorites = async (currentUserId: string) => {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id,
        pet_names (
          name,
          meaning,
          type
        )
      `)
      .eq('user_id', currentUserId);

    if (error) throw error;

    if (data) {
      // ✅ บอก TS ว่า data ที่ได้มาคือ Array ของ IFavoriteResponse
      const rawData = data as unknown as IFavoriteResponse[];

      const cleanedData = rawData.map((item) => {
        // จัดการกับ pet_names ที่อาจมาเป็น Array หรือ Object
        const pet = Array.isArray(item.pet_names) 
          ? item.pet_names[0] 
          : item.pet_names;

        if (!pet) return null;

        // ลบดอกจัน (Markdown)
        const rawName = pet.name.replace(/\*/g, '').trim();
        
        const nameTh = rawName.split(' (')[0].trim();
        const nameEnMatch = rawName.match(/\(([^)]+)\)/);
        let nameEn = nameEnMatch ? nameEnMatch[1].trim() : "";
        
        // กันชื่อซ้ำในวงเล็บ
        if (nameEn === nameTh) nameEn = "";

        return {
          favId: item.id, //
          nameTh,
          nameEn,
          meaning: pet.meaning.replace(/\*/g, '').trim(),
          tag: pet.type || "ทั่วไป" //
        };
      }).filter((f): f is IFavoriteItem => f !== null);

      setFavorites(cleanedData);
    }
  } catch (err) {
    console.error("Error fetching favorites:", err);
  } finally {
    setLoading(false);
  }
};

  // 3. แท็บกรองข้อมูล (ดึงจาก Tag ใน DB)
  const tabs = ["ทั้งหมด", "น่ารัก / น่ากอด", "เท่ / เจ๋ง", "มีความหมายดี", "แบบสั้นจำง่าย", "อื่นๆ"];

  // 4. ฟังก์ชันลบออกจากรายการโปรดใน DB
  const removeFavorite = async (favId: number) => {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favId);

    if (!error) {
      setFavorites(prev => prev.filter(f => f.favId !== favId));
    }
  };

  const filteredFavorites = activeTab === "ทั้งหมด" 
    ? favorites 
    : favorites.filter(f => f.tag.includes(activeTab));

  if (loading) return <div className="min-h-screen flex items-center justify-center">กำลังโหลดรายการโปรด...</div>;
  if (!userId) return <div className="min-h-screen flex items-center justify-center">กรุณาเข้าสู่ระบบก่อนมึง!</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-8 relative w-full max-w-2xl">
        
        <h1 className="text-4xl font-black text-[#4A628A] mb-1">Favorites</h1>
        <p className="text-slate-400 font-medium">ชื่อโปรดของคุณ</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar max-w-4xl w-full justify-center pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm border whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-[#FFB233] text-white border-transparent shadow-orange-200' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-orange-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Container สีส้ม */}
      <div 
  className="w-full max-w-6xl rounded-[1rem] p-6 md:p-12 shadow-2xl bg-[linear-gradient(120deg,#FE972A_0%,#FA972A_50%,#FFBE39_120%)]"
>
        <div className="flex flex-col gap-5">
          {filteredFavorites.length > 0 ? (
            filteredFavorites.map((item, index) => (
              <div 
                key={item.favId} 
                className="bg-white rounded-[1.8rem] p-6 flex items-center gap-5 shadow-sm relative group hover:scale-[1.01] transition-all duration-300"
              >
                {/* Icon ถ้วยรางวัล */}
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${index < 2 ? 'bg-orange-50 text-orange-400' : 'bg-slate-50 text-slate-300'}`}>
                  <Trophy size={24} fill={index < 2 ? "currentColor" : "none"} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col md:flex-row md:items-center gap-3 mb-1.5">
                    <h3 className="text-xl font-black text-[#4A628A]">
                      {item.nameTh} {item.nameEn && <span className="text-slate-400 font-bold ml-1">{item.nameEn}</span>}
                    </h3>
                    <span className="inline-block px-4 py-1 rounded-full bg-[#83E2E2] text-white text-[11px] font-black w-fit shadow-sm">
                      {item.tag}
                    </span>
                  </div>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    <span className="font-bold text-slate-400">ความหมาย : </span>
                    {item.meaning}
                  </p>
                </div>

                {/*ปุ่มลบ (หัวใจสีแดง) */}
                <button 
                  onClick={() => removeFavorite(item.favId)}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white text-red-500 shadow-md border border-slate-50 hover:bg-red-50 hover:scale-110 transition-all"
                >
                  <Heart size={22} fill="currentColor" />
                </button>
              </div>
            ))
          ) : (
            <div className=" py-24 text-center  ">
             <Image src="/notype.png" alt="No Favorites" width={300} height={200} className="mx-auto mb-6 opacity-70" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}