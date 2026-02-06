"use client";
import React from 'react';
import { Heart, Trophy } from "lucide-react";

interface RankCardProps {
  index: number; // รับลำดับมาเพื่อโชว์ถ้วย
  nameTh: string;
  nameEn: string;
  tag: string;
  meaning: string;
  isAlreadyLiked: boolean;
  onLike: () => void;
  userId?: string | null;
}

const RankCard = ({ index, nameTh, nameEn, tag, meaning, isAlreadyLiked, onLike, userId }: RankCardProps) => {  
 
  const processTags = (tagStr: string) => {
    if (!tagStr) return ["แนะนำ"];
    return tagStr
      .split(/[,\/\s|]+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
  e.preventDefault();
  
  if (!userId) {
    // 🚀 ถ้าไม่ Login ก็สั่งเปลี่ยนหน้าด้วย JS ปกติเลยสัส!
    window.location.href = '/auth/login'; 
    return;
  }

  onLike(); // ✅ ถ้า Login แล้วก็ทำงานปกติ
};

  const tagsArray = processTags(tag);
  const displayTags = tagsArray.join(" / ");

  // 🔥 Logic ถ้วยรางวัลตามอันดับ (0=ทอง, 1=เงิน, 2=ทองแดง)
  const getTrophy = (idx: number) => {
    if (idx === 0) return <Trophy size={28} fill="#FFD700" color="#FFD700" className="shrink-0" />;
    if (idx === 1) return <Trophy size={28} fill="#C0C0C0" color="#C0C0C0" className="shrink-0" />;
    if (idx === 2) return <Trophy size={28} fill="#CD7F32" color="#CD7F32" className="shrink-0" />;
    return null; // อันดับอื่นไม่โชว์ถ้วย หรือจะเปลี่ยนเป็นตัวเลขก็ได้
  };

  return (
   <div className="max-w-[990px] w-full h-[160px] rounded-lg p-5 border border-white flex flex-col gap-4 shrink-0 transition-all shadow-lg bg-white relative">
  <div className="flex justify-between items-start gap-2">
    <div className="flex items-start gap-3 min-w-0">
      {/* 1. ถ้วยรางวัล อยู่ที่เดิม */}
      <div className="shrink-0 mt-1">
        {getTrophy(index)}
      </div>

      {/* 2. ชื่อ (บน) และ แท็ก (ล่าง) */}
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="text-[24px] font-black text-[#4A628A] truncate">
          {nameTh}{nameEn ? ` (${nameEn})` : ""}
        </h3>
        
        <div className="flex ">
          <span className="px-5 py-1.5 rounded-xl bg-gradient-to-r from-[#69E3F0] to-[#B6F0D7] text-white text-[12px] font-black shadow-sm">
            {displayTags}
          </span>
        </div>
      </div>
    </div>

    {/* 3. ปุ่มหัวใจ อยู่ฝั่งขวาที่เดิม */}
    <div className="shrink-0">
      <button 
       onClick={handleLikeClick}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 shadow-md ${
          isAlreadyLiked ? 'bg-[#FA787C] text-white' : 'bg-[#E5E7EB] text-white'
        }`}
      >
        <Heart 
          size={18} 
          fill={isAlreadyLiked ? "currentColor" : "none"} 
          strokeWidth={isAlreadyLiked ? 0 : 3} 
        />
      </button>
    </div>
  </div>

  <p className="text-[16px] text-slate-500 font-normal leading-relaxed whitespace-normal break-words ml-5 mt-1.5">
    ความหมาย : {meaning}
  </p>
</div>
  );
};

export default RankCard;