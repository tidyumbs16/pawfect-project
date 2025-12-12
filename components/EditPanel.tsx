"use client";

import { useState } from "react";
import { supabase} from "@/lib/supabase-client";

// ตรวจสอบให้แน่ใจว่า Interface Profile มี email
interface Profile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  email: string; // จำเป็นต้องมี email สำหรับแสดงผล
  gender?: string;
  birthdate?: string;
}

interface EditPanelProps {
  profile: Profile;
  setShowEdit: (show: boolean) => void;
}

export default function EditPanel({ profile, setShowEdit }: EditPanelProps) {
 

  const [formData, setFormData] = useState({
    username: profile.username,
    bio: profile.bio || "",
    gender: profile.gender || "other", // ค่า default ควรตรงกับ value ของ radio
    birthdate: profile.birthdate || "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update(formData)
        .eq("id", profile.id);

      if (error) {
        console.error("Error updating profile:", error);
        alert("ไม่สามารถอัปเดตโปรไฟล์ได้");
      } else {
        alert("อัปเดตโปรไฟล์สำเร็จ");
        setShowEdit(false);
        // Refresh page to see changes
        window.location.reload();
      }
    } catch (err) {
      console.error("Error:", err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  // Class สำหรับ Input ทั่วไปเพื่อให้เหมือนกันหมด
  const inputBaseClass = "w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-cyan-200 outline-none transition-shadow";
  const labelBaseClass = "text-slate-600 font-medium text-base md:text-lg";

  // Custom Radio Button Component (เพื่อให้ได้สไตล์สีส้มตามภาพ)
  const CustomRadio = ({ label, value }: { label: string; value: string }) => (
    <label className="inline-flex items-center cursor-pointer mr-6 relative">
      <input
        type="radio"
        name="gender"
        value={value}
        checked={formData.gender === value}
        onChange={handleChange}
        className="peer sr-only" // ซ่อน radio input จริงๆ
      />
      {/* วงกลมด้านนอก */}
      <div className="w-6 h-6 border-2 border-orange-400 rounded-full flex items-center justify-center peer-checked:border-orange-500 transition-all">
        {/* จุดสีส้มด้านใน (แสดงเมื่อ checked) */}
        <div className="w-3 h-3 bg-orange-500 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
      </div>
      <span className="ml-2 text-gray-700">{label}</span>
    </label>
  );

  return (
    // Container ปรับให้กว้างขึ้น และ padding เหมาะสม
    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 md:p-12 shadow-sm">
      <h2 className="text-3xl font-bold text-slate-700 mb-10">ข้อมูลของฉัน</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Grid Layout: Label อยู่ซ้าย (กว้าง fixed), Input อยู่ขวา (ยืดเต็มที่) */}
        
        {/* Username */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
          <label className={labelBaseClass}>
            ชื่อผู้ใช้ :
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={inputBaseClass}
            required
          />
        </div>

        {/* Email (Read Only) */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
          <label className={labelBaseClass}>
            อีเมล :
          </label>
          <input
            type="email"
            value={profile.email}
            readOnly
            className={`${inputBaseClass} text-gray-500 cursor-default`} // สีจางลงเล็กน้อยเพราะแก้ไขไม่ได้
          />
        </div>

        {/* Gender (Custom Radio Buttons) */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
          <label className={labelBaseClass}>
            เพศ :
          </label>
          <div className="flex flex-wrap items-center py-2">
            <CustomRadio label="ชาย" value="male" />
            <CustomRadio label="หญิง" value="female" />
            <CustomRadio label="อื่นๆ" value="other" />
          </div>
        </div>

        {/* Birthdate */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-center gap-4">
          <label className={labelBaseClass}>
            วัน/เดือน/ปี เกิด :
          </label>
          {/* Browser ส่วนใหญ่จะมี icon ปฏิทินให้อยู่แล้วสำหรับ type="date" */}
          <input
            type="date"
            name="birthdate"
            value={formData.birthdate}
            onChange={handleChange}
            className={`${inputBaseClass} appearance-none`} // appearance-none might help on some browsers styles
            style={{ colorScheme: 'light' }} // บังคับ icon สีเข้มบนพื้นสว่าง
          />
        </div>

        {/* Bio (Textarea) */}
        <div className="grid grid-cols-1 md:grid-cols-[160px_1fr] items-start gap-5">
          <label className={`${labelBaseClass} pt-3`}>
            เขียนคำอธิบายของคุณ :
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className={`${inputBaseClass} resize-none h-32`}
            placeholder="รักสัตว์ทุกชนิดบนโลกเลย"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-center pt-8">
          <button
            type="submit"
            disabled={loading}
            // Gradient สีฟ้า->เขียวมิ้นต์, ทรงแคปซูล (rounded-full), ปุ่มกว้าง
            className="bg-gradient-to-r from-cyan-400 to-teal-300 text-white text-lg font-semibold py-3 px-24 rounded-full hover:shadow-md transition-all disabled:opacity-70"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </form>
    </div>
  );
}