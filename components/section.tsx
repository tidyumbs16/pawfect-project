"use client"; // แนะนำให้ใส่หากใช้กับ Next.js App Router

import React from "react";
import { Mallanna } from "next/font/google";

const mallanna = Mallanna({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export default function Sections() {
  const features = [
    {
      title: "สุ่มชื่อสัตว์เลี้ยง",
      desc: "ใช้ AI สร้างชื่อที่เหมาะสมสำหรับสัตว์เลี้ยงของคุณ",
      img: "/sec1.png",
      link: "/randome",
    },
    {
      title: "AI Chatbot",
      desc: "คุยกับ AI เพื่อขอคำแนะนำเกี่ยวกับสัตว์เลี้ยง",
      img: "/sec2.png",
      link: "/aichat",
    },
    {
      title: "ชื่อยอดนิยม",
      desc: "ดูชื่อที่ได้รับความนิยมสูงสุด",
      img: "/sec3.png",
      link: "/toptier",
    },
    {
      title: "Diary",
      desc: "เก็บความทรงจำกับสัตว์เลี้ยงตัวโปรดของคุณ",
      img: "/sec4.png",
      link: "/diary",
    },
  ];

  return (
    // เปลี่ยนจาก font-sans เป็น mallanna.className
    <div className={`${mallanna.className} w-full flex flex-col items-center pb-24 px-6 -mt-15`}>
      {/* TITLE */}
      <h1 className="text-3xl font-bold text-[#425B80] text-center mt-12">
        “เลือกชื่อที่ ใช่ ให้สัตว์เลี้ยงของคุณ”
      </h1>

      {/* FEATURE CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 w-full max-w-6xl">
        {features.map((item, i) => (
          <a
            key={i}
            href={item.link}
            className="bg-white rounded-[2rem] p-6 flex flex-col items-start shadow-lg  transition-shadow h-full min-h-[240px] no-underline border border-slate-50"
          >
            {/* ICON IMAGE AREA */}
            <div className="w-16 h-16 mb-4">
              <img
                src={item.img}
                alt={item.title}
                className="w-full h-full object-contain drop-shadow-sm"
              />
            </div>

            <h3 className="text-lg font-bold text-[#425B80] mb-2">
              {item.title}
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              {item.desc}
            </p>
          </a>
        ))}
      </div>

      {/* BOTTOM BANNER */}
      <div className="w-full mt-16 max-w-6xl rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden shadow-xl">
        {/* Gradient Background Layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFA94D] via-[#63E5F6] to-[#9CE7C3] z-0"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-extrabold drop-shadow-sm">
              “เริ่มต้นค้นหาชื่อเลย!”
            </h2>
            <p className="text-white/90 mt-4 font-medium max-w-lg text-lg drop-shadow-sm">
              ใช้ AI
              สร้างชื่อที่เหมาะสมกับสัตว์เลี้ยงของคุณภายในเวลาไม่กี่วินาที
            </p>
          </div>

          <a
            href="/randome"
            className="bg-white text-[#425B80] font-bold px-8 py-4 rounded-full flex items-center gap-3 hover:scale-105 transition-transform  no-underline group"
          >
            {/* ใช้รูป Vector.png สำหรับไอคอนปุ่ม */}
            <div className="w-6 h-6 relative flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
              <img
                src="/Vector.png"
                alt="Refresh Icon"
                className="object-contain w-full h-full"
              />
            </div>
            <span className="text-lg">เริ่มสุ่มชื่อ</span>
          </a>
        </div>
      </div>
    </div>
  );
}