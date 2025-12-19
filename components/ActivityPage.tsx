// components/ActivityModal.tsx

import { useState } from "react";

// 1. 🟢 กำหนด Type สำหรับ Props
type ActivityModalProps = {
  // open ใช้ควบคุมการแสดงผล ซึ่งเป็น boolean
  open: boolean; 
  // onClose เป็นฟังก์ชันที่ไม่มี Argument และไม่คืนค่า
  onClose: () => void; 
};

// 2. 🟢 ใช้ Type Annotation ในการรับ Props
export default function ActivityModal({ open, onClose }: ActivityModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-lg">
        
        {/* Header */}
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">เพิ่มกิจกรรม</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-3">
          <label className="text-sm">ชื่อกิจกรรม</label>
          <input
            className="border p-2 rounded-lg"
            type="text"
            placeholder="เช่น อาบน้ำ, ตัดขน"
          />

          <label className="text-sm">รายละเอียด</label>
          <textarea
            className="border p-2 rounded-lg"
            rows={3}
            placeholder="รายละเอียดกิจกรรม"
          />

          <button className="bg-blue-600 text-white py-2 rounded-lg mt-3 hover:bg-blue-700">
            บันทึก
          </button>
        </form>
      </div>
    </div>
  );
}