"use client";
import React from 'react';
import { Heart } from "lucide-react";
import { Lexend } from "next/font/google";

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});

interface FavoriteCardProps {
  nameTh: string;
  nameEn: string;
  tag: string;
  meaning: string;
  onRemove: () => void;
}

const FavoriteCard = ({ nameTh, nameEn, tag, meaning, onRemove }: FavoriteCardProps) => {
  
  // 🔥 ใช้ Logic เดียวกับหน้าแชทเป๊ะๆ ตามที่มึงสั่ง
  const processTags = (tagStr: string) => {
    if (!tagStr) return ["แนะนำ"];
    return tagStr
      .split(/[,\/\s|]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  };

  const tagsArray = processTags(tag);
  const displayTags = tagsArray.join(" / ");

  return (
   <div className={`max-w-[990px] w-full h-[160px] rounded-lg p-5 border border-white flex flex-col gap-1 shrink-0 transition-all shadow-lg bg-white ${lexend.className}`}>
  <div className="flex justify-between items-start gap-2">
    {/* ฝั่งซ้าย: ชื่ออยู่บน แท็กอยู่ล่าง */}
    <div className="flex flex-col gap-2 ml-9 min-w-0">
      <h3 className="text-[26px] font-black text-[#4A628A] truncate ">
        {nameTh}{nameEn ? ` (${nameEn})` : ""}
      </h3>
      
      {/* แท็กย้ายมาอยู่ใต้ชื่อตรงนี้ */}
      <div className="flex ">
        <span className="px-5 py-1.5 rounded-xl  bg-gradient-to-r from-[#69E3F0] to-[#B6F0D7] text-white text-[12px] font-black shadow-sm">
          {displayTags}
        </span>
      </div>
    </div>

    {/* ฝั่งขวา: ปุ่มหัวใจอยู่ที่เดิมเป๊ะ */}
    <button 
      onClick={(e) => { e.preventDefault(); onRemove(); }} 
      className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 bg-[#FA787C] text-white shadow-md shrink-0"
    >
      <Heart 
        size={18} 
        fill="currentColor" 
        strokeWidth={0} 
      />
    </button>
  </div>

  <p className="text-[16px] text-slate-500 leading-relaxed whitespace-normal ml-11 mt-1.5">
    ความหมาย : {meaning}
  </p>
</div>
  );
};

export default FavoriteCard;