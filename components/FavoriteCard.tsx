import { Heart } from "lucide-react";

interface FavoriteCardProps {
  nameTh: string;
  nameEn: string;
  tag: string;
  meaning: string;
  onRemove: () => void;
}

const FavoriteCard = ({ nameTh, nameEn, tag, meaning, onRemove }: FavoriteCardProps) => {
  return (
    <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm flex items-start gap-4 relative group">
      {/* Icon ฝั่งซ้ายตามรูป */}
      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
        <span className="text-xl">🏆</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="text-xl font-bold text-[#4A628A]">
            {nameTh} {nameEn && <span className="text-slate-400 font-medium">{nameEn}</span>}
          </h3>
        </div>

        {/* Tag ที่ไม่แยกคำมั่ว */}
        <div className="inline-block px-4 py-1 rounded-full bg-[#69E3F0]/30 text-[#4A628A] text-xs font-bold mb-2">
          {tag}
        </div>

        <p className="text-sm text-slate-500 leading-relaxed">
          ความหมาย : {meaning}
        </p>
      </div>

      {/* ปุ่มหัวใจสีแดงด้านขวา */}
      <button 
        onClick={onRemove}
        className="text-red-400 hover:scale-110 transition-transform"
      >
        <Heart size={24} fill="currentColor" />
      </button>
    </div>
  );
};