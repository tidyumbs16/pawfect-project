"use client";
import React, { useState } from 'react';
import { Cat, Dog, Sparkles, RefreshCw, ChevronDown } from 'lucide-react';

export default function PetNameGenerator() {
  const [petType, setPetType] = useState("");
  const [traits, setTraits] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  return (
    <div className="min-h-screen bg-white py-12 px-4 font-sans text-[#4A628A]">
      {/* 🌟 Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black mb-3">สุ่มชื่อสัตว์เลี้ยงด้วย AI</h1>
        <p className="text-slate-500">กรอกข้อมูลของสัตว์เลี้ยงแล้ว AI จะแนะนำชื่อที่เหมาะสมให้คุณ</p>
      </div>

      {/* 🐾 Step Progress Section */}
      <div className="max-w-4xl mx-auto flex justify-between items-start mb-16 relative">
        {/* Line Connector */}
        <div className="absolute top-6 left-0 w-full h-[2px] bg-orange-100 -z-10 hidden md:block" />
        
        {[
          { title: "ระบุประเภทสัตว์เลี้ยง", desc: "เลือกประเภทของสัตว์เลี้ยง (เช่น น้องหมา, น้องแมว, น้องนก)", step: 1 },
          { title: "บอกลักษณะเฉพาะตัว", desc: "ป้อนลักษณะนิสัย (เช่น ขี้เล่น, ขี้อ้อน, สง่างาม) หรือสีสัน/สไตล์ที่ต้องการ", step: 2 },
          { title: "สร้างชื่อทันที", desc: "กด 'สร้างชื่อ' เพื่อรับชื่อที่ผ่านการวิเคราะห์ด้วย AI", step: 3 },
        ].map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center max-w-[250px] px-2">
            <div className="w-14 h-14 bg-white border-2 border-orange-400 rounded-2xl flex items-center justify-center mb-4 shadow-sm text-orange-500">
              <Cat size={32} />
            </div>
            <h3 className="font-bold text-sm mb-2">{item.title}</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* 🟠 Main Input Card */}
      <div className="max-w-3xl mx-auto bg-gradient-to-br from-orange-400 to-orange-500 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-orange-200">
        <h2 className="text-3xl font-black text-white mb-2">ข้อมูลสัตว์เลี้ยง</h2>
        <p className="text-orange-100 mb-8 font-medium">กรอกข้อมูลเพื่อให้ AI สร้างชื่อที่เหมาะสม</p>

        <div className="space-y-6">
          {/* Input: Pet Type */}
          <div className="space-y-3">
            <label className="text-white font-bold text-lg ml-1">ประเภทสัตว์เลี้ยง</label>
            <div className="relative">
              <select 
                value={petType}
                onChange={(e) => setPetType(e.target.value)}
                className="w-full bg-[#FFD199] border-none rounded-2xl py-4 px-6 text-orange-900 font-bold appearance-none focus:ring-4 focus:ring-orange-300 outline-none cursor-pointer placeholder-orange-300"
              >
                <option value="" disabled>เลือกประเภทสัตว์เลี้ยง</option>
                <option value="dog">น้องหมา 🐶</option>
                <option value="cat">น้องแมว 🐱</option>
                <option value="bird">น้องนก 🦜</option>
              </select>
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-600 pointer-events-none" />
            </div>
          </div>

          {/* Input: Traits */}
          <div className="space-y-3">
            <label className="text-white font-bold text-lg ml-1">ลักษณะของสัตว์เลี้ยง</label>
            <textarea 
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              placeholder="เช่น ขนสีขาว ตาสีน้ำเงิน ชอบวิ่งเล่น ร่าเริง น่ารัก..."
              className="w-full bg-[#FFD199] border-none rounded-2xl py-5 px-6 text-orange-900 font-bold placeholder-orange-700/40 min-h-[150px] focus:ring-4 focus:ring-orange-300 outline-none resize-none"
            />
          </div>

          {/* Action Button */}
          <button 
            disabled={isGenerating}
            className="w-full bg-white text-orange-500 py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-lg hover:bg-orange-50 active:scale-95 transition-all mt-4 disabled:opacity-70"
          >
            {isGenerating ? (
              <RefreshCw className="animate-spin" />
            ) : (
              <RefreshCw size={24} />
            )}
            สร้างชื่อ
          </button>
        </div>
      </div>
    </div>
  );
}