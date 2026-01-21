"use client";
import React, { useState } from 'react';
import { Sparkles, RefreshCw, ChevronDown, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface IPetName {
  nameTh: string;
  nameEn: string;
  tag: string;
  meaning: string;
}

// --- 🏆 Component: NameCard (เวอร์ชันมีถ้วยรางวัล จัดวางตามรูปเป๊ะ) ---
const NameCard = ({ nameTh, nameEn, meaning, tag, rank }: IPetName & { rank: number }) => {
  
  // Logic สีของถ้วยรางวัลตามอันดับ 1, 2, 3
  const getRankStyles = (index: number) => {
    switch (index) {
      case 0: return "bg-[#FFB22C] shadow-[#FFB22C]/20"; // อันดับ 1 (ทอง/ส้ม)
      case 1: return "bg-[#BEC3C9] shadow-[#BEC3C9]/20"; // อันดับ 2 (เงิน/เทา)
      case 2: return "bg-[#C86B2C] shadow-[#C86B2C]/20"; // อันดับ 3 (ทองแดง/น้ำตาล)
      default: return "bg-slate-200";
    }
  };

  const processTags = (tagStr: string) => {
    if (!tagStr) return ["แนะนำ"];
    return tagStr.split(/[,\/\s|]+/).map(t => t.trim()).filter(t => t.length > 0);
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-[1rem] p-6 mb-4 flex items-start gap-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_25px_40px_rgba(0,0,0,0.1)] border  border-white transition-all ">
      
      {/* 🏆 ส่วนถ้วยรางวัล (ซ้ายมือ) */}
      <div className={`shrink-0 w-14 h-14  rounded-full flex items-center justify-center shadow-lg ${getRankStyles(rank)}`}>
        <Trophy size={28} className="text-white" fill="white" />
      </div>

      {/* 📝 ส่วนข้อมูลชื่อ (ขวามือ) */}
      <div className="flex flex-col gap-3 mt-3 ml-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-[24px]  font-black text-[#4A628A] leading-none">
            {nameTh}   <span className="font-bold text-[#4A628A]">{nameEn}</span>
          </h3>
          
          {/* Tag สี Gradient ตามรูปแบบมึง */}
          <div className="flex flex-wrap gap-2 mt-3 ">
            <span className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#69E3F0] to-[#B6F0D7] text-white text-[12px] font-black shadow-sm">
              {processTags(tag).join(" / ")}
            </span>
          </div>
        </div>

        <p className="text-[16px] md:text-[15px] text-slate-500 font-bold leading-relaxed mt-3 ml-1">
          ความหมาย : {meaning}
        </p>
      </div>
    </div>
  );
};

export default function PetNameGenerator() {
  const [petType, setPetType] = useState("");
  const [traits, setTraits] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNames, setGeneratedNames] = useState<IPetName[]>([]);

  const handleGenerate = async () => {
    if (!petType || !traits) return alert("กรอกข้อมูลให้ครบก่อนมึง!");
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/api/pet-generator/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ petType, description: traits })
      });
      const data = await response.json();
      if (response.ok) setGeneratedNames(data.names);
    } catch (err) { console.error(err); } 
    finally { setIsGenerating(false); }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] py-12 px-4 font-sans text-[#4A628A]">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black mb-3">สุ่มชื่อสัตว์เลี้ยงด้วย AI</h1>
        <p className="text-slate-500 font-medium">จัดอันดับชื่อที่เหมาะสมที่สุดสำหรับน้องๆ</p>
      </div>

      {/* 🟠 Card Input เดิมของมึง */}
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-orange-400 to-orange-500 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-orange-200 mb-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-white font-bold text-lg ml-1">ประเภทสัตว์เลี้ยง</label>
            <div className="relative">
              <select 
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
                className="w-full bg-[#FFD199] border-none rounded-2xl py-4 px-6 text-orange-900 font-bold appearance-none outline-none cursor-pointer"
              >
                <option value="" disabled>เลือกประเภทสัตว์เลี้ยง</option>
                <option value="หมา">หมา 🐶</option>
                <option value="แมว">แมว 🐱</option>
                <option value="นก">นก 🦜</option>
                <option value="สัตว์ฟันแทะ">สัตว์ฟันแทะ 🐹</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-white font-bold text-lg ml-1">ลักษณะของสัตว์เลี้ยง</label>
            <textarea 
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="เช่น ขนสีขาว ตาสีน้ำเงิน ร่าเริง..."
              className="w-full bg-[#FFD199] border-none rounded-2xl py-5 px-6 text-orange-900 font-bold placeholder-orange-700/40 min-h-[150px] outline-none resize-none"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-white text-orange-500 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all mt-4 disabled:opacity-70"
          >
            {isGenerating ? <RefreshCw className="animate-spin" /> : <RefreshCw size={24} />}
            {isGenerating ? "กำลังประมวลผลอันดับชื่อ..." : "สร้างชื่อและจัดอันดับ"}
          </button>
        </div>
      </div>

      {/* ✨ Results Section: แสดงผลแนวตั้ง (ตามรูปที่มึงส่งมา) */}
      {generatedNames.length > 0 && (
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <h3 className="text-2xl font-black mb-8">ยินดีด้วย! นี่คือชื่อ Pawfect สำหรับเพื่อนซี้ของคุณ!</h3>
          {generatedNames.map((item, idx) => (
            <NameCard 
              key={idx}
              {...item}
              rank={idx} // ส่ง index ไปเป็นอันดับ 0, 1, 2
            />
          ))}
        </div>
      )}
    </div>
  );
}