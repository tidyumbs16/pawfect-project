"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabaseClient } from "@/lib/supabase-client";
import EditPanel from "@/components/EditPanel";

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
  const supabase = supabaseClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;

      const uid = sessionData.session.user.id;

      const { data } = await supabase.from("profiles").select("*").eq("id", uid).single();
      setProfile(data);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return <div>Loading...</div>;

  return (
    <div className="flex justify-center mt-10 gap-10 ">

      {/* LEFT CARD */}
      <div className="bg-white shadow-xl  rounded-  w-[350px] h-[500px] p-6 relative">

        {/* Avatar */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32 rounded-full overflow-hidden bg-gray-200">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="avatar" fill className="object-cover" />
            ) : (
              <Image src="/default-avatar.png" alt="avatar" fill className="opacity-40" />
            )}
          </div>
        </div>

        {/* Username */}
        <div className="mt-4 text-center text-2xl font-semibold flex items-center justify-center gap-2">
          {profile.username}
          <button
            className="text-orange-500 hover:text-orange-600"
            onClick={() => setShowEdit(true)}
          >
            ✏️
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-1">
          {profile.bio || "คำอธิบายเกี่ยวกับตัวคุณ"}
        </p>

        {/* Email */}
        <div className="mt-6 space-y-3 text-gray-700 text-sm">
          <div className="flex items-center gap-3">
            <span>📧</span> {profile.email}
          </div>

          <div className="flex items-center gap-3">
            <span>♀️♂️</span> {profile.gender || "ไม่ระบุ"}
          </div>

          <div className="flex items-center gap-3 ">
            <span>📅</span> {profile.birthdate || "วันเดือนปีเกิด"}
          </div>
        </div>

        {/* Diary Button */}
        <button className="w-[300px] h-[50px] mt-20 py-2 bg-linear-to-b from-[#F6A6A8] via-[#FF8F92] to-[#FA787C] text-white rounded-lg flex items-center justify-center ">
          📔 Diary
        </button>
      </div>

      {/* RIGHT — EDIT PANEL */}
      {showEdit && <EditPanel profile={profile} setShowEdit={setShowEdit} />}
    </div>
  

);
}
