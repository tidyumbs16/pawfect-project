"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import RankCard from '@/components/RankCard';
import { Lexend,Mallanna } from 'next/font/google';

const mallanna = Mallanna({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});


// ข้อมูลชื่อสัตว์เลี้ยงที่ผ่านการ Clean แล้วเพื่อเอาไปโชว์ใน UI
interface IPetName {
  id: number;
  nameTh: string;
  nameEn: string;
  meaning: string;
  tag: string;
  total_hits: number;
}

// ข้อมูลดิบ (Raw Data) ที่ดึงมาจาก Table pet_names ใน Supabase
interface IRawPetName {
  id: number;
  name: string;
  meaning: string;
  type: string;
  total_hits: number;
}

// ข้อมูลจากตาราง favorites
interface IFavoriteRecord {
  name_id: number;
}

export default function PopularPage() {
  const router = useRouter();
  const [items, setItems] = useState<IPetName[]>([]);
  const [userFavorites, setUserFavorites] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("ทั้งหมด");
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      // 1. เช็ค Auth Session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        // ดึงรายการที่ USER คนนี้กด Like ไว้แล้ว
        const { data: favs } = await supabase
          .from('favorites')
          .select('name_id')
          .eq('user_id', session.user.id);
        
        if (favs) {
          const favIds = (favs as IFavoriteRecord[]).map(f => f.name_id);
          setUserFavorites(favIds);
        }
      }
      
      // 2. ดึงข้อมูล Ranking
      fetchRanking();
    };
    init();
  }, []);

  const fetchRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('pet_names')
        .select('id, name, meaning, type, total_hits')
        .order('total_hits', { ascending: false });

      if (data) {
        const rawData = data as IRawPetName[];
        const cleanedData: IPetName[] = rawData.map((item) => {
          const rawName = item.name.replace(/\*/g, '').trim();
          return {
            id: item.id,
            nameTh: rawName.split(' (')[0].trim(),
            nameEn: (rawName.match(/\(([^)]+)\)/) || [])[1] || "",
            meaning: item.meaning.replace(/\*/g, '').trim(),
            tag: item.type || "",
            total_hits: item.total_hits || 0
          };
        });
        setItems(cleanedData);
      }
    } catch (err) {
      console.error("Fetch Ranking Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (item: IPetName) => {
    // 1. เช็คก่อนว่า Login ยัง ถ้าไม่ไล่ไปหน้า Login
    if (!userId) {
      router.push('/login');
      return;
    }

    // 2. เช็คสถานะปัจจุบันว่า "ถูกใจไปแล้วหรือยัง"
    const isLiked = userFavorites.includes(item.id);

    if (isLiked) {
      // --- กรณีที่ 1: กดเพื่อ "เอาออก" (Unlike) ---
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('name_id', item.id);

      if (!error) {
        // อัปเดต State: ลบ ID นี้ออกจากรายการที่ USER ชอบ
        setUserFavorites(prev => prev.filter(id => id !== item.id));
        console.log("ลบออกจากรายการโปรดแล้ว");
      } else {
        console.error("ลบไม่สำเร็จ:", error.message);
      }

    } else {
      // --- กรณีที่ 2: กดเพื่อ "เพิ่ม" (Like) ---
      
      // ก. เพิ่มข้อมูลลงตาราง favorites
      const { error: insertError } = await supabase
        .from('favorites')
        .insert([{ user_id: userId, name_id: item.id }]);

      if (!insertError) {
        // ข. เรียกใช้ RPC เพื่อบวกคะแนนความนิยม (total_hits) ในตาราง pet_names
        const { error: rpcError } = await supabase.rpc('increment_total_hits', { row_id: item.id });
        
        if (rpcError) console.error("บวกคะแนนไม่สำเร็จ:", rpcError.message);

        // ค. อัปเดต UI ทันที: เพิ่ม ID ลงในรายการที่ชอบ และ +1 คะแนนที่โชว์บนหน้าจอ
        setUserFavorites(prev => [...prev, item.id]);
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, total_hits: (i.total_hits || 0) + 1 } : i
        ));
        
        console.log("เพิ่มเข้าความนิยมและรายการโปรดแล้ว");
      } else {
        console.error("เพิ่มไม่สำเร็จ:", insertError.message);
      }
    }
  };



  const tabs = ["ทั้งหมด", "น่ารัก / น่ากอด", "เท่ / เจ๋ง", "ความหมายดี", "ชื่อสั้นจําง่าย", "อื่นๆ"];

  const filteredItems = items.filter((item) => {
    if (activeTab === "ทั้งหมด") return true;
    const itemTags = item.tag.split(/[,\/\s|]+/).map(t => t.trim());
    if (activeTab === "น่ารัก / น่ากอด") return itemTags.some(t => t === "น่ารัก" || t === "น่ากอด");
    if (activeTab === "เท่ / เจ๋ง") return itemTags.some(t => t === "เท่" || t === "เจ๋ง");
    if (activeTab === "ความหมายดี") return itemTags.includes("มีความหมายดี");
    if (activeTab === "ชื่อสั้นจําง่าย") return itemTags.includes("ชื่อสั้นจําง่าย");
    if (activeTab === "อื่นๆ") {
      const mainTags = ["น่ารัก", "น่ากอด", "เท่", "เจ๋ง", "มีความหมายดี", "ชื่อสั้นจําง่าย"];
      return itemTags.every(t => !mainTags.includes(t)) || item.tag === "";
    }
    return false;
  });

  if (loading) return <div className="min-h-screen flex items-center justify-center ">กำลังโหลดอันดับชื่อ...</div>;

  return (
    <div className={`${lexend.className} min-h-screen bg-[#F8FAFC] py-12 px-4 flex flex-col items-center`}>
  <h1 className="text-4xl font-bold text-[#4A628A] mb-3">ชื่อสัตว์เลี้ยงยอดนิยม</h1>
  <h2 className=" text-[17px] text-[#4A628A] mb-8 font-normal">ชื่อที่ไ่ด้รับความนิยมสูงสุด</h2>
  
  {/* ส่วนรูปภาพที่ขยายใหญ่ 900px และเต็มจอซ้ายขวา */}
  <div className="relative w-screen h-[900px] mb-10 -mx-4"> 
    <Image
      src="/toptierpage.png"
      alt="Trophy"
      fill 
      className="object-cover object-center" 
      priority 
    />
  </div>

      {/* --- UI TAB จากโค้ดมึง --- */}
      <div className={`${mallanna.className} w-full max-w-[1152px] h-[70px] mb-8 bg-white/50 border border-white p-1.5 rounded-xl shadow-xl`} >
        <div className="flex gap-2 mb-8 no-scrollbar max-w- w-full justify-center pb-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-[1rem] text-[16px] font-medium transition-all shadow-sm border whitespace-nowrap w-full mt-1 ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-[#FE972A] via-[#FA972A] to-[#FFBE39] text-white border-transparent' 
                  : 'bg-[#C0C0C0]/20 text-[#C0C0C0] border-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* --- Main Container สีส้ม --- */}
      <div className="w-full max-w-6xl rounded-md p-6 shadow-sm bg-linear-to-t from-[#FA972A] via-[#FE972A] to-[#FFBE39]">
        <div className="flex flex-col gap-3 items-center">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <RankCard
                key={item.id}
                index={index}
                nameTh={item.nameTh}
                nameEn={item.nameEn}
                tag={item.tag}
                meaning={item.meaning}
                isAlreadyLiked={userFavorites.includes(item.id)}
                onLike={() => handleToggleLike(item)}
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
  )
};