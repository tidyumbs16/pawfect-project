import Image from "next/image";
import { Lexend } from "next/font/google"; // สมมติว่ามึงใช้ Next Font




const lexend = Lexend({ subsets: ["latin"] });

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-[#FDFDFD]">
      {/* --- 1. Header Section: About Us + Mascot --- */}
      <section className={`w-full py-16 bg-[#FDFDFD] overflow-hidden ${lexend.className}`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="relative flex items-center justify-center">
            {/* คำว่า About (ฝั่งซ้าย) */}
            <h2 className="text-[60px] md:text-[110px] font-black text-[#E07502] uppercase -translate-x-30 tracking-tighter z-10 ">
              About
            </h2>

            {/* รูปต้าวคอร์กี้ตรงกลาง */}
            <div className="relative w-[280px] md:w-[660px] aspect-square mx-[-30px] md:mx-[-60px] z-20 -translate-x-20">
              <Image
                src="/dogabout.png"
                alt="Happy Corgi"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* คำว่า Us (ฝั่งขวา) */}
            <h2 className="text-[60px] md:text-[110px] font-black text-[#E07502] -translate-x-10 uppercase tracking-tighter z-10">
              Us
            </h2>
          </div>
        </div>
      </section>

    
      

      
     {/* --- 3. Mission Section: ก้อนสีส้ม --- */}
{/* --- 3. Mission Section: ก้อนสีส้ม (วิสัยทัศน์/นวัตกรรม/เป้าหมาย) --- */}
<section className={`w-full bg-[#FA9529] px-6 md:px-0 ${lexend.className}`}>
  <div className="w-full flex flex-col items-center">
    
    {/* 3.1 วิสัยทัศน์และพันธกิจ */}
    <div className="w-full max-w-7xl py-24 flex flex-col md:flex-row items-start gap-10 md:gap-16 md:px-20">
      {/* ฝั่งหัวข้อ: ใช้ md:w-1/3 ตามสั่ง และเอา translate-y ออกเพื่อให้เรียงตรงกัน */}
      <div className="md:w-1/3 shrink-0 md:pl-5">
        <h2 className="text-3xl md:text-[35px] font-black text-white leading- translate-y-20">
          วิสัยทัศน์และพันธกิจ
        </h2>
      </div>
      <div className="md:w-2/3 space-y-5 md:pl-2">
        <p className="text-white text-lg md:text-[17px] font-medium leading-snug">
          จุดเริ่มต้นของ Pawfect Name: จากงานวิชาการสู่มิตรภาพที่ยั่งยืน
        </p>
        <div className="text-white/95 text-[16px] md:text-[17px] leading-relaxed font-medium space-y-1 -translate-y-4">
          <p><span className="font-bold">Pawfect Name</span> คือโปรเจกต์จบการศึกษาจากคณะวิทยาศาสตร์ สาขาวิทยาการคอมพิวเตอร์</p>
          <p>มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</p>
          <p>โดยมีเป้าหมายในการสร้างแพลตฟอร์มที่เชื่อมโยงเทคโนโลยีเข้ากับความต้องการพื้นฐานของผู้เลี้ยงสัตว์เลี้ยง</p>
          <p>พันธกิจของเราคือ: <span className="font-medium text-white">ปฏิวัติวิธีการตั้งชื่อสัตว์เลี้ยงให้ง่ายขึ้น แม่นยำขึ้น และมีความหมายลึกซึ้งยิ่งขึ้น</span></p>
          <p>เพื่อมอบของขวัญชิ้นแรกที่สมบูรณ์แบบที่สุดให้กับสมาชิกใหม่ในครอบครัวของคุณ</p>
        </div>
      </div>
    </div>

    {/* ✨ เส้นกั้นสีขาว */}
    <div className="w-full max-w-[1450px] h-[1.5px] bg-white opacity-90" />

    {/* 3.2 นวัตกรรมและเทคโนโลยี */}
    <div className="w-full max-w-7xl py-24 flex flex-col md:flex-row items-start gap-10 md:gap-16 md:px-20">
      <div className="md:w-1/3 shrink-0 md:pl-5">
        <h2 className="text-3xl md:text-[38px] font-black text-white leading-tight translate-y-8">
          นวัตกรรม<br className="hidden md:block" />และเทคโนโลยี
        </h2>
      </div>
      <div className="md:w-2/3 md:pl-2">
        <div className="text-white/95 text-[16px] md:text-[17px] leading-relaxed font-medium space-y-1">
          <p><span className="font-bold">Pawfect Name</span> ไม่ได้เป็นเพียงฐานข้อมูลชื่อทั่วไป</p>
          <p>แต่เป็นเครื่องมืออัจฉริยะที่พัฒนาขึ้นภายใต้หลักการวิเคราะห์ข้อมูล</p>
          <p><span className="font-bold">ระบบ AI Name Generator:</span> เราใช้ <span className="font-bold">Machine Learning (ML)</span> ในการประมวลผลความสัมพันธ์ระหว่าง</p>
          <p>ประเภทสายพันธุ์ ลักษณะนิสัย เพื่อแนะนำชื่อที่มีโอกาสถูกใจผู้ใช้สูงสุด</p>
        </div>
      </div>
    </div>

    {/* ✨ เส้นกั้นสีขาว */}
    <div className="w-full max-w-[1450px] h-[1.5px] bg-white opacity-90" />

    {/* 3.3 เป้าหมายของโปรเจกต์ */}
    <div className="w-full max-w-7xl py-24 flex flex-col md:flex-row items-start gap-10 md:gap-16 md:px-20">
      <div className="md:w-1/3 shrink-0 md:pl-5">
        <h2 className="text-3xl md:text-[35px] font-black text-white leading-tight translate-y-17">
          เป้าหมายของโปรเจกต์
        </h2>
      </div>
      <div className="md:w-2/3 md:pl-2">
        <ul className="space-y-3 text-white/95 text-[16px] md:text-[17px] font-medium">
          <li>1. ได้เครื่องมือสำหรับตั้งชื่อสัตว์เลี้ยงในรูปแบบเว็บแอปพลิเคชันที่ประยุกต์ใช้กับเทคโนโลยีที่ทันสมัย สอดคล้องกับเทคโนโลยีพัฒนาประเทศ และพัฒนาโลกปัจจุบัน</li>
          <li>2. มีความสะดวกในการใช้งานเนื่องจากอยู่ในรูปแบบเว็บแอปพลิเคชัน</li>
          <li>3. ได้ชื่อสัตว์เลี้ยงที่สอดคล้องกับปัจจัยหรือเงื่อนไขข้อกำหนดจากผู้ใช้งาน</li>
        </ul>
      </div>
    </div>
  </div>
</section>
{/* --- 4. Pet Connection Section: ก้อนรวมความน่ารัก (จากรูปที่มึงส่งมา) --- */}
      <section className={`w-full py-20 bg-[#FDFDFD] ${lexend.className}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-20">
          
          {/* ข้อความหัวเรื่อง ตามภาพ */}
          <div className="text-center mb-12">
            <h2 className="text-[#425B80] text-xl md:text-[28px] font-bold">
              “อย่าปล่อยให้เขารอนาน มาหาชื่อที่สมบูรณ์แบบให้เขาได้แล้ว”
            </h2>
          </div>

          {/* ก้อน Grid รูปภาพสัตว์เลี้ยง (ใช้ไฟล์ grouppet.jpg) */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-[1200px] aspect-[16/9] md:aspect-[1.6/1] ">
              <Image
                src="/grouppet.png" // อย่าลืมใส่รูปนี้ใน public folder นะครับ
                alt="Lovely Pets Collection"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

        </div>
      </section>

 {/* --- 5. Our Team Section: สไตล์ Doodle ตามภาพ --- */}
      <section className={`w-full py-24 bg-white ${lexend.className}`}>
        <div className="max-w-7xl mx-auto px-6">
          
          {/* หัวข้อ Our Team */}
          <div className="text-center mb-20">
            <p className="text-[#425B80] text-lg font-medium mb-2">Our Team</p>
            <h2 className="text-[#FA9529] text-5xl md:text-6xl font-black mb-4">
              The People Behind This
            </h2>
            <p className="text-[#3E5067] text-lg font-medium">
              นักศึกษาผู้ร่วมสร้างสรรค์เว็บไซต์
            </p>
          </div>

          {/* Grid ทีมงาน 2 คน (Full Stack & UI/UX) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-4 max-w-5xl mx-auto mt-10 items-end"> 
  {/* 👆 ใส่ items-end เพื่อให้ฐานของรูปทุกใบวางอยู่บนระนาบเดียวกันเป๊ะ */}

  {/* คนที่ 1: Full Stack Developer */}
  <div className="flex flex-col items-center group">
    {/* ✅ กำหนดความสูง h-[270px] ให้เท่ากันทั้งสองฝั่ง */}
    <div className="relative w-full h-[270px] max-w-[350px] mb-8">
      <Image
        src="/fullst.png"
        alt="Full Stack Developer Doodle"
        fill
        className="object-contain object-bottom" // ✅ บังคับให้รูปชิดขอบล่างของกรอบ
      />
    </div>
    <h3 className="text-[#425B80] text-xl font-bold mb-6">Full Stack Developer</h3>
              
              {/* Social Icons */}
              <div className="flex gap-3">
                <a href="https://www.facebook.com/suraj.deemeesri.5/" className="w-6 h-6 hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/tawxn.d/" className="w-6 h-6 hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" />
                </a>
                <a href="https://github.com/tidyumbs16" className="w-6 h-6 hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" />
                </a>
              </div>
            </div>

            {/* คนที่ 2: UI/UX Designer */}
<div className="flex flex-col items-center group">
    {/* ✅ ใช้ความสูง h-[270px] และ max-w-[350px] เท่ากันเป๊ะ */}
    <div className="relative w-full h-[270px] max-w-[350px] mb-8">
      <Image
        src="/ux2.png"
        alt="UI/UX Designer Doodle"
        fill
        className="object-contain object-bottom" // ✅ ชิดขอบล่างเหมือนกันเพื่อให้ "เท้า" หรือฐานวางเท่ากัน
      />
    </div>
    <h3 className="text-[#3E5067] text-xl font-bold mb-6">UI/UX Designer</h3>
              
              {/* Social Icons */}
              <div className="flex gap-3">
                <a href="https://www.facebook.com/fern.thipthanya" className="w-6 h-6 hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/b/b8/2021_Facebook_icon.svg" alt="Facebook" />
                </a>
                <a href="https://www.instagram.com/_thipthanya/" className="w-6 h-6 hover:opacity-80 transition-opacity">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg" alt="Instagram" />
                </a>
                <a href="https://www.figma.com/@pato10" className="w-6.5 h-6.5 p-[2px] border bg-[#3F3F3F] border-[#3F3F3F] rounded-full hover:opacity-80 transition-opacity flex items-center justify-center">
    <img 
      src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" 
      alt="Figma" 
      className="w-full h-full p-[2px]" 
    />
  </a>
              </div>
            </div>

          </div>

          
        </div>
      </section>

    
      
    </main>
  );
}