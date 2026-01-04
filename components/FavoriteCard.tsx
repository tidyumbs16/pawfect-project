"use client";
import React from 'react';
import { Heart } from "lucide-react";

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
    <div className=" max-w- w-full h-[140px] rounded-md p-5 border border-white flex flex-col gap-4 shrink-0 transition-all shadow-lg bg-white">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-baseline min-w-0">
          <h3 className="text-[26px] font-black text-[#4A628A] truncate">
            {nameTh}{nameEn ? ` (${nameEn})` : ""}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {/* Tag สี Gradient เดิมของมึงเป๊ะ */}
          <span className="px-4 py-2  rounded-xl bg-gradient-to-r from-[#69E3F0] to-[#B6F0D7] text-white text-[12px] font-black shadow-sm">
            {displayTags}
          </span>

          {/* ปุ่มหัวใจสีแดง (สถานะ Like แล้ว) ตาม UI มึง */}
          <button 
            onClick={(e) => { e.preventDefault(); onRemove(); }} 
            className="w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 bg-[#FA787C] text-white shadow-md"
          >
            <Heart 
              size={18} 
              fill="currentColor" 
              strokeWidth={0} 
            />
          </button>
        </div>
      </div>

      <p className="text-[16px] text-slate-500  leading-relaxed whitespace-normal break-words">
        ความหมาย : {meaning}
      </p>
    </div>
  );
};

export default FavoriteCard;