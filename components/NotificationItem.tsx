// components/NotificationItem.tsx
import { X } from "lucide-react";
import React from "react"; 

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
    // 💡 Prop ใหม่: isToday เป็นตัวกำหนดสีส้ม
    isToday: boolean; 
    // Prop เดิม: isPastTab ใช้กำหนดปุ่มลบ (ถ้าต้องการ)
    isPastTab: boolean; 
};

// เปลี่ยนชื่อ Prop ที่รับเข้ามาเล็กน้อย
export default function NotificationItem({ notification, onDismiss, isToday, isPastTab }: NotificationItemProps) {
    
    // 🚀 Logic การกำหนดสีพื้นหลังและสีข้อความ: ใช้ isToday เท่านั้นในการกำหนดสีส้ม
    const isHighlighted = isToday; // สีส้มจะแสดงเฉพาะเมื่อ isToday เป็น true

    const backgroundClass = isHighlighted ? 
        'bg-orange-100 border-l-4 border-orange-500' : 
        'bg-white';                        

    const titleClass = isHighlighted ? 
        'text-orange-700 font-bold' : 
        'text-slate-700 font-semibold';

    const detailTextClass = isHighlighted ? 
        'text-orange-500' : 
        'text-gray-500';


    const formatDate = (dateStr: string) => {
        // ... (Logic เดิม) ...
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('th-TH', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const handleDismiss = (e: React.MouseEvent) => {
        // ... (Logic เดิม) ...
        e.stopPropagation(); 
        if (onDismiss) {
            onDismiss(notification.id);
        }
    };




    return (
        <div className={`
            p-3 
            flex items-start justify-between 
            ${backgroundClass} 
            transition-colors duration-200
        `}>
            
            {/* ... (ส่วน Image และ Content เหมือนเดิม) ... */}
            <div className="flex gap-3 flex-1 min-w-0"> 
                
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {/* ... (Image Logic เดิม) ... */}
                    {notification.pets.image ? (
                        <img
                            src={notification.pets.image}
                            alt={notification.pets.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            🐾
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className={`text-sm ${titleClass}`}>
                        {notification.title}
                    </p>
                    
                    <p className={`text-xs ${detailTextClass} truncate`}>
                        {notification.pets.name} • {formatDate(notification.appointment_date)}
                    </p>
                    
                    {notification.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {notification.description}
                        </p>
                    )}
                </div>
            </div>

            {/* ปุ่มลบ - แสดงเฉพาะเมื่อ isPastTab เป็น true */}
            {isPastTab && (
                <button
                    onClick={handleDismiss}
                    className="ml-3 p-1 text-gray-400 hover:text-red-500 transition flex-shrink-0 self-start"
                    title="ลบกิจกรรม"
                >
                    <X size={16} /> 
                </button>
            )}
        </div>
    );
}