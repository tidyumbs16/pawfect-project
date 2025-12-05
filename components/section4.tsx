import Image from 'next/image';



export default function Section4() {
  
  return (
    <div className="min-h-screen bg-white py-16 px-4 overflow-x-hidden mt-15 " >
      <div className="max-w-6xl mx-auto relative">
        
        {/* --- Header Section --- */}
        <div className="text-center mb-16 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#425B80]">
            เกร็ดน่ารู้ก่อนตั้งชื่อ (Fun Facts & Inspiration)
          </h1>
          <p className="text-gray-500 text-sm md:text-base ">
            ”3 ข้อที่คุณอาจไม่เคยรู้เกี่ยวกับการตั้งชื่อสัตว์เลี้ยง”
          </p>
        </div>

        {/* --- Content Grid --- */}
        {/* ใช้ Grid 3 คอลัมน์ และเว้นระยะห่าง (Gap) ให้พอดี */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-24     relative z-10">
          
          {/* Card 1 */}
          <div className="flex flex-col items-center h-full">
            <div className="border-2 pt-6 pb-24 border-[#E8A856]  rounded-3xl p-20 h-full flex flex-col items-center text-center shadow-xl/100 shadow-[#D3893A] bg-white w-full relative z-10">
              <h3 className="text-[108%] font-bold text-[#425B80] mb-20  ">
                ชื่อ 1-2 พยางค์ดีที่สุด
              </h3>
              <div className="text-[#425B80] space-y-1 leading-relaxed text-sm md:text-base text-balance">
                <p>สัตว์เลี้ยงจะจดจำชื่อที่มีความ</p>
                <p>ยาว 1-2 พยางค์</p>
                <p>ได้ง่ายและรวดเร็วที่สุด</p>
                <p>ทำให้การฝึกและการเรียกชื่อ</p>
                <p>มีประสิทธิภาพ</p>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col items-center h-full">
            <div className="border-2 border-[#E8A856] pt-6 pb-24  rounded-3xl p-20 h-full flex flex-col items-center text-center shadow-xl/100 shadow-[#D3893A] bg-white w-full relative z-10">
              <h3 className="text-[108%] font-bold text-[#425B80] mb-13">
                เสียงพยัญชนะช่วยจดจำ
              </h3>
              <div className="text-[#425B80] space-y-1 leading-relaxed text-sm md:text-base text-balance ">
                <p>ชื่อที่มีเสียงพยัญชนะชัดเจน</p>
                <p>และหนักแน่น (เช่น K, T, R, B)</p>
                <p>จะโดดเด่นและทำให้สัตว์เลี้ยง</p>
                <p>รับรู้ได้ง่ายกว่าชื่อที่มี</p>
                <p>เสียงอ่อน</p>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col items-center h-full">
            <div className="border-2 border-[#E8A856] pt-6 pb-24  rounded-3xl p-20 h-full flex flex-col items-center text-center shadow-xl/100 shadow-[#D3893A] bg-white w-full relative z-10">
              <h3 className="text-[108%] font-bold text-[#425B80] mb-13 ">
ชื่อคือกุญแจสู่ความผูกพัน
              </h3>
              <div className="text-[#425B80] space-y-1 leading-relaxed text-sm md:text-base text-balance ">
                <p>การตั้งชื่อที่สมบูรณ์แบบคือ</p>
                <p>การสร้างความมั่นใจและการ</p>
                <p>สื่อสารเชิงบวก</p>
                <p>เป็นก้าวแรกในการสร้างความ</p>
                <p>สัมพันธ์ที่ยาวนาน</p>
              </div>
            </div>
          </div>

        </div>

      
        
   
        <div className="hidden md:block absolute  left-[19%]  -translate-y-1/1  -translate-x-1 z-20 w-[200px] pointer-events-none">
         
             <Image 
               src="/rapbit.png" 
               alt="Rabbit" 
               width={300} 
               height={400}
               className="object-contain drop-shadow-xl transform scale-134"
             />
        </div>

        {/* Hamster: อยู่ระหว่างการ์ด 2 และ 3 (ค่อนไปทางขวา) */}
        <div className="hidden md:block absolute bottom-[-10px] right-[-100%] left-[45%]  z-20 w-[200px] pointer-events-none  translate-x-1/1   ">
             {/* Note: ใส่รูปแฮมสเตอร์พื้นหลังใสตรงนี้ 
             */}
             <Image 
               src="/hamster.png" 
               alt="Hamster" 
               width={300} 
               height={400}
               className="object-contain drop-shadow-xl"
             />
        </div>

      </div>
    </div>
  );
}