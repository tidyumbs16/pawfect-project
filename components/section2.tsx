"use client";
import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Mallanna } from "next/font/google";

const mallanna = Mallanna({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});


const Section2 = () => {
  const features = [
    {
      title: "ชื่อที่ดีช่วยในการฝึก",
      content: "สัตว์เลี้ยงจะเรียนรู้คำสั่งได้เร็วขึ้นเมื่อมีชื่อที่ชัดเจน ช่วยลดความสับสนและทำให้การสื่อสารมีประสิทธิภาพ"
    },
    {
      title: "สร้างความผูกพันที่มั่นคง",
      content: "การเรียกชื่อบ่อย ๆ คือการปฏิสัมพันธ์เชิงบวก ทำให้พวกเขารู้สึกปลอดภัย ได้รับความรัก และเป็นส่วนหนึ่งของครอบครัวคุณอย่างแท้จริง"
    },
    {
      title: "ชื่อคือการสะท้อนบุคลิก",
      content: "การเลือกชื่อที่เข้ากับนิสัย เช่น ขี้เล่น ช่างฝัน หรือใจดี จะช่วยให้คุณเห็นบุคลิกที่โดดเด่นของเขาได้ชัดเจนยิ่งขึ้น"
    }
  ];

  const [openIndex, setOpenIndex] = useState([0, 1, 2]);

  const toggleAccordion = (index: number) => {
    if (openIndex.includes(index)) {
      setOpenIndex(openIndex.filter(i => i !== index));
    } else {
      setOpenIndex([...openIndex, index]);
    }
  };

  return (
    // เปลี่ยนจาก font-prompt เป็น mallanna.className เพื่อปรับใช้ฟอนต์
    <div className={`${mallanna.className} w-full px-4 md:px-8 overflow-hidden mb-27`}>
        

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
    
        <div className="relative flex justify-center lg:justify-start min-h-[400px] lg:min-h-[500px] lg:sticky lg:top-10">
         
            <img 
                src="/catandduck.png" 
                alt="Cat and Duck" 
                className="w-full max-w-[500px] h-auto object-contain "
            />
        </div>

        {/* --- Right Column: Content --- */}
        <div className="z-10 pt-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[#425B80] mb-6 leading-snug">
                 <br/>
                <span className="text-[#425B80]">”ชื่อคือของขวัญชิ้นแรก <br/>
                  มอบสิ่งที่ดีที่สุดให้เขาเถอะ”</span>
            </h2>

            <div className="text-[#425B80] text-base mb-10 space-y-4 leading-relaxed">
                <p>
                    การตั้งชื่อให้สัตว์เลี้ยงไม่ใช่แค่การระบุตัวตน แต่เป็นการสร้างสายใยที่ลึกซึ้ง ชื่อที่ดีช่วยเสริมการฝึก การสื่อสาร และความผูกพันระหว่างคุณกับเพื่อนรักสี่ขา เมื่อมีชื่อที่ชัดเจน 
                </p>
                <p className="mt-8">
                    สัตว์เลี้ยงของคุณจะรับรู้ถึงความรักและความใส่ใจที่คุณมอบให้ และมันจะเป็น จุดเริ่มต้นของความสัมพันธ์ที่ ”Pawfect” อย่างแท้จริง
                </p>
            </div>

            {/* Feature List / Accordion */}
            <div className="space-y-6">
                {features.map((item, index) => (
                    <div key={index} className="group">
                        {/* Header Card */}
                        <button 
                            onClick={() => toggleAccordion(index)}
                            className="w-full bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.05)] border-b-[6px] border-[#FA9529] p-5 flex justify-between items-center text-left hover:shadow-md transition-all duration-300 focus:outline-none relative z-20"
                        >
                            <h3 className="text-lg md:text-xl font-bold text-[#425B80]  ">
                                {item.title}
                            </h3>
                            <div className="text-[#FA9529] transform transition-transform duration-300"
                                style={{ transform: openIndex.includes(index) ? 'rotate(180deg)' : 'rotate(0deg)' }}
                            >
                                <ChevronDown size={24} strokeWidth={2.5} />
                            </div>
                        </button>
                        
                        {/* Content Area */}
                        <div 
                            className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${openIndex.includes(index) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                        >
                            <div className="overflow-hidden">
                                <div className="pt-4 pb-2 px-2">
                                    <p className="text-[#425B80] leading-relaxed text-sm md:text-base">
                                        {item.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default Section2;