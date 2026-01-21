"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, X, Plus, ImagePlus } from "lucide-react";

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
    const token = localStorage.getItem("access_token"); // ดึง token มา
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/diaries/detail/${diaryId}`, {
headers: {
    Authorization: `Bearer ${token}` // ✅ ต้องส่งไปเพื่อให้หลังบ้านรู้ว่าเป็นใคร
  }
    });

    const data = await res.json();
      setDiary(data);
      
      // ✅ 2. Setup ข้อมูลเข้า Form (จัดการฟอร์แมตวันที่ให้ input date อ่านได้)
      setEditTitle(data.title);
      setEditContent(data.content || "");
      if (data.log_date) {
        setEditDate(new Date(data.log_date).toISOString().split('T')[0]);
      }
      setExistingImages(data.image_urls || []);
      setDeletedUrls([]);
      setNewFiles([]);
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

    const token = localStorage.getItem("access_token");
    const formData = new FormData();
    formData.append("title", editTitle);
    formData.append("content", editContent);
    formData.append("log_date", editDate); // ✅ ตอนนี้มีค่าแล้ว
    formData.append("keep_urls", JSON.stringify(existingImages));
    formData.append("delete_urls", JSON.stringify(deletedUrls));

    newFiles.forEach((file) => {
      formData.append("new_images", file);
    });

    try {
  // ✅ 1. เช็คก่อนว่ามี token ไหม
  const headers: Record<string, string> = {};
  
  if (token && token !== "null") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api/diaries/${diaryId}`, {
    method: "PUT",
    headers: headers, // ✅ ส่ง object ที่เราเตรียมไว้
    body: formData,
  });

      if (!res.ok) throw new Error("Update failed");

      alert("บันทึกสำเร็จ");
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
    <div className="max-w-4xl mx-auto px-4 py-8">
      {!showEditForm ? (
        /* ✅ โหมดแสดงผล (View Mode) */
        <div className="relative bg-white rounded-[2.5rem] shadow-sm p-8 md:p-12 space-y-6">
          <button 
            onClick={() => router.back()}
            className="absolute top-6 left-6 w-10 h-10 flex items-center justify-center bg-orange-500 text-white rounded-full hover:bg-orange-600 transition shadow-md shadow-orange-200"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>

          <button
            onClick={() => setShowEditForm(true)}
            className="absolute top-6 right-8 flex items-center gap-1 text-orange-500 font-bold hover:text-orange-600 transition"
          >
            <span>แก้ไข</span>
            <Edit size={20} />
          </button>

          <div className="text-center pt-4">
            <h1 className="text-3xl font-bold text-slate-700 leading-tight">{diary.title}</h1>
            <p className="text-slate-400 mt-3 font-medium">
              เมื่อ {new Date(diary.log_date).toLocaleDateString("th-TH", {
                day: "numeric", month: "long", year: "numeric"
              })}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-4">
            {diary.image_urls.map((url, i) => (
              <div key={i} className="aspect-[4/3] rounded-3xl overflow-hidden shadow-sm border border-slate-100">
                <img src={url} className="w-full h-full object-cover" alt="pet" />
              </div>
            ))}
          </div>

          <div className="bg-slate-50/80 p-8 rounded-[2rem] text-slate-600 leading-relaxed text-lg min-h-[120px]">
            {diary.content || "ไม่มีเนื้อหาเรื่องราวในวันนี้"}
          </div>
        </div>
      ) : (
        /* ✅ โหมดแก้ไข (Edit Mode) */
        <div className="relative bg-white rounded-[2.5rem] shadow-sm p-8 md:p-12 space-y-8">
          <div className="space-y-2">
            <label className="text-slate-400 font-medium ml-2">หัวข้อ</label>
            <input
              className="w-full bg-slate-100/80 border-none rounded-2xl py-4 px-6 text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="หัวข้อโพสต์..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 font-medium ml-2">เนื้อหา</label>
            <textarea
              className="w-full h-48 bg-slate-100/80 border-none rounded-2xl py-4 px-6 text-slate-700 outline-none focus:ring-2 focus:ring-orange-200 resize-none"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="เขียนเรื่องราวของคุณ..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-slate-400 font-medium ml-2">วันที่</label>
            <div className="relative">
              <input
                type="date"
                className="w-full bg-slate-100/80 border-none rounded-2xl py-4 px-6 text-slate-700 outline-none focus:ring-2 focus:ring-orange-200"
                value={editDate} // ✅ ใช้ editDate แทน
                onChange={(e) => setEditDate(e.target.value)} // ✅ ใส่ onChange ให้แก้ได้
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 py-4">
            {existingImages.map((url, i) => (
              <div key={`old-${i}`} className="relative aspect-[4/3] rounded-3xl overflow-hidden group border border-slate-100">
                <img src={url} className="w-full h-full object-cover" />
                <button 
                  onClick={() => handleRemoveExistingImage(url)}
                  className="absolute top-3 right-3 bg-white/90 text-slate-400 rounded-full p-1 shadow-sm hover:bg-red-500 hover:text-white transition"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            ))}
            
            {newFiles.map((file, i) => (
              <div key={`new-${i}`} className="relative aspect-[4/3] rounded-3xl overflow-hidden border-2 border-orange-200">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover opacity-80" />
                <button 
                  onClick={() => handleRemoveNewFile(i)}
                  className="absolute top-3 right-3 bg-white/90 text-slate-400 rounded-full p-1"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-4">
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
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-orange-400 rounded-2xl text-orange-500 font-bold cursor-pointer hover:bg-orange-50 transition"
              >
                <ImagePlus size={22} />
                <span>เพิ่มรูปภาพ</span>
              </label>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleSaveEdit} 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-12 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition"
              >
                <Plus size={20} /> Save
              </button>
              <button 
                onClick={() => setShowEditForm(false)} 
                className="flex-1 md:flex-none px-12 py-4 bg-white border border-slate-200 text-slate-500 rounded-2xl font-bold hover:bg-slate-50 transition"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}