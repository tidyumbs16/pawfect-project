// components/NotificationItem.tsx
import { X } from "lucide-react";
import React from "react";
import { Lexend } from "next/font/google";

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});

type NotificationItemProps = {
  notification: {
    id: string;
    title: string;
    description: string | null;
    appointment_date: string;
    pets: {
      name: string;
      image: string | null;
    };
  };
  onDismiss?: (id: string) => void;
  isToday: boolean;
  isPastTab: boolean;
};

export default function NotificationItem({
  notification,
  onDismiss,
  isToday,
  isPastTab,
}: NotificationItemProps) {
  // 🚀 Logic การกำหนดสีพื้นหลังและสีข้อความ: ใช้ isToday เท่านั้นในการกำหนดสีส้ม
  const isHighlighted = isToday; // สีส้มจะแสดงเฉพาะเมื่อ isToday เป็น true

  const backgroundClass = isHighlighted
  ? "bg-[#FDE8CD] w-full p-4 rounded-none transition-a"
  : "bg-white p-4  border-b border-gray-100";


const titleClass = isHighlighted
  ? "text-[#FA9529] font-bold text-lg" 
  : " font-semibold text-lg text-[#FA9529]";


const detailTextClass = isHighlighted 
  ? "text-[#FA9529] " 
  : "text-[#FA9529]";  

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear() + 543; // +543 ถ้าต้องการเป็น พ.ศ. หรือไม่บวกถ้าต้องการ ค.ศ.
    return `${d}/${m}/${y}`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}.${mm} น.`;
  };

const bgClass = isToday ? `${lexend.className} bg-[#FFF2E5]` : `${lexend.className} bg-white border-b border-gray-50`;
const titleColor = isToday ? "text-[#FA9529]" : "text-[#9C9C9C]"; 
const descColor  = isToday ? "text-[#FA9529] opacity-80" : "text-[#9C9C9C]"; 
const labelColor = isToday ? "text-[#FA9529] opacity-80" : "text-[#9C9C9C]"; 
const valueColor = isToday ? "text-[#FA9529] opacity-80" : "text-[#9C9C9C]";

const handleDismiss = (e: React.MouseEvent) => {
    
    e.stopPropagation();
    if (onDismiss) {
      onDismiss(notification.id);
    }
  };

  return (
  <div className={`${lexend.className} flex items-start gap-3 w-full p-4 rounded-none transition-all ${bgClass}`}>
      {/* รูปสัตว์เลี้ยงวงกลม */}
      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-50">
        {notification.pets.image ? (
          <img src={notification.pets.image} className="w-full h-full object-cover" alt="pet" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">🐾</div>
        )}
      </div>

      {/* รายละเอียดข้อความ */}
      <div className="flex-1 min-w-0">
        <h4 className={`text-[16px] font-bold leading-tight ${titleColor}`}>
          {notification.title}
        </h4>

        <p className={`text-[13px] mt-0.5  ${descColor}`}>
          {notification.description || notification.pets.name}
        </p>

        {/* แถววันที่/เวลา */}
        <div className="flex gap-4 mt-2 items-center mt-2.5">
          <div className="text-[11px] sm:text-xs">
            <span className={labelColor}>วันที่กำหนด : </span>
            <span className={` ${valueColor}`}>
              {formatDate(notification.appointment_date)}
            </span>
          </div>

          <div className="text-[11] sm:text-xs">
            <span className={labelColor}>เวลากำหนด : </span>
            <span className={` ${valueColor}`}>
              {formatTime(notification.appointment_date)}
            </span>
          </div>
        </div>
      </div>

      {/* ปุ่มลบ - แสดงเฉพาะเมื่อ isPastTab เป็น true */}
      {isPastTab && (
       <button
  onClick={handleDismiss}
  className="ml-3 flex items-center justify-center w-6 h-6 bg-[#E5E5E5] hover:bg-red-500 text-white rounded-full transition-all duration-200 flex-shrink-0 self-start active:scale-90 shadow-sm"
  title="ลบกิจกรรม"
>
  <X size={14} strokeWidth={3} />
</button>
      )}
    </div>
  );
}
