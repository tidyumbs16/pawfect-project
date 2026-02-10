"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, X, Plus, ImagePlus, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { Lexend } from "next/font/google";

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Diary = {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  log_date: string;
  pet_id: string;
};

export default function DiaryDetailPage() {
  
  const params = useParams();
  const router = useRouter();
  const diaryId = params.id as string;

  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  // ✅ 1. เพิ่ม State editDate ที่หายไป
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState(""); // เพิ่มตัวนี้
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [deletedUrls, setDeletedUrls] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  useEffect(() => {
    loadDiary();
  }, [diaryId]);

 const loadDiary = async () => {
  setIsLoading(true);
  try {
    // ✅ ดึง session จาก supabase ตามที่คุณบอก
    const { data: { session } } = await supabase.auth.getSession();
    
    const res = await fetch(`${API_URL}/api/diaries/detail/${diaryId}`, {
      headers: {
        // ✅ ใช้ session?.access_token ที่ได้จาก supabase จริงๆ
        Authorization: `Bearer ${session?.access_token}`
      }
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText);
    }

    const data = await res.json();
    setDiary(data);
    
    // ... (Logic การ Set Form เดิมของคุณ ห้ามแตะ)
    setEditTitle(data.title);
    setEditContent(data.content || "");
    if (data.log_date) {
      setEditDate(new Date(data.log_date).toISOString().split('T')[0]);
    }
    setExistingImages(data.image_urls || []);
  } catch (error) {
    console.error("Failed to load diary:", error);
  } finally {
    setIsLoading(false);
  }
};

  // ลบรูปเดิมออก (ตัด URL ให้เหลือแค่ Path ก่อนส่งไปหลังบ้าน)
const handleRemoveExistingImage = (url: string) => {
  setExistingImages((prev) => prev.filter((item) => item !== url));

  try {
    // ✅ ต้องใช้ "diaries" ให้ตรงกับหลังบ้าน (Backend)
    const bucketName = "diaries"; 
    
    // ตัดเอาส่วนที่อยู่หลังชื่อ bucket
    // เช่น https://.../public/diaries/folder/pic.jpg -> จะเหลือ folder/pic.jpg
    const parts = url.split(`/${bucketName}/`);
    const path = parts[parts.length - 1]; 

    if (path && path !== url) {
      setDeletedUrls((prev) => [...prev, path]);
      console.log("เตรียมลบ Path:", path); // ไว้เช็คใน console
    } else {
      // ถ้าตัดไม่ได้ ให้ส่ง URL ไปเผื่อหลังบ้านช่วยตัด (แต่ทางที่ดีควรตัดให้ถูกจากตรงนี้)
      setDeletedUrls((prev) => [...prev, url]);
    }
  } catch (error) {
    console.error("Error parsing image path:", error);
  }
};

  const handleRemoveNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

 const handleSaveEdit = async () => {
  if (!editTitle.trim()) return alert("กรุณากรอกหัวข้อ");

  try {
    // ✅ ดึง session ใหม่ก่อนส่ง Save เพื่อป้องกัน token หมดอายุ
    const { data: { session } } = await supabase.auth.getSession();
    
    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("content", editContent);
    formData.append("log_date", editDate);
    formData.append("keep_urls", JSON.stringify(existingImages));
    formData.append("delete_urls", JSON.stringify(deletedUrls));

    newFiles.forEach((file) => {
      formData.append("new_images", file);
    });

    const res = await fetch(`${API_URL}/api/diaries/${diaryId}`, {
      method: "PUT",
      headers: {
        // ✅ ส่ง token ที่ถูกต้องไป
        Authorization: `Bearer ${session?.access_token}`
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Update failed");

  
    setShowEditForm(false);
    await loadDiary();
  } catch (error) {
    console.error("Error updating diary:", error);
    alert("บันทึกไม่สำเร็จ");
  }
};

  if (isLoading) return <div className="p-10 text-center">กำลังโหลด...</div>;
  if (!diary) return <div className="p-10 text-center">ไม่พบข้อมูล</div>;

  return (
 <div className={`flex items-center justify-center min-h-screen py-8 mt-16 ${lexend.className}`}>
      {!showEditForm ? (
        /* ✅ โหมดแสดงผล (View Mode) */
        <div className="relative bg-white rounded-[1.5rem] shadow-lgtransition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 p-10 md:p-12 space-y-8 w-full max-w-5xl mx-auto">
          <button 
            onClick={() => router.back()}
            className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center bg-[#FA9529] text-white rounded-full hover:bg-[#e8851f] transition"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
          </button>

          <button
            onClick={() => setShowEditForm(true)}
            className="absolute top-6 right-6 flex items-center gap-1.5 text-[#FA9529] text-base font-medium hover:text-[#e8851f] transition"
          >
            <span>แก้ไข</span>
            <Edit size={18} />
          </button>

          <div className="text-center pt-6  ">
            <h1 className="text-3xl font-bold text-[#425B80] -mt-6">{diary.title}</h1>
            <p className="text-[#425B80] text-base mt-4">
              เมื่อ {new Date(diary.log_date).toLocaleDateString("th-TH", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8 py-2 mt-13">
            {diary.image_urls.map((url, i) => (
              <div key={i} className="aspect-square rounded-md overflow-hidden shadow-sm border-none">
                <img src={url} className="w-full h-full object-cover" alt="pet" />
              </div>
            ))}
          </div>

          <div className="bg-[#EBEBEB] p-6 rounded-[1rem] text-[#425B80]  font-bold text-base leading-relaxed min-h-[100px]  -px-5 -py-5">
            {diary.content || "ไม่มีเนื้อหาเรื่องราวในวันนี้"}
          </div>
        </div>
      ) : (
      /* ✅ โหมดแก้ไข (Edit Mode) */
        <div className="relative bg-[#FFFFFF] rounded-[1rem]  transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 p-8 md:p-10 space-y-6 w-full max-w-4xl mx-auto">
          <div className="space-y-1.5">
            <label className="text-[#425B80] text-sm font-bold ml-1">หัวข้อ</label>
            <input
              className="w-full bg-slate-100 p-4 rounded-[90px] mt-1 focus:outline-none mt-1 text-[#425B80]"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="ตัวเลือก ชอบมปลามาเบา"
            />
          </div>

          <div className="space-x-1.5">
            <label className="text-[#425B80] text-sm font-bold ml-1">เนื้อหา</label>
            <textarea
              className="w-full bg-slate-100 p-10   rounded-[30px] focus:outline-none mt-1 text-[#425B80]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="รายละเอียด"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[#425B80] text-sm font-bold ml-2">วันที่</label>
            <div className="relative">
              <input
                type="date"
               className="w-full bg-slate-100 p-4 rounded-[90px] focus:outline-none mt-2 text-[#425B80]"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-5 py-3">
            {existingImages.map((url, i) => (
              <div key={`old-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-none">
                <img src={url} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemoveExistingImage(url)}
                  className="absolute top-2 right-2 bg-white/90 text-gray-400 rounded-full p-1.5 shadow-sm hover:bg-red-500 hover:text-white transition"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
            
            {newFiles.map((file, i) => (
              <div key={`new-${i}`} className="relative w-full h-50 rounded-md overflow-hidden border-2 border-none ">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover " />
                <button 
                  onClick={() => handleRemoveNewFile(i)}
                  className="absolute top-2 right-2 bg-white/90 text-gray-400 rounded-full p-1.5"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
            <div>
              <input 
                id="diary-images"
                type="file" 
                multiple 
                className="hidden" 
                accept="image/*"
                onChange={(e) => setNewFiles([...newFiles, ...Array.from(e.target.files || [])])}
              />
              <label
                htmlFor="diary-images"
                className="mt-2 inline-flex items-center gap-3 px-10 py-3 border-2 border-[#FA9529] rounded-2xl  font-medium cursor-pointer hover:bg-orange-50  text-[#FA9529] "
              >
                <ImagePlus size={30} strokeWidth={1.5} /> 
                <span>เพิ่มรูปภาพ</span>
              </label>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 py-3 px-6 rounded-xl bg-[#FA9529] text-white font-bold transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80   active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock size={16} strokeWidth={3} /> SAVE
              </button>
              <button 
                onClick={() => setShowEditForm(false)} 
                className="flex-1 py-3 px-6 rounded-xl border border-gray-200 text-slate-600 font-semibold hover:bg-gray-50 transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )}