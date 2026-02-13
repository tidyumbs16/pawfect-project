"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { Lexend } from "next/font/google";

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});

interface Profile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  email: string;
  gender?: string;
  birthdate?: string;
}

interface EditPanelProps {
  profile: Profile;
  setShowEdit: (show: boolean) => void;
  selectedFile: File | null;
  setProfile: (profile: Profile) => void;
}

const RadioOption = ({ 
  label, 
  value, 
  currentValue, 
  onChange 
}: { 
  label: string; 
  value: string; 
  currentValue: string; 
  onChange: (val: string) => void;
}) => {
  // 1. เช็คตรงนี้เลยว่าถูกเลือกอยู่ไหม
  const isSelected = currentValue === value;

  return (
    <label className="inline-flex items-center cursor-pointer mr-6 relative group select-none">
      <input
        type="radio"
        name="gender"
        value={value}
        checked={isSelected}
        onChange={() => onChange(value)}
        className="sr-only" // ไม่ต้องใช้ peer แล้ว
      />
      
      {/* กรอบสี่เหลี่ยมมน */}
      <div className={`
        w-6 h-6 border-2 rounded-xl flex items-center justify-center transition-all duration-200
        ${isSelected ? 'border-[#F16527]' : 'border-[#F16527]'}
      `}>
        {/* วงกลมส้มข้างใน */}
        <div className={`
          w-4 h-4 bg-[#FA9529] rounded-full shadow-sm
          transition-transform duration-200 ease-out
          ${isSelected ? 'scale-90' : 'scale-0'} 
        `}></div>
      </div>
      
      {/* ตัวหนังสือ */}
      <span className={`ml-2 font-medium transition-colors ${isSelected ? 'text-gray-700' : 'text-gray-700'}`}>
        {label}
      </span>
    </label>
  );
};

export default function EditPanel({ profile, setShowEdit,  setProfile, selectedFile }: EditPanelProps) {
  // กำหนดค่าเริ่มต้น State
  const [formData, setFormData] = useState({
    username: profile.username || "",
    bio: profile.bio || "",
    gender: profile.gender || "other", // ค่า default ต้องมี
    birthdate: profile.birthdate || "",
  });
  
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันเปลี่ยนค่า Text Input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
   if (name === "birthdate") {
    const selectedDate = new Date(value);
    const today = new Date();
    
    // ตั้งเวลาวันนี้เป็น 00:00:00 เพื่อเช็คแค่วันที่
    today.setHours(0, 0, 0, 0);

    // 1. ป้องกันวันในอนาคต หรือปีปัจจุบัน
    if (selectedDate > today) {
      alert("ไม่สามารถเลือกวันเกิดเป็นอนาคตได้ครับ");
      return; // ⛔ ไม่ยอมให้ลง State
    }

    if (selectedDate.getFullYear() === today.getFullYear()) {
      alert("วันเกิดต้องไม่ใช่ปีปัจจุบันครับ");
      return; // ⛔ ไม่ยอมให้ลง State
    }
  }

  // ✅ ถ้าผ่านการเช็ค (หรือเป็น Field อื่น) ให้ set ตามปกติ
  setFormData((prev) => ({ ...prev, [name]: value }));
};



  
  // ฟังก์ชันเปลี่ยนค่า Gender (แยกออกมาให้ชัดเจน)
  const handleGenderChange = (val: string) => {
    setFormData((prev) => ({ ...prev, gender: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) throw new Error("No session found");

      const sendData = new FormData();
      sendData.append("id", profile.id);
      sendData.append("username", formData.username);
      sendData.append("bio", formData.bio);
      sendData.append("gender", formData.gender);
      sendData.append("birthdate", formData.birthdate);
      if (selectedFile) {
            // ต้องชื่อ "avatar_url" ให้ตรงกับที่ Backend รอรับ
            sendData.append("avatar_url", selectedFile);
            console.log("📦 กำลังส่งไฟล์รูป:", selectedFile.name);
      }

      console.log("Sending data...", Object.fromEntries(sendData)); // เช็คดูว่าข้อมูลถูกส่งมั้ย

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/update`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: sendData,
      });

      const result = await res.json();

      if (res.ok) {
        // 🔥 บังคับ Reload หน้าเว็บเพื่อให้ข้อมูลอัปเดตแน่นอน 100%
        window.location.reload(); 
      } else {
        alert("บันทึกไม่สำเร็จ: " + (result.message || "Unknown Error"));
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  };

  const inputBaseClass = "w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-[#425B80]  outline-none transition-shadow";
  const labelBaseClass = "text-[#425B80] font-bold  md:text-lg";

  return (
    // แทรก lexend.className เข้าไปใน class ของ div หลัก
    <div className={`${lexend.className} bg-white rounded-[0.5rem] w-full max-w-2xl p-8 md:p-12 border border-white transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 ml-14`}>
      <h2 className="text-3xl font-black text-slate-700 mb-10">ข้อมูลของฉัน</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Username */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-4">
          <label className={labelBaseClass}>ชื่อผู้ใช้ :</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={inputBaseClass}
            required
          />
        </div>

        {/* Email */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-4">
          <label className={labelBaseClass}>อีเมล :</label>
          <input
            type="email"
            value={profile.email}
            readOnly
            className={`${inputBaseClass} text-gray-400 cursor-not-allowed bg-gray-50`}
          />
        </div>

        {/* Gender - แก้แล้ว กดติดแน่นอน */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-4">
          <label className={labelBaseClass}>เพศ :</label>
          <div className="flex flex-wrap items-center py-2">
            <RadioOption 
              label="ชาย" 
              value="male" 
              currentValue={formData.gender} 
              onChange={handleGenderChange} 
            />
            <RadioOption 
              label="หญิง" 
              value="female" 
              currentValue={formData.gender} 
              onChange={handleGenderChange} 
            />
            <RadioOption 
              label="อื่นๆ" 
              value="other" 
              currentValue={formData.gender} 
              onChange={handleGenderChange} 
            />
          </div>
        </div>

        {/* Birthdate */}
       <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-center gap-4">
  <label className={labelBaseClass}>วัน/เดือน/ปี เกิด :</label>
  <input
    type="date"
    name="birthdate"
    // ✅ จำกัดปฏิทินให้เลือกได้สูงสุดแค่สิ้นปีที่แล้ว
    max={`${new Date().getFullYear() - 1}-12-31`} 
    value={formData.birthdate}
    onChange={handleChange}
    className={inputBaseClass}
  />
</div>

        {/* Bio */}
        <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-start gap-4">
          <label className={`${labelBaseClass} pt-3`}>คำอธิบายของคุณ :</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className={`${inputBaseClass} resize-none h-32`}
            placeholder="เล่าเรื่องราวของคุณสักนิด..."
          />
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-4 pt-3">
          {/* ปุ่มบันทึก */}
          <button
            type="submit"
            disabled={loading}
            className=" bg-[#FA9529] text-white font-black py-3 px-13 rounded-xl transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80  "
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>

          {/* ปุ่มยกเลิก (ย้ายเข้ามาข้างใน div นี้) */}
          <button
            type="button"
            onClick={() => setShowEdit(false)}
            className="px-12 py-3 rounded-xl font-bold text-[#425B80]  border border-white transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80"
          >
            ยกเลิก
          </button>
        </div>
        
      </form>
    </div>
  );
}