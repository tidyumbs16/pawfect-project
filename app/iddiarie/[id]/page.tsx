// app/diary/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, X } from "lucide-react";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Diary = {
  id: string;
  title: string;
  content: string;
  image_urls: string[];
  created_at: string;
  pet_id: string;
};

export default function DiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const diaryId = params.id as string;

  const [diary, setDiary] = useState<Diary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  
  // State สำหรับแก้ไข
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState<string[]>([]);

  // โหลดข้อมูล Diary
  useEffect(() => {
    loadDiary();
  }, [diaryId]);

  const loadDiary = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/diaries/${diaryId}`);
      const data = await res.json();
      setDiary(data);
      setEditTitle(data.title);
      setEditContent(data.content || "");
      setEditImages(data.image_urls || []);
    } catch (error) {
      console.error("Failed to load diary:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // บันทึกการแก้ไข
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      alert("กรุณากรอกหัวข้อ");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/diaries/${diaryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          image_urls: editImages,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      await loadDiary();
      setShowEditForm(false);
      alert("บันทึกสำเร็จ");
    } catch (error) {
      console.error("Error updating diary:", error);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  // ลบรูปภาพ
  const handleRemoveImage = (index: number) => {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">กำลังโหลด...</div>
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">ไม่พบข้อมูล</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>ย้อนกลับ</span>
          </button>
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            className="flex items-center gap-2 text-orange-500 hover:text-orange-600"
          >
            <Edit size={20} />
            <span>แก้ไข</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* แสดงหรือแก้ไข */}
        {!showEditForm ? (
          // ✅ โหมดดู
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {diary.title}
            </h1>
            <p className="text-gray-500 text-sm mb-6">
              เมื่อ{" "}
              {new Date(diary.created_at).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            {/* รูปภาพ */}
            {diary.image_urls && diary.image_urls.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {diary.image_urls.map((url, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                  >
                    <img
                      src={url}
                      alt={`${diary.title} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* เนื้อหา */}
            {diary.content && (
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {diary.content}
                </p>
              </div>
            )}
          </div>
        ) : (
          // ✅ โหมดแก้ไข
          <div className="bg-white rounded-2xl shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              แก้ไขโพสต์
            </h2>

            {/* ฟอร์มแก้ไข */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หัวข้อ
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-orange-300 outline-none"
                  placeholder="หัวข้อโพสต์"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เนื้อหา
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={8}
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-700 focus:ring-2 focus:ring-orange-300 outline-none resize-none"
                  placeholder="เขียนเรื่องราวของคุณ..."
                />
              </div>

              {/* รูปภาพ (แก้ไขได้) */}
              {editImages.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปภาพ
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {editImages.map((url, index) => (
                      <div
                        key={index}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group"
                      >
                        <img
                          src={url}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ปุ่ม */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={() => setShowEditForm(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-8 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition"
                >
                  บันทึก
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}