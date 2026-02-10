"use client";

import { useEffect, useState, useRef } from "react"; 
import Image from "next/image";
import { supabase } from "@/lib/supabase-client";
import EditPanel from "@/components/EditPanel";
import Link from "next/link";
import { Mail, Calendar, VenusAndMars, Pencil, BookHeart, PencilLine } from "lucide-react";
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); 
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile?.avatar_url || null);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      const userEmail = sessionData.session.user.email; 
      const uid = sessionData.session.user.id;
      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      
      if (data) {
        setProfile({ 
          ...data, 
          email: userEmail 
        });
      }
    }
    load();
  }, []);

  const getGenderThai = (gender?: string) => {
    if (gender === "male") return "ชาย";
    if (gender === "female") return "หญิง";
    if (gender === "other") return "อื่นๆ";
    return "ไม่ระบุ";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "วันเดือนปีเกิด";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file); 
      setPreviewUrl(URL.createObjectURL(file)); 
    }
  };

  if (!profile) return <div className={`${lexend.className} flex justify-center mt-20 font-bold text-gray-400`}>Loading...</div>;

  return (
    // แทรก lexend.className เข้าไปใน Container หลัก
    <div className={`${lexend.className} min-h-screen bg-[#FDFDFD] flex flex-col md:flex-row justify-center items-start gap-10 pt-32 px-4 pb-10 mt-45 `}>
      
      {/* --- LEFT CARD: PROFILE VIEW --- */}
      <div className="relative bg-white transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80  rounded-sm w-full max-w-[400px] p-8 pt-24 flex flex-col items-center ">
        
        {/* Avatar ลอยเด่น */}
        <div className="absolute -top-50 left-1/2 -translate-x-1/2">
          <div 
            onClick={() => showEdit && fileInputRef.current?.click()}
            className={`relative w-70 h-70 rounded-full border-white bg-[#E5E7EB] overflow-hidden flex items-center justify-center ${showEdit ? "cursor-pointer" : ""}`}
          >
            <input 
              type="file" 
              ref={fileInputRef}  
              className="hidden" 
              accept="image/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  const objectUrl = URL.createObjectURL(file);
                  setPreviewUrl(objectUrl);
                  console.log("เลือกรูปแล้ว:", file.name);
                }
              }}
            />

            {(previewUrl || profile?.avatar_url) ? (
              <Image
                src={previewUrl || profile?.avatar_url || ""}
                alt="Profile"
                fill
                className="object-cover"
                priority
              />
            ) : (
              !showEdit && (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
              )
            )}

            {showEdit && (
              <div className="absolute inset-0 z-10 flex items-center justify-center transition-all ">
                <div className="opacity-70 transform group-hover:scale-110 transition-all duration-300 ">
                  <Image
                    src="/camerapro.png"
                    width={100}
                    height={100}
                    alt="Camera Icon"
                    className="object-contain"
                  />
                </div>
                <p className="absolute bottom-4 text-white text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">แตะเพื่อเปลี่ยนรูป</p>
              </div>
            )}
          </div>
        </div>

        {/* Username & Pencil Button */}
        <div className="mt-4 flex items-center gap-2">
          <h2 className="text-[1.75rem] font-black text-[#425B80]">{profile.username}</h2>
          <button
            onClick={() => setShowEdit(true)}
            className="text-orange-500 hover:scale-110 transition-transform"
          >
            <PencilLine  size={24} fill="currentColor" className="text-orange-400" />
          </button>
        </div>

        <p className="text-[#425B80] text-base mt-2 mb-8 font-medium">
          {profile.bio || "คำอธิบายเกี่ยวกับตัวคุณ"}
        </p>

        <div className="w-[400px] h-[1px] bg-gray-300 mb-5"></div>

        {/* Info List With Icons */}
        <div className="w-full space-y-4   pr-10">
          <div className="flex items-center gap-5">
            <div className="text-orange-400 p-2 rounded-lg"><Mail size={29} /></div>
            <span className="text-[#4A628A] font-semibold truncate">{profile.email}</span>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-orange-400 p-2 rounded-lg"><VenusAndMars size={29} /></div>
<span className="text-[#4A628A] font-semibold">{getGenderThai(profile.gender)}</span>
          </div>

          <div className="flex items-center gap-5 ">
            <div className="text-orange-400 p-2 rounded-lg "><Calendar size={29} /></div>
           <span className="text-[#4A628A] font-semibold">{formatDate(profile.birthdate)}</span>
          </div>
        </div>

        {/* Diary Button */}
        <Link
          href="/diary"
          className="w-80 h-13 mt-15 py-4 bg-linear-to-l from-[#F6A6A8] via-[#FF8F92] to-[#FA787C] 
                     text-white rounded-lg flex items-center justify-center gap-2  
                     hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <Image
            src="/book-heart-outline.png"
            width={24}
            height={24}
            alt="Diary Icon" /> Diary
        </Link>
      </div>

      {/* --- RIGHT CARD: EDIT PANEL --- */}
      {showEdit && (
        <div className="w-full max-w-[600px] animate-in fade-in slide-in-from-right-10 duration-500">
           <EditPanel profile={profile} setShowEdit={setShowEdit} selectedFile={selectedFile} setProfile={setProfile} />
        </div>
      )}
    </div>
  );
}