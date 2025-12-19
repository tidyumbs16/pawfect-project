"use client";
import React, { useEffect, useRef, useState, MouseEvent, TouchEvent } from "react";
import {
  Plus,
  Calendar,
  SmilePlus,
  Info,
  Image as ImageIcon,
  X,
  Dog,
  Lock,
  ZoomIn,
  Loader2,
  BookOpen,
  ImagePlus,
} from "lucide-react";
import { supabase  } from "@/lib/supabase-client";
import { title } from "process";
import { time } from "framer-motion";




const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type Pet = {
  id?: string | null;
  name?: string | null;
  image?: string | null;
};

type Point = { x: number; y: number };

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (err) => reject(err));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  zoom: number,
  offset: Point,
  containerSize: number = 256
): Promise<string | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  canvas.width = containerSize;
  canvas.height = containerSize;

  const scale = zoom;
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;

  const centerX = containerSize / 2;
  const centerY = containerSize / 2;

  ctx.translate(centerX + offset.x, centerY + offset.y);
  ctx.drawImage(image, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

  return canvas.toDataURL("image/jpeg", 0.9);
}

export default function MyDiaryPage() {
  // state
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);


  const [draftIds, setDraftIds] = useState<string[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);

  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [petName, setPetName] = useState("");
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  // cropper state
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
const isDown = useRef(false);
const startX = useRef(0);
const scrollLeft = useRef(0);

  // fetch pets
  const fetchPetsData = async () => {
    setIsLoadingData(true);
    try {
      const res = await fetch(`${API_URL}/api/pets`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Connection Error:", err);
      return [];
    }
  };

  useEffect(() => {
    const init = async () => {
      const data = await fetchPetsData();

      // Accept both: array of pets, or { pets: [...] }
      const arr = Array.isArray(data) ? data : Array.isArray(data?.pets) ? data.pets : [];

      setPets(arr);

      // If there are pets, select the first (if not already selected)
      if (arr.length > 0) {
        if (!selectedPetId) {
          // only set if not set
          const firstId = arr[0]?.id;
          if (firstId) setSelectedPetId(String(firstId));
        }
      } else {
        // No pets -> create a draft and open modal automatically
        const newDraft = Date.now().toString();
        setDraftIds([newDraft]);
        setActiveDraftId(newDraft);
      
      }

      setIsLoadingData(false);
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


 
  // scroll when draft added
  useEffect(() => {
  if (!scrollRef.current) return;

  requestAnimationFrame(() => {
    scrollRef.current?.scrollTo({
      left: scrollRef.current.scrollWidth,
      behavior: "smooth",
    });
  });
}, [draftIds.length]);

// ===== drag to scroll (mouse) =====
const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
  if (!scrollRef.current) return;
  isDown.current = true;

  startX.current = e.pageX - scrollRef.current.offsetLeft;
  scrollLeft.current = scrollRef.current.scrollLeft;
};

const onMouseLeave = () => {
  isDown.current = false;
};

const onMouseUp = () => {
  isDown.current = false;
};

const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
  if (!isDown.current || !scrollRef.current) return;
  e.preventDefault();

  const x = e.pageX - scrollRef.current.offsetLeft;
  const walk = (x - startX.current) * 1.5;
  scrollRef.current.scrollLeft = scrollLeft.current - walk;
};

// ===== drag to scroll (touch) =====
const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
  if (!scrollRef.current) return;
  isDown.current = true;
  startX.current = e.touches[0].pageX - scrollRef.current.offsetLeft;
  scrollLeft.current = scrollRef.current.scrollLeft;
};

const onTouchEnd = () => {
  isDown.current = false;
};

const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
  if (!isDown.current || !scrollRef.current) return;

  const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
  const walk = (x - startX.current) * 1.5;
  scrollRef.current.scrollLeft = scrollLeft.current - walk;
};


  // handlers
  const handleMenuClick = (menuName: string) => {
    if (pets.length === 0) {
      setShowWarningModal(true);
      return;
    }
    const selectedPet = pets.find((p) => String(p.id) === String(selectedPetId));
    const petMsg = selectedPet?.name ? `ของน้อง ${selectedPet.name}` : "";
  };




  

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(String(reader.result));
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // drag/crop
  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  const handleTouchStart = (e: TouchEvent) => {
    setIsDragging(true);
    const t = e.touches[0];
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y });
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    const t = e.touches[0];
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y });
  };

  // add draft slot and open modal
  const handleAddSlot = () => {
    const newDraftId = Date.now().toString();
    setDraftIds((prev) => [...prev, newDraftId]);
    setActiveDraftId(newDraftId);
  
  };

  const handleClickDraft = (id: string) => {
    setActiveDraftId(id);
    setShowAddPetModal(true);
  };

  const handleRemoveDraft = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    setDraftIds((prev) => prev.filter((d) => d !== idToRemove));
    if (activeDraftId === idToRemove) setActiveDraftId(null);
  };

  const handleCancelModal = () => {
    setShowAddPetModal(false);
    setActiveDraftId(null);
    setPetName("");
    setImageSrc(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleSavePet = async () => {
  if (!petName.trim()) {
    alert("กรุณากรอกชื่อสัตว์เลี้ยง");
    return;
  }

  setIsSaving(true);

  try {
    // 1️⃣ ดึง session / token จาก Supabase
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึก");
      setIsSaving(false);
      return;
    }

    // 2️⃣ เตรียมรูปภาพ (crop)
    let finalImage = imageSrc ?? null;
    if (imageSrc) {
      const cropped = await getCroppedImg(imageSrc, zoom, offset);
      if (cropped) finalImage = cropped;
    }

    // 3️⃣ ส่ง request ไป backend พร้อม Authorization
    const response = await fetch(`${API_URL}/api/pets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`, // ✅ ส่ง token
      },
      body: JSON.stringify({ name: petName, image: finalImage }),
    });

    if (!response.ok) throw new Error("Failed to save");

    const newPet = await response.json();

    // 4️⃣ อัปเดต local state
    setPets((prev) => [...prev, newPet]);
    if (newPet?.id) setSelectedPetId(String(newPet.id));

    // ลบ draft ถ้ามี
    if (activeDraftId) {
      setDraftIds((prev) => prev.filter((d) => d !== activeDraftId));
      setActiveDraftId(null);
    }

    // reset modal
    setShowAddPetModal(false);
    setPetName("");
    setImageSrc(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

  } catch (err) {
    console.error(err);
    alert("ไม่สามารถบันทึกข้อมูลได้ (ตรวจสอบ server / network หรือ login)");
  } finally {
    setIsSaving(false);
  }
  };
   

  const handleCancelImage = () => {
    setImageSrc(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
console.log("Diary page loaded");

const handleDeletePet = async (id: string) => {
  if (!confirm("ต้องการลบสัตว์เลี้ยงตัวนี้หรือไม่?")) return;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const token = session?.access_token;

    if (!token) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      return;
    }

    const res = await fetch(`${API_URL}/api/pets/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Delete failed");

    // ✅ ลบออกจากหน้าทันที
    setPets((prev) => prev.filter((p) => String(p.id) !== String(id)));

  } catch (err) {
    console.error(err);
    alert("ลบไม่สำเร็จ");
  }

};



const formatThaiTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Bangkok", // บังคับเป็นเวลาไทย
  }).format(date);
};





type Appointment = {
  id: string;
  title: string;
  description: string;
  appointment_date: string;
 status: "pending" | "completed";
  pet_id: string;
};


const [appointments, setAppointments] = useState<Appointment[]>([]);
const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
const [showAppointmentForm, setShowAppointmentForm] = useState(false);

const [title, setTitle] = useState("");
const [description, setDescription] = useState("");
const [date, setDate] = useState("");
const [time, setTime] = useState("");





// Save Function
const handleSaveAppointment = async () => {
  if (!title || !description || !date || !time || !selectedPetId) {
    alert("กรุณากรอกข้อมูลให้ครบและเลือกสัตว์");
    return;
  }

  try {
    // ✅ บันทึกข้อมูล
    const response = await fetch(`${API_URL}/api/appointment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        appointment_date: `${date}T${time}:00`,
        pet_id: selectedPetId,
        status: "pending",
      }),
    });

    if (!response.ok) throw new Error("Failed to save");

    // ✅ รอให้โหลดข้อมูลใหม่เสร็จก่อน (เพิ่ม await)
    await loadAppointments();

    // ปิดฟอร์มและรีเซ็ต
    setShowAppointmentForm(false);
    setTitle("");
    setDescription("");
    setDate("");
    setTime("");

  } catch (error) {
    console.error("Error saving appointment:", error);
    alert("บันทึกไม่สำเร็จ กรุณาลองใหม่");
  }
};



const loadAppointments = async () => {
  try {
    // ✅ ถ้ายังไม่มีสัตว์ที่เลือก ไม่ต้องโหลด
    if (!selectedPetId) {
      console.log("⚠️ No pet selected");
      setAppointments([]);
      return;
    }

    console.log("🔍 Loading appointments for pet:", selectedPetId);
    
    // ✅ ส่ง pet_id เป็น query parameter
    const res = await fetch(`${API_URL}/api/appointment?pet_id=${selectedPetId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("✅ Loaded appointments:", data);
    
    // ✅ ตรวจสอบว่ามี error หรือไม่
    if (data.error) {
      console.error("❌ API Error:", data.error);
      setAppointments([]);
      return;
    }
    
    // ✅ data ควรเป็น array แล้ว
    const appointmentArray = Array.isArray(data) ? data : [];
    setAppointments(appointmentArray);
    
  } catch (error) {
    console.error("❌ Error loading appointments:", error);
    setAppointments([]);
  }
};


useEffect(() => {
  // ปิดฟอร์มเมื่อเปลี่ยนสัตว์
  setShowAppointmentForm(false);
  setTitle("");
  setDescription("");
  setDate("");
  setTime("");
  
  // โหลดข้อมูลใหม่
  if (selectedPetId) {
    console.log("🔄 Pet changed, reloading appointments...");
    loadAppointments();
  } else {
    setAppointments([]);
  }
}, [selectedPetId]);




// ✅ เพิ่ม function สำหรับลบ
const handleDeleteAppointment = async (appointmentId: string) => {
  if (!confirm("ต้องการลบกิจกรรมนี้หรือไม่?")) return;

  try {
    const res = await fetch(`${API_URL}/api/appointment/${appointmentId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Failed to delete");

    // ลบออกจาก state ทันที
    setAppointments((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.filter((item) => item.id !== appointmentId);
    });

  } catch (error) {
    console.error("Error deleting:", error);
    alert("ลบไม่สำเร็จ");
  }
};


 const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");

 



// ✅ function ไดอารี่

type Diary = {
  id: string
  title: string
  content?: string
  log_date: string
  image_urls: string[]
}


const [showCreateDiary, setShowCreateDiary] = useState(false)
const [showDiaryForm, setShowDiaryForm] = useState(false)
const [content, setContent] = useState("")
const [logDate, setLogDate] = useState(
  new Date().toISOString().split("T")[0]
)

const [images, setImages] = useState<File[]>([])
const [loading, setLoading] = useState(false)

const handleSaveDiary = async () => {
  if (!selectedPetId) return alert("ยังไม่ได้เลือกสัตว์เลี้ยง")
  if (!title.trim()) return alert("กรุณาใส่หัวข้อ")
  if (!logDate) return alert("กรุณาเลือกวันที่")

  try {
    // 1. ✨ ไปขอ "บัตรประชาชน" (Token) ของคนที่ล็อกอินอยู่มา
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token; // <--- สร้างตัวแปร token ตรงนี้!

    // เช็คหน่อยว่าล็อกอินอยู่จริงไหม
    if (!token) {
      alert("กรุณาล็อกอินก่อนบันทึกข้อมูล");
      return;
    }

    const formData = new FormData()
    formData.append("pet_id", selectedPetId)
    formData.append("title", title)
    formData.append("log_date", logDate)

    if (content?.trim()) {
      formData.append("content", content)
    }

    images.forEach((file) => {
      formData.append("images", file)
    })

    // 2. 🚀 ส่ง Token ไปใน Header เพื่อให้ผ่าน RLS
    const res = await fetch(`${API_URL}/api/diaries`, {
      method: "POST",
      headers: {
        // ทีนี้คำว่า token จะไม่แดงแล้ว เพราะมึงประกาศไว้ข้างบนแล้ว
        Authorization: `Bearer ${token}`, 
      },
      body: formData,
    })

    if (!res.ok) {
      const text = await res.text()
      console.error(text)
      throw new Error("create diary failed")
    }

    const newDiary: Diary = await res.json()
    setDiaries((prev) => [newDiary, ...prev])
    setShowDiaryForm(false)

    // reset ค่าในฟอร์ม
    setTitle("")
    setContent("")
    setLogDate("")
    setImages([])

  } catch (err) {
    console.error(err)
    alert("บันทึกไดอารี่ไม่สำเร็จ")
  }
}





const [diaries, setDiaries] = useState<Diary[]>([])
useEffect(() => {
  if (!selectedPetId) return

  const fetchDiaries = async () => {
    const res = await fetch(`${API_URL}/api/diaries/${selectedPetId}`)
    const data = await res.json()
    setDiaries(data)
  }

  fetchDiaries()
}, [selectedPetId])



const handleDelete = async (diaryId: string) => {
  if (!confirm("มึงแน่ใจนะว่าจะลบไดอารี่นี้?")) return;
const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
  try {
    const res = await fetch(`${API_URL}/api/diaries/${diaryId}`, { // แก้ Path ให้ตรงกับ API มึง
      method: "DELETE",
      headers: {
        // ✅ ต้องส่ง Token ไปด้วยเพื่อให้หลังบ้านใช้ลบรูปใน Storage
        Authorization: `Bearer ${token}`, 
      },
    });

    if (res.ok) {
      // ✅ ลบสำเร็จ ให้ Update UI (เช่น กรองเอาตัวที่ลบออกไป)
      setDiaries((prev) => prev.filter((d) => d.id !== diaryId));
      alert("ลบเรียบร้อยแล้วมึง!");
    } else {
      const error = await res.json();
      alert(`ลบไม่สำเร็จ: ${error.message}`);
    }
  } catch (err) {
    console.error("Delete error:", err);
    alert("เกิดข้อผิดพลาดในการลบ");
  }
};

 
  // UI
  return (
   
   <div className="min-h-screen bg-gray-50 flex flex-col font-sans relative select-none">
      {/* HEADER */}
      <header className="pt-10 pb-6 text-center px-4">
        <h1 className="text-3xl font-extrabold text-slate-700 uppercase tracking-wider">My Diary</h1>
        <p className="text-slate-500 text-sm mt-2">เก็บความทรงจำกับสัตว์เลี้ยงตัวโปรดของคุณ</p>
      </header>

      {/* MAIN */}
      <main className="flex-1 px-4 max-w-4xl mx-auto w-full space-y-6 flex flex-col pb-20">
        {/* PET LIST */}
        <section className="w-full">
       <div
  ref={scrollRef}
  className="flex items-center gap-4 overflow-x-auto scroll-smooth py-4 px-1 [&::-webkit-scrollbar]:hidden whitespace-nowrap cursor-grab"
  onMouseDown={onMouseDown}
  onMouseLeave={onMouseLeave}
  onMouseUp={onMouseUp}
  onMouseMove={onMouseMove}
  onTouchStart={onTouchStart}
  onTouchEnd={onTouchEnd}
  onTouchMove={onTouchMove}
>
            {/* Loading */}
            {isLoadingData && (
              <div className="snap-center shrink-0 w-48 h-44 flex items-center justify-center">
                <Loader2 className="animate-spin text-orange-400" size={32} />
              </div>
            )}

            {/* Pets */}
            {!isLoadingData &&
              pets.map((pet, idx) => {
                // robust key: prefer id, fallback to index
                const petKey = `pet-${pet?.id ?? idx}-${idx}`;
                const isSelected = selectedPetId !== null && pet?.id && String(pet.id) === String(selectedPetId);


                
               
                return (
                 <div
  key={petKey}
  onClick={() => {
    if (pet?.id) setSelectedPetId(String(pet.id));
  }}
  className="snap-center shrink-0 w-55 h-44 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all cursor-pointer p-4 bg-white"
>
  {/* ✅ ปุ่มกากบาทลบ */}
  <button
  onClick={(e) => {
    e.stopPropagation();
    handleDeletePet(String(pet?.id));
  }}
  className="
    absolute top-2 right-2
    w-6 h-6
    bg-[#EEEEEE]/100
  
    rounded-full 
    flex items-center justify-center
    text-white
    hover:bg-red-500
    hover:text-white
    transition-all
    opacity-0 group-hover:opacity-100
    z-20
  "
>
  <X size={14} strokeWidth={3} />
</button>


  {/* รูปโปรไฟล์ */}
  <div
    className={`w-20 h-20 rounded-full overflow-hidden border-2 mb-3 shadow-sm transition-all ${
      isSelected ? "border-orange-400 ring-2 ring-orange-100" : "border-orange-100"
    }`}
  >
    {pet?.image ? (
      <img
        src={pet.image}
        alt={pet?.name ?? "pet"}
        className="w-full h-full object-cover bg-white"
      />
    ) : (
      <div className="w-full h-full bg-white flex items-center justify-center">
        <Dog size={32} className="text-orange-300" />
      </div>
    )}
  </div>

  <span className="font-bold text-lg text-slate-700">
    {pet?.name ?? "Unnamed"}
  </span>

  {isSelected && (
    <div className="absolute bottom-0 w-30 h-2 bg-[#FA9529] rounded-full animate-in fade-in zoom-in duration-300 shadow-sm" />
  )}
</div>
                );
              })}

            {/* Draft slots */}
            {draftIds.map((draftId) => (
              <div
                key={`draft-${draftId}`}
                onClick={() => handleClickDraft(draftId)}
                className="snap-center shrink-0 w-48 h-44 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative cursor-pointer animate-in fade-in zoom-in duration-300 group hover:border-orange-200 hover:shadow-md transition-all p-4"
              >
                <button
  onClick={(e) => handleRemoveDraft(e, draftId)}
  className="
    absolute top-2 right-2
    w-6 h-6
    bg-[#EEEEEE]/100
  
    rounded-full 
    flex items-center justify-center
    text-white
    hover:bg-red-500
    hover:text-white
    transition-all
    opacity-0 group-hover:opacity-100
    z-20
  "
>
  <X size={14} strokeWidth={3} />
</button>
<div className="w-full h-full flex flex-col items-center justify-center gap-1">
      
      <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-2  ">
        <img 
          src={"/dog_add.png"} 
          alt="ไอคอนเพิ่มสัตว์เลี้ยง" 
       
          className="w-8 h-8 text-gray-300" 
        />
      </div>
      
      {/* ข้อความใต้ไอคอน */}
      <span className="text-slate-400 text-sm font-medium">เพิ่มสัตว์เลี้ยง</span>
      
  
      
    </div>
              </div>
            ))}

            {/* Add button (always visible) */}
            <button
              key="add-button"
              onClick={handleAddSlot}
              className="snap-center shrink-0 w-14 h-14 rounded-full bg-[#FA9529]  flex items-center justify-center text-white  transition-all active:scale-95 ml-5"
            >
              <Plus size={23} strokeWidth={3} />
            </button>
          </div>
        </section>

        {/* Events */}

























{/* ======================================================= */}
{/* 1. ปุ่ม "กำหนดกิจกรรมนัดหมาย" (แสดงเสมอ) */}
{/* ======================================================= */}
<button
  onClick={() => setShowAppointmentForm(true)}
  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all active:scale-95 h-32 w-full group"
>
  <div className="w-[55px] h-[55px] shrink-0 rounded-full border-3 border-orange-400 flex items-center justify-center text-orange-500">
    <Calendar size={24} /> 
  </div>
  <span className="text-slate-600 font-medium">กำหนดกิจกรรมนัดหมาย</span>
</button>

{/* ======================================================= */}
{/* 2. ฟอร์มเพิ่มกิจกรรม (แสดงเมื่อ showAppointmentForm เป็น true) */}
{/* ======================================================= */}
{showAppointmentForm && (
  <div className="w-full bg-white p-6 rounded-2xl shadow-md border mt-5">
    
    {/* Header ของฟอร์ม */}
    <div className="text-center mb-4">
        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500">
            <Calendar size={24} /> 
        </span>
        <h3 className="font-semibold text-slate-700 mt-2">กำหนดกิจกรรมนัดหมาย</h3>
    </div>

    {/* Input Fields */}
    <label className="text-sm text-slate-600 font-medium">หัวข้อ/กิจกรรม</label>
    <input
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      placeholder="เช่น วันนัดฉีดวัคซีน, วันนัดอาบน้ำ"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
    <label className="text-sm text-slate-600 font-medium mt-4">รายละเอียด</label>
    <textarea 
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      rows={3}
      placeholder="รายละเอียดกิจกรรม"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
    <label className="text-sm text-slate-600 font-medium mt-4">วันที่กำหนด</label>
    <input
      type="date"
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      value={date}
      onChange={(e) => setDate(e.target.value)}
    />
    <label className="text-sm text-slate-600 font-medium mt-4">เวลาที่กำหนด</label>
    <input
      type="time"
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      value={time}
      onChange={(e) => setTime(e.target.value)}
    />

    {/* ปุ่ม บันทึก/ยกเลิก */}
    <div className="flex justify-end gap-3 mt-6">
      <button
        type="button"
        onClick={() => setShowAppointmentForm(false)}
        className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
      >
        ยกเลิก
      </button>

      <button
        onClick={handleSaveAppointment}
        className="px-6 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition"
      >
        บันทึก
      </button>
    </div>

  </div>
)}


{(() => {
  const appointmentList = Array.isArray(appointments) ? appointments : [];
  if (appointmentList.length === 0) return null;
  
  const filtered = appointmentList.filter(  
    (item) => String(item.pet_id) === String(selectedPetId)
  );
  
const filteredAppointments = filtered.filter((item) => {
  if (filter === "all") return true;                 // 🔹 All = ทั้งหมด
  if (filter === "completed") return item.status === "completed"; // ✅ ติ๊กแล้ว
  if (filter === "pending") return item.status === "pending";     // ⏳ ยังไม่ทำ
  return true;
});

const filterLabelMap: Record<typeof filter, string> = {
  all: "ทั้งหมด",
  completed: "เสร็จแล้ว",
  pending: "ใกล้มาถึง",
};



  // ถ้ายังไม่มีข้อมูลเลย ไม่แสดงอะไร (รวม Filter)
  if (filtered.length === 0) return null;


  // ✅ เพิ่ม function สำหรับอัพเดทสถานะ
const handleToggleStatus = async (
  appointmentId: string,
  currentStatus: "pending" | "completed"
) => {
  try {
    const newStatus =
      currentStatus === "completed" ? "pending" : "completed";


      
    const res = await fetch(
      `${API_URL}/api/appointment/${appointmentId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );

    if (!res.ok) throw new Error("Failed to update");

    // อัพเดท state
    setAppointments((prev) =>
      prev.map((item) =>
        item.id === appointmentId
          ? { ...item, status: newStatus }
          : item
      )
    );
  } catch (error) {
    console.error("Error updating status:", error);
    alert("อัพเดทสถานะไม่สำเร็จ");
  }
};




  return (
    <div className="mt-6"> 
      
      {/* ส่วน Filter และ Status */}
     <div className="flex space-x-2 mb-4">
  <button
    onClick={() => setFilter("all")}
    className={`px-4 py-1.5 rounded-lg text-sm ${
      filter === "all"
        ? "bg-orange-500 text-white"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    All
  </button>

  <button
    onClick={() => setFilter("completed")}
    className={`px-4 py-1.5 rounded-lg text-sm ${
      filter === "completed"
        ? "bg-orange-500 text-white"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    Completed
  </button>

  <button
    onClick={() => setFilter("pending")}
    className={`px-4 py-1.5 rounded-lg text-sm ${
      filter === "pending"
        ? "bg-orange-500 text-white"
        : "bg-gray-100 text-gray-700"
    }`}
  >
    To Do
  </button>
</div>

<div className="text-sm text-slate-500 mb-4">
  Status Filter Terminology : {filterLabelMap[filter]}
</div>

      
      {/* Grid Layout สำหรับการ์ดกิจกรรม */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAppointments.map((item) => (
          <div
            key={item.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100"
          >
            {/* ส่วนหัวของการ์ด: Checkbox และ Title + ปุ่ม X */}
            <div className="flex justify-between items-start mb-3">
                <label className="flex items-start space-x-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="form-checkbox text-orange-500 rounded border-gray-300 w-5 h-5 mt-1"
                    checked={item.status === 'completed'}
                      onChange={() => handleToggleStatus(item.id, item.status)}
                  />
                  <div>
                      <div className="font-semibold text-slate-700 text-base">{item.title}</div>
                      <div className="text-sm text-slate-500">{item.description}</div>
                  </div>
                </label>
                <button
  onClick={async () => {
    await fetch(`${API_URL}/api/appointment/${item.id}`, {
      method: "DELETE",
    });
    loadAppointments();
  }}
  className="text-gray-400 hover:text-red-500 transition -mt-1"
>
  &times;
</button>

            </div>

            {/* วันที่และเวลา */}
            <div className="space-y-1">
              <div className="flex items-center text-sm text-slate-500">
                <span className="text-orange-400 mr-2">📅</span>
                <span className="text-xs text-slate-500">
                    วันที่กำหนด {new Date(item.appointment_date).toLocaleDateString('th-TH')}
                </span>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <span className="text-orange-400 mr-2">⏰</span>
                <span className="text-xs text-slate-500">
                    เวลากำหนด {new Date(item.appointment_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                </span>
              </div>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
})()}



























<button
  onClick={() => setShowDiaryForm(true)}
  className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all active:scale-95 h-32 w-full group"
>
  <div className="w-[55px] h-[55px] shrink-0 rounded-full border-3 border-orange-400 flex items-center justify-center text-orange-500">
    <BookOpen size={24} />
  </div>
  <span className="text-slate-600 font-medium">เขียนไดอารี่สัตว์เลี้ยง</span>
</button>

{showDiaryForm && (
  <div className="w-full bg-white p-6 rounded-2xl shadow-md border mt-5">

    {/* Header */}
    <div className="text-center mb-4">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-500">
        <BookOpen size={24} />
      </span>
      <h3 className="font-semibold text-slate-700 mt-2">
        เขียนไดอารี่สัตว์เลี้ยง
      </h3>
    </div>

    {/* หัวข้อ */}
    <label className="text-sm text-slate-600 font-medium">หัวข้อ</label>
    <input
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      placeholder="เช่น พาเจ้าโบโบ้ไปเที่ยว"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />

    {/* เนื้อหา */}
    <label className="text-sm text-slate-600 font-medium mt-4">รายละเอียด</label>
    <textarea
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      rows={4}
      placeholder="วันนี้เกิดอะไรขึ้นบ้าง..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />

    {/* วันที่ (ย้อนหลังได้) */}
    <label className="text-sm text-slate-600 font-medium mt-4">
      วันที่ของไดอารี่
    </label>
    <input
      type="date"
      className="w-full bg-slate-100 p-3 rounded-xl mt-1"
      value={logDate}
      onChange={(e) => setLogDate(e.target.value)}
    />

    {/* อัปโหลดรูป */}
{/* อัปโหลดรูป */}
<label className="text-sm text-slate-600 font-medium mt-4 block">
  รูปภาพ
</label>

<input
  id="diary-images"
  type="file"
  accept="image/*"
  multiple
  className="hidden"
  onChange={(e) => {
  const files = e.target.files
  if (!files) return

  setImages((prev) => [
    ...prev,
    ...Array.from(files),
  ])
}}


/>
{/* preview รูป */}
{images.length > 0 && (
  <div className="grid grid-cols-3 gap-4 mb-4">
    {images.map((file, index) => (
      <div
        key={index}
        className="relative group rounded-xl overflow-hidden border"
      >
        <img
          src={URL.createObjectURL(file)}
          alt="preview"
          className="w-full h-32 object-cover"
        />

        {/* ปุ่มลบ */}
        <button
          type="button"
          onClick={() =>
            setImages((prev) => prev.filter((_, i) => i !== index))
          }
          className="
            absolute top-2 right-2
            w-7 h-7 rounded-full
            bg-white/90 text-gray-500
            flex items-center justify-center
            shadow
            hover:bg-red-500 hover:text-white
            transition
          "
        >
          <X size={14} />
        </button>
      </div>
    ))}
  </div>
)}

  {/* ปุ่มเพิ่มรูป */}
<label
  htmlFor="diary-images"
  className="
    mt-2 inline-flex items-center gap-3
    px-5 py-3
    border-2 border-orange-400
    rounded-2xl
    text-orange-500 font-medium
    cursor-pointer
    hover:bg-orange-50
    transition
  "
>
  <ImagePlus size={22} />
  เพิ่มรูปภาพ
</label>



{/* ปุ่ม action */}
<div className="flex justify-end gap-3 mt-6">
  <button
    type="button"
    onClick={() => setShowDiaryForm(false)}
    className="px-5 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
  >
    ยกเลิก
  </button>

  <button
    onClick={handleSaveDiary}
    className="px-6 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition"
  >
    บันทึก
  </button>
</div>
  </div>
)}
{/* =======================
  Diary List
======================= */}

{diaries.map((diary) => (
  <div
    key={diary.id}
    // ✅ 1. เพิ่ม 'relative' เพื่อให้ปุ่มกากบาทอ้างอิงตำแหน่งกับ Card นี้
    className="relative bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition group"
  >
    {/* ✅ 2. ปุ่มกากบาท (Delete Button) */}
    <button
      onClick={(e) => {
        e.stopPropagation(); // กันไม่ให้มันไปโดน Event คลิกของ Card (ถ้ามี)
        handleDelete(diary.id);
        if (confirm("แน่ใจนะว่าจะลบไดอารี่นี้?")) {
          // เรียกฟังก์ชันลบที่นี่ เช่น: onDelete(diary.id)
          console.log("Delete diary:", diary.id);
        }
      }}
      className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-red-500 hover:text-white text-slate-500 p-1.5 rounded-full shadow-sm transition-colors backdrop-blur-sm"
      title="ลบไดอารี่"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>

    {/* รูปปก (รูปแรก) */}
    {Array.isArray(diary.image_urls) && diary.image_urls.length > 0 && (
      <img
        src={diary.image_urls[0]}
        alt="diary cover"
        className="w-full h-40 object-cover"
      />
    )}

    {/* เนื้อหา */}
    <div className="p-4 space-y-1">
      <p className="text-xs text-orange-500">
        {new Date(diary.log_date).toLocaleDateString("th-TH", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </p>

      <h4 className="font-semibold text-slate-700">
        {diary.title}
      </h4>

      {diary.content && (
        <p className="text-sm text-slate-500 line-clamp-2">
          {diary.content}
        </p>
      )}
    </div>
  </div>
))}
     
     
     
     
     
     
      </main>

      {/* WARNING MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-8 flex flex-col items-center text-center shadow-2xl relative">
            <button onClick={() => setShowWarningModal(false)} className="absolute top-4 right-4 text-gray-300 hover:text-gray-500">
              <X size={24} />
            </button>
            <div className="bg-orange-500 w-16 h-16 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-orange-200">
              <Info size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Please Add Your Pet</h3>
            <p className="text-slate-500 text-sm">กรุณาสร้างข้อมูลสัตว์เลี้ยงของคุณก่อน เพื่อเริ่มใช้งานฟีเจอร์นี้</p>
          </div>
        </div>
      )}

     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
     
      {/* ADD PET MODAL */}
      {showAddPetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="text-center mb-4 shrink-0">
              <h2 className="text-2xl font-bold text-slate-700">เพิ่มสัตว์เลี้ยงของคุณ</h2>
            </div>

            <div className="space-y-4 overflow-y-auto px-1 pb-2">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-400 ml-1">ชื่อ</label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="ชื่อเล่นน้อง..."
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-orange-300 outline-none placeholder:text-gray-400 transition-all"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-slate-400 ml-1">รูปโปรไฟล์</label>
                  {imageSrc && (
                    <button onClick={handleCancelImage} className="text-xs text-red-500 hover:underline cursor-pointer font-medium">
                      เปลี่ยนรูปภาพ
                    </button>
                  )}
                </div>

                {imageSrc ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className="relative w-full aspect-square bg-slate-200 rounded-2xl overflow-hidden shadow-inner ring-4 ring-orange-50 cursor-move touch-none"
                      ref={containerRef}
                      onMouseDown={(e) => handleMouseDown(e as unknown as MouseEvent)}
                      onMouseMove={(e) => handleMouseMove(e as unknown as MouseEvent)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={(e) => handleTouchStart(e as unknown as TouchEvent)}
                      onTouchMove={(e) => handleTouchMove(e as unknown as TouchEvent)}
                      onTouchEnd={handleMouseUp}
                    >
                      <img
                        src={imageSrc}
                        alt="Crop Preview"
                        className="absolute origin-center transition-transform duration-75 pointer-events-none "
                        style={{
                          top: "50%",
                          left: "50%",
                          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                          maxWidth: "none",
                          maxHeight: "none",
                        }}
                        draggable={false}
                      />
                      <div className="absolute inset-0 border-2 border-white/20 pointer-events-none grid grid-cols-3 grid-rows-3">
                        <div className="border-r border-b border-white/10" />
                        <div className="border-r border-b border-white/10" />
                        <div className="border-b border-white/10" />
                        <div className="border-r border-b border-white/10" />
                        <div className="border-r border-b border-white/10" />
                        <div className="border-b border-white/10" />
                        <div className="border-r border-white/10" />
                        <div className="border-r border-white/10" />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 px-2">
                      <ZoomIn size={18} className="text-gray-400" />
                      <input
                        type="range"
                        value={zoom}
                        min={0.5}
                        max={3}
                        step={0.1}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                    <p className="text-xs text-center text-gray-400">ลากเพื่อจัดตำแหน่ง • เลื่อนแถบเพื่อซูม</p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all group bg-white"
                  >
                    <input type="file" ref={fileInputRef as never} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    <div className="text-gray-300 group-hover:text-orange-400 transition-colors mb-2">
                      <ImageIcon size={32} />
                    </div>
                    <span className="text-gray-400 text-sm group-hover:text-orange-400">เลือกรูปภาพ</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4 mt-auto border-t border-gray-100">
              <button onClick={handleCancelModal} className="flex-1 py-3 px-6 rounded-xl border border-gray-200 text-slate-600 font-semibold hover:bg-gray-50 transition-colors">
                ยกเลิก
              </button>

              <button
                onClick={handleSavePet}
                disabled={isSaving}
                className="flex-1 py-3 px-6 rounded-xl bg-orange-500 text-white font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <><Lock size={16} /> บันทึก</>}
              </button>
            </div>
          </div>
        </div>
      )}
   
   
   
   
    </div>
 




);
}


function setTitle(arg0: string) {
  throw new Error("Function not implemented.");
}

function setDate(arg0: string) {
  throw new Error("Function not implemented.");
}

function setNote(arg0: string) {
  throw new Error("Function not implemented.");
}

function setType(arg0: string) {
  throw new Error("Function not implemented.");
}

function setTime(arg0: string) {
  throw new Error("Function not implemented.");
}
  