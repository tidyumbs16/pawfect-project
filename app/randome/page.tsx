"use client";
import React, { useState } from "react";
import { Sparkles, RefreshCw, ChevronDown, Trophy, Check } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { AnimatePresence, motion } from "framer-motion";
import { Lexend, Mallanna } from "next/font/google";
import Image from "next/image";

const mallanna = Mallanna({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const lexend = Lexend({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface IPetName {
  nameTh: string;
  nameEn: string;
  tag: string;
  meaning: string;
}

// --- 🏆 Component: NameCard (เวอร์ชันมีถ้วยรางวัล จัดวางตามรูปเป๊ะ) ---
const NameCard = ({
  nameTh,
  nameEn,
  meaning,
  tag,
  rank,
}: IPetName & { rank: number }) => {
  // Logic สีของถ้วยรางวัลตามอันดับ 1, 2, 3
  const getRankStyles = (index: number) => {
    switch (index) {
      case 0:
        return "bg-[#FFB22C] shadow-[#FFB22C]/20"; // อันดับ 1 (ทอง/ส้ม)
      case 1:
        return "bg-[#BEC3C9] shadow-[#BEC3C9]/20"; // อันดับ 2 (เงิน/เทา)
      case 2:
        return "bg-[#C86B2C] shadow-[#C86B2C]/20"; // อันดับ 3 (ทองแดง/น้ำตาล)
      default:
        return "bg-slate-200";
    }
  };

  const processTags = (tagStr: string) => {
    if (!tagStr) return ["แนะนำ"];
    return tagStr
      .split(/[,\/\s|]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  };

  return (
    <div className={`w-full max-w-4xl bg-white rounded-[1rem] p-6 mb-4 flex items-start gap-4 shadow-[0_10px_15px_rgba(0,0,0,0.1),0_25px_40px_rgba(0,0,0,0.1)] border border-white transition-all ${lexend.className}`}>
      {/* 🏆 ส่วนถ้วยรางวัล (ซ้ายมือ) */}
      <div
        className={`shrink-0 w-14 h-14  rounded-full flex items-center justify-center shadow-lg ${getRankStyles(rank)}`}
      >
        <Trophy size={28} className="text-white" fill="white" />
      </div>

      {/* 📝 ส่วนข้อมูลชื่อ (ขวามือ) */}
      <div className="flex flex-col gap-3 mt-3 ml-3">
        <div className="flex flex-col gap-2">
          <h3 className="text-[24px]  font-black text-[#4A628A] leading-none">
            {nameTh} <span className="font-bold text-[#4A628A]">{nameEn}</span>
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
  const [isOpen, setIsOpen] = useState(false);

  const handleGenerate = async () => {
    if (!petType || !traits) return alert("กรอกข้อมูลให้ครบก่อนมึง!");
    setIsGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const response = await fetch(`${API_URL}/api/pet-generator/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ petType, description: traits }),
      });
      const data = await response.json();
      if (response.ok) setGeneratedNames(data.names);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#FDFDFD] py-12 px-4 text-[#4A628A] ${lexend.className}`}>
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black mb-3">
          สุ่มชื่อสัตว์เลี้ยงด้วย AI
        </h1>
        <p className="text-[#4A628A] font-medium">
          จัดอันดับชื่อที่เหมาะสมที่สุดสำหรับน้องๆ
        </p>
      </div>

      <div className={`w-full max-w-6xl mx-auto py-10 px-4 ${lexend.className}`}>
        <div className="flex flex-col items-center">
          {/* 1. ส่วนรูปภาพ: ขยับขึ้นและขยายให้เต็มเพื่อเป็นฐานวัดระยะ */}
          <div className="w-full mb-[-10px] md:mb-[-20px] z-0">
            <Image
              src="/randompage.png"
              alt="Steps Mascot"
              width={1200}
              height={300}
              className="w-full h-auto object-contain scale-105"
              priority
            />
          </div>

          {/* 2. ส่วนข้อความ: ใช้ Flex แทน Grid เพื่อเลื่อนตำแหน่งซ้าย-ขวาได้ละเอียดกว่า */}
          <div className="w-full flex justify-between items-start px-[2%] md:px-[6%] z-10">
            {/* Step 1: ข้อความฝั่งซ้าย */}
            <div className="flex-1 flex flex-col items-center text-center translate-x-[-170px] -md:translate-x-40">
              <h3 className="text-[16px] md:text-[22px] font-black text-[#4A628A] mb-1 mt-10 leading-tight">
                ระบุประเภทสัตว์เลี้ยง
              </h3>
              <p className="text-[#4A628A] text-[12px] md:text-[12px] leading-relaxed hidden md:block">
                เลือกประเภทของสัตว์เลี้ยง <br />
                <span className="text-[12px] ">(เช่น น้องหมา, น้องแมว, น้องนก)</span>
              </p>
            </div>

            <div className="flex-1 flex flex-col items-center text-center translate-x-[-20px] -md:translate-x-40">
              <h3 className="text-[16px] md:text-[22px] font-black text-[#4A628A] mb-1 mt-10 leading-tight">
                บอกลักษณะเฉพาะตัว
              </h3>
              <p className="text-[#4A628A] text-[12px] md:text-[12px] leading-relaxed hidden md:block">
                ป้อนลักษณะนิสัย (เช่น ขี้เล่น, ขี้อ้อน, สง่างาม) <br />
                <span className="text-[12px] ">หรือสีสัน/สไตล์ที่คุณต้องการ </span>
              </p>
            </div>

            {/* Step 3: ข้อความฝั่งขวา */}
            <div className="flex-1 flex flex-col items-center text-center translate-x-[30px] md:translate-x-46">
              <h3 className="text-[16px] md:text-[22px] font-black text-[#4A628A] mb-1 mt-10 leading-tight">
                สร้างชื่อทันที
              </h3>
              <p className="text-[#4A628A] text-[12px] md:text-[12px] leading-relaxed hidden md:block">
                กด สร้างชื่อ เพื่อรับชื่อ <br />
                <span className="text-[12px] text-[#4A628A]">ที่ผ่านการวิเคราะห์ด้วย AI</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`max-w-5xl mx-auto bg-linear-to-t from-[#F88409] to-[#FDBB3E] via-[#FA972A] rounded-2xl p-10 md:p-14  shadow-orange-200 mb-16 relative mt-10 ${lexend.className}`}
      >
        {/* ส่วนหัวข้อ */}
        <div className="mb-12">
          <h3 className="text-3xl font-bold text-white mb-1">
            ข้อมูลสัตว์เลี้ยง
          </h3>
          <p className="text-white text-sm mt-5">
            กรอกข้อมูลเพื่อให้ AI สร้างชื่อที่เหมาะสม
          </p>
        </div>

        <div className="space-y-8">
          {/* 1. ประเภทสัตว์เลี้ยง */}
          <div className="space-y-3">
            <label className="text-white font-bold text-md ml-5">
              ประเภทสัตว์เลี้ยง
            </label>
            <div className="relative">
              <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-[#FFFF]/50 border border-white/20 rounded-full py-3 px-6 text-white font-sm flex justify-between items-center cursor-pointer outline-none transition-all"
              >
                <span className={petType ? "text-white" : "text-white/70"}>
                  {petType || "เลือกประเภทสัตว์เลี้ยง"}
                </span>
                <ChevronDown
                  className={`text-white w-5 h-5 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                />
              </div>

              {/* List Options */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-[115%] w-[70%] bg-white rounded-2xl shadow-2xl py-2 z-50 overflow-hidden border border-orange-100"
                  >
                    {[
                      "สุนัข",
                      "แมว",
                      "นก",
                      "สัตว์ฟันแทะ",
                      "สัตว์น้ำ",
                      "สัตว์เลี้ยงพิเศษ (Exotic Pets)",
                    ].map((item) => (
                      <div key={item} className="px-2 py-0.5">
                        <div
                          onClick={() => {
                            setPetType(item);
                            setIsOpen(false);
                          }}
                          className="px-6 py-4 flex justify-between items-center hover:bg-gray-100 hover:rounded-[1rem] hover: cursor-pointer "
                        >
                          <span
                            className={`text-[#4A628A] font-medium ${petType === item ? "text-[#425B80 ] font-bold" : ""}`}
                          >
                            {item}
                          </span>
                          {petType === item && (
                            <Check className="w-5 h-5 text-[#425B80 ]" />
                          )}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* 2. ลักษณะของสัตว์เลี้ยง */}
          <div className="space-y-3 -mt-2">
            <label className="text-white font-bold text-md ml-5">
              ลักษณะของสัตว์เลี้ยง
            </label>
            <textarea
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="เช่น ขนสีขาว ตาสีน้ำเงิน ชอบวิ่งเล่น ร่าเริง น่ารัก..."
              className="w-full bg-[#FFFFFF]/50 border border-white/20 rounded-[2rem] py-6 px-8 text-white font-sm placeholder-white/50 min-h-[180px] outline-none resize-none transition-all  shadow-inner"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-white text-[#FA9529] py-4 rounded-[90px] font-black text-xl flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all mt-4 disabled:opacity-70"
          >
            {isGenerating ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <RefreshCw size={24} />
            )}
            {isGenerating ? "กำลังประมวลผลอันดับชื่อ..." : "สร้างชื่อ"}
          </button>
        </div>
      </div>

      {generatedNames.length > 0 && (
        <div className={`max-w-4xl mx-auto flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-5 duration-700 ${lexend.className}`}>
          <h3 className="text-2xl font-black mb-8 text-[#4A628A]">
            ยินดีด้วย! นี่คือชื่อ Pawfect สำหรับเพื่อนซี้ของคุณ!
          </h3>
          {generatedNames.map((item, idx) => (
            <NameCard
              key={idx}
              {...item}
              rank={idx}
            />
          ))}
        </div>
      )}
    </div>
  );
}
