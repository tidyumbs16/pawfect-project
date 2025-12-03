import React from 'react';

// ข้อมูล Feature
const featuresLeft = [
  { title: "คลังชื่อหลากหลาย" },
  { title: "ตัวกรองอัจฉริยะ" },
  { title: "ความหมายของชื่อ" },
];

const featuresRight = [
  { title: "ใช้งานง่ายและรวดเร็ว" },
  { title: "ชื่อเข้ากับบุคลิก" },
  { title: "บันทึกรายการโปรด" },
];

// เพิ่ม prop className เพื่อรองรับการจัดตำแหน่งเพิ่มเติม
type FeatureItemProps = {
  text: string;
  align?: 'left' | 'right';
  className?: string;
};

const FeatureItem = ({ text, align, className = '' }: FeatureItemProps) => {
  const iconSrc = "/cil_animal.png"; // URL สำหรับรูป icon อุ้งเท้าที่ให้มา

  return (
    <div 
      className={`
        flex items-center gap-4 text-white group cursor-pointer  ${className}
        ${align === 'right' ? 'flex-row text-left' : 'flex-row text-left'} 
      `}
    >
      {/* ส่วนไอคอนอุ้งเท้า (ใช้ img แทน) */}
      <div className="relative flex-shrink-0">
        <img 
          src={iconSrc} 
          alt="Paw Print Icon" 
          className="w-8 h-8 md:w-10 md:h-10 drop-shadow-md transform " 
        />
      </div>
      
      {/* ข้อความ */}
      <span className="text-lg md:text-xl font-medium drop-shadow-md">{text}</span>
    </div>
  );
};

export default function App() {
  return (
    // เพิ่ม overflow-x-hidden ที่ wrapper หลักเพื่อป้องกันการเลื่อนซ้ายขวา
    <div className="font-sans antialiased w-full overflow-x-hidden">
      {/* Import Font Kanit และ Reset Body Margin */}
      <style>{`
        html, body { 
          margin: 0;
          padding: 0;
          width: 100%;
          overflow-x: hidden; /* ล็อคไม่ให้เลื่อนซ้ายขวา */
        }
      `}</style>

      {/* ใช้ w-screen และ max-w-full เพื่อให้มั่นใจว่าเต็มจอจริงๆ */}
      <section className="relative min-h-screen w-screen max-w-full bg-linear-to-b from-[#FFC23B] via-[#EE9106]/90 to-[#EE9106] overflow-hidden px-4 py- md:py-0 flex flex-col justify-center m-0">
        
        {/* Container หลัก */}
        <div className="container mx-auto max-w-7xl relative z-10">
          
          {/* ส่วนหัวข้อ */}
          <div className="text-center mb-10 md:mb-16 space-y-16 ">
            <h2 className="text-2xl md:text-5xl font-semibold text-white drop-shadow-lg tracking-wide">
             ”สิ่งที่ <span className="text-white">Pawfect Name</span> มอบให้คุณ”
            </h2>
            <p className="mx-auto max-w-4xl text-white/95 text-base md:text-lg leading-relaxed font-light drop-shadow-sm px-4">
              เราเข้าใจดีว่าการตั้งชื่อสัตว์เลี้ยงเป็นช่วงเวลาที่สำคัญและสนุกสนาน เราจึงได้รวบรวม ฐานข้อมูลชื่อที่ดีที่สุด <br/>
              พร้อมเครื่องมือสุดล้ำที่จะช่วยให้การตัดสินใจของคุณง่ายขึ้น ชื่อคือจุดเริ่มต้นของมิตรภาพอันยาวนาน <br/>
              และเราพร้อมเป็นผู้ช่วยให้คุณค้นพบชื่อที่สมบูรณ์แบบที่สุดสำหรับเพื่อนรักสี่ขาของคุณ
            </p>
          </div>

          {/* ส่วน Grid เนื้อหา */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-8">
            
            {/* ฝั่งซ้าย */}
            <div className="lg:col-span-3 flex flex-col gap-20 items-center lg:items-end order-2 lg:order-1 px-8 lg:px-0 relative">
              {featuresLeft.map((item, index) => (
                <FeatureItem 
                  key={index} 
                  text={item.title} 
                  align="right" 
                  // จัดตำแหน่งตามรูปตัวอย่าง
                  className={index === 0 ? 'lg:mr-0' : (index === 1 ? 'lg:mr-12 xl:mr-23' : 'lg:mr-0')}
                />
              ))}
            </div>

            {/* รูปน้องหมาตรงกลาง */}
            <div className="lg:col-span-6 relative flex justify-center items-end order-1 lg:order-2 h-[350px] md:h-[360px]">
              <div className="relative w-full h-full flex items-end justify-center">
                  {/* เงาด้านหลังหมา */}
                  <div className="absolute bottom-0 w-[80%] h-[20%] bg-black/20 blur-2xl rounded-[100%]"></div>
                  
                  {/* รูปน้องหมาที่ให้มา */}
                  {/* เพิ่ม max-w-[100vw] เพื่อป้องกันรูปดันจนจอขยาย */}
                  <img 
                      src="/dogsec3.png"
                      alt="Happy Beagle Dog" 
                      className="relative z-10 h-[145%] w-auto max-w-[50vw] md:max-w-none object-contain drop-shadow-2xl mb-[-15%]"
                      style={{ 
                        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                      }}
                  />
              </div>
            </div>

            {/* ฝั่งขวา */}
            <div className="lg:col-span-3 flex flex-col gap-20 items-center lg:items-start order-3 lg:order-3 px-8 lg:px-0 relative">
              {featuresRight.map((item, index) => (
                <FeatureItem 
                  key={index} 
                  text={item.title} 
                  align="left"
                  // จัดตำแหน่งตามรูปตัวอย่าง
                  className={index === 0 ? 'lg:ml-0' : (index === 1 ? 'lg:ml-12 xl:ml-23' : 'lg:ml-0')}
                />
              ))}
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}