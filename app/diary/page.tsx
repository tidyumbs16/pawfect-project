"use client";
import React, {
  useEffect,
  useRef,
  useState,
  MouseEvent,
  TouchEvent,
} from "react";
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
  Clock3,
  
} from "lucide-react";
import { supabase } from "@/lib/supabase-client";
import { title } from "process";
import { time } from "framer-motion";
import Link from "next/link";
import { useRouter } from 'next/navigation'; 
import { Lexend } from "next/font/google";
import NextImage from 'next/image';

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});

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
  const router = useRouter();
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

const [deleteId, setDeleteId] = useState<string | null>(null);
const [showDeleteModal, setShowDeleteModal] = useState(false);

const [deletePetId, setDeletePetId] = useState<string | null>(null);
const [showDeletePetModal, setShowDeletePetModal] = useState(false);




  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        // 🚩 ถ้าไม่มี session ให้เตะไปหน้า login ทันที
        router.push('/auth/login'); 
      }
    };
    checkAuth();
  }, []);
  // fetch pets
  
 const fetchPetsData = async () => {
  setIsLoadingData(true);
  try {
    // 1. ดึง session ปัจจุบันออกมา
    const { data: { session } } = await supabase.auth.getSession();
    
    // 2. เช็คว่ามี session ไหม
    if (!session) {
      
      return;
    }

    const res = await fetch(`${API_URL}/api/pets`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}` // ✅ ใช้ได้แล้ว ไม่แดงแล้ว
      }
    });
    if (!res.ok) {
      if (res.status === 401) {
        console.error("Token หมดอายุหรือไม่ได้ Login");
        // อาจจะเพิ่ม logic ให้เด้งไปหน้า login ตรงนี้
      }
      throw new Error("Failed to fetch pets");
    }

    const data = await res.json();
    setPets(data);
    return data; // อย่าลืมเอา data ที่ได้ไปเก็บใน state ด้วยนะ

  } catch (error) {
    console.error("Error fetching pets:", error);
  } finally {
    setIsLoadingData(false);
  }
};

  useEffect(() => {
    const init = async () => {
      const data = await fetchPetsData();

      // Accept both: array of pets, or { pets: [...] }
      const arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.pets)
        ? data.pets
        : [];

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
    const selectedPet = pets.find(
      (p) => String(p.id) === String(selectedPetId)
    );
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
        Authorization: `Bearer ${session?.access_token}`, 
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
 Authorization: `Bearer ${session?.access_token}`, 
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

      window.location.reload();
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
      const res = await fetch(
        `${API_URL}/api/appointment?pet_id=${selectedPetId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

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
    id: string;
    title: string;
    content?: string;
    log_date: string;
    image_urls: string[];
  };

  const [showCreateDiary, setShowCreateDiary] = useState(false);
  const [showDiaryForm, setShowDiaryForm] = useState(false);
  const [content, setContent] = useState("");
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [images, setImages] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSaveDiary = async () => {
    if (!selectedPetId) return alert("ยังไม่ได้เลือกสัตว์เลี้ยง");
    if (!title.trim()) return alert("กรุณาใส่หัวข้อ");
    if (!logDate) return alert("กรุณาเลือกวันที่");

    try {
      // 1. ✨ ไปขอ "บัตรประชาชน" (Token) ของคนที่ล็อกอินอยู่มา
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token; // <--- สร้างตัวแปร token ตรงนี้!

      // เช็คหน่อยว่าล็อกอินอยู่จริงไหม
      if (!token) {
        alert("กรุณาล็อกอินก่อนบันทึกข้อมูล");
        return;
      }

      const formData = new FormData();
      formData.append("pet_id", selectedPetId);
      formData.append("title", title);
      formData.append("log_date", logDate);

      if (content?.trim()) {
        formData.append("content", content);
      }

      images.forEach((file) => {
        formData.append("images", file);
      });

      // 2. 🚀 ส่ง Token ไปใน Header เพื่อให้ผ่าน RLS
      const res = await fetch(`${API_URL}/api/diaries`, {
        method: "POST",
        headers: {
          // ทีนี้คำว่า token จะไม่แดงแล้ว เพราะประกาศไว้ข้างบนแล้ว
        Authorization: `Bearer ${session?.access_token}`, 
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(text);
        throw new Error("create diary failed");
      }

      const newDiary: Diary = await res.json();
      setDiaries((prev) => [newDiary, ...prev]);
      setShowDiaryForm(false);

      // reset ค่าในฟอร์ม
      setTitle("");
      setContent("");
      setLogDate("");
      setImages([]);
    } catch (err) {
      console.error(err);
      alert("บันทึกไดอารี่ไม่สำเร็จ");
    }
  };

  const [diaries, setDiaries] = useState<Diary[]>([]);
  useEffect(() => {
  // ถ้ายังไม่ได้เลือกสัตว์เลี้ยง ไม่ต้องโหลด
  if (!selectedPetId) {
    setDiaries([]);
    return;
  }

  const fetchDiaries = async () => {
    try {
      // 1. ดึง session เพื่อเอา token มา
      const { data: { session } } = await supabase.auth.getSession();
      
      // 2. ยิง API โดยแนบ Token ไปด้วย
      const res = await fetch(`${API_URL}/api/diaries/${selectedPetId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) {
        console.error("Fetch diaries failed status:", res.status);
        return;
      }

      const data = await res.json();
      console.log("✅ Loaded diaries for pet:", selectedPetId, data);
      
      // ตรวจสอบว่า data ที่ได้มาเป็น Array หรือไม่
      setDiaries(Array.isArray(data) ? data : []);
      
    } catch (error) {
      console.error("❌ Error fetching diaries:", error);
    }
  };

  fetchDiaries();
}, [selectedPetId]);

  const handleDelete = async (diaryId: string) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    try {
      const res = await fetch(`${API_URL}/api/diaries/${diaryId}`, {
        // แก้ Path ให้ตรงกับ API
        method: "DELETE",
        headers: {
          // ✅ ต้องส่ง Token ไปด้วยเพื่อให้หลังบ้านใช้ลบรูปใน Storage
 Authorization: `Bearer ${session?.access_token}`, 
        },
      });

      if (res.ok) {
        // ✅ ลบสำเร็จ ให้ Update UI (เช่น กรองเอาตัวที่ลบออกไป)
        setDiaries((prev) => prev.filter((d) => d.id !== diaryId));
        
      } else {
        const error = await res.json();
        alert(`ลบไม่สำเร็จ: ${error.message}`);
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("เกิดข้อผิดพลาดในการลบ");
    }
  };
const checkPetBeforeAction = (actionCallback: () => void): void => {
  if (!pets || pets.length === 0) {
    setShowWarningModal(true);
  } else {
    actionCallback();
  }
};
 return (
    <div className={`${lexend.className} min-h-screen bg-gray-50 flex flex-col relative select-none`}>
      {/* HEADER */}
      <header className="pt-10 pb-6 text-center px-4">
        <h1 className="text-3xl font-extrabold text-slate-700 uppercase tracking-wider">
          My Diary
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          เก็บความทรงจำกับสัตว์เลี้ยงตัวโปรดของคุณ
        </p>
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
                const petKey = `pet-${pet?.id ?? idx}-${idx}`;
                const isSelected =
                  selectedPetId !== null &&
                  pet?.id &&
                  String(pet.id) === String(selectedPetId);

                return (
                  <div
                    key={petKey}
                    onClick={() => {
                      if (pet?.id) setSelectedPetId(String(pet.id));
                    }}
                    className="snap-center shrink-0 w-55 h-44 rounded-3xl transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group hover:shadow-md transition-all cursor-pointer p-4 bg-white"
                  >
                    {/* ✅ ปุ่มกากบาทลบ */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletePetId(String(pet?.id));
                        setShowDeletePetModal(true);
                      }}
                      className="absolute top-2 right-3 w-5 h-5 bg-[#EEEEEE]/100 rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
                    >
                      <X size={15} strokeWidth={3} />
                    </button>

                    {/* รูปโปรไฟล์ */}
                    <div
                      className={`w-23 h-23 rounded-full overflow-hidden border-2 mb-3 shadow-sm transition-all ${
                        isSelected
                          ? "border-[#FA9529] ring-2 ring-orange-100"
                          : "border-none"
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

                    <span className="text-[17px] text-[#425B80]">
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
                className="snap-center shrink-0 w-48 h-44 bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative cursor-pointer animate-in fade-in zoom-in duration-300 group hover:shadow-md transition-all p-4"
              >
                <button
                  onClick={(e) => handleRemoveDraft(e, draftId)}
                  className="absolute top-2 right-2 w-5 h-5 bg-[#EEEEEE]/100 rounded-full flex items-center justify-center text-white hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 z-20"
                >
                  <X size={14} strokeWidth={3} />
                </button>
                <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                  <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                    <img
                      src={"/dog_add.png"}
                      alt="ไอคอนเพิ่มสัตว์เลี้ยง"
                      className="w-8 h-8 text-gray-300"
                    />
                  </div>

                  <span className="text-slate-400 text-sm font-medium">
                    เพิ่มสัตว์เลี้ยง
                  </span>
                </div>
              </div>
            ))}

            {/* Add button (always visible) */}
            <button
              key="add-button"
              onClick={handleAddSlot}
              className="snap-center shrink-0 w-14 h-14 rounded-full bg-[#FA9529] flex items-center justify-center text-white transition-all active:scale-95 ml-5"
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
  onClick={() => checkPetBeforeAction(() => setShowAppointmentForm(true))}
  className={`${lexend.className} bg-white p-8 rounded-xl transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 border border-gray-100 flex flex-col items-center justify-center gap-4 active:scale-95 h-32 w-full group`}
>
  <div className="w-[55px] h-[55px] shrink-0 rounded-full border-3 border-orange-400 flex items-center justify-center text-orange-500">
    <Calendar size={24} />
  </div>
  <span className="text-slate-600 font-medium">
    กำหนดกิจกรรมนัดหมาย
  </span>
</button>

{/* ======================================================= */}
{/* 2. ฟอร์มเพิ่มกิจกรรม (แสดงเมื่อ showAppointmentForm เป็น true) */}
{/* ======================================================= */}
{showAppointmentForm && (
  <div className={`${lexend.className} w-full bg-white p-6 rounded-xl transition shadow-[1px_5px_4px] shadow-[#9C9C9C]/80 border border-white mt-2`}>
    
    {/* Input Fields */}
    <label className="text-[15px] text-[#425B80] font-bold ml-4">
      หัวข้อ/กิจกรรม
    </label>
    <input
      className="w-full bg-slate-100 p-4 rounded-[90px] mt-1 focus:outline-none mt-2 text-[#425B80] "
      placeholder="เช่น วันนัดฉีดวัคซีน, วันนัดอาบน้ำ"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
    <label className="text-[15px] text-[#425B80] font-bold ml-4">
      รายละเอียด
    </label>
    <textarea
      className="w-full bg-slate-100 p-5 rounded-[30px] focus:outline-none mt-2 text-[#425B80] "
      rows={3}
      placeholder="รายละเอียดกิจกรรม"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
    <label className="text-[15px] text-[#425B80] font-bold mt-4 ml-4">
      วันที่กำหนด
    </label>
    <input
      type="date"
      placeholder="คลิกเพื่อเลือกวันที่"
      className="w-full bg-slate-100 p-4 rounded-[90px] focus:outline-none mt-2 text-[#425B80] "
      value={date}
      onChange={(e) => setDate(e.target.value)}
    />
    <label className="text-sm text-[#425B80] font-bold mt-4 ml-4">
      เวลาที่กำหนด
    </label>
    <input
      type="time"
      className="w-full bg-slate-100 p-4 rounded-[90px] focus:outline-none mt-2 text-[#425B80] "
      value={time}
      onChange={(e) => setTime(e.target.value)}
    />

    {/* ปุ่ม บันทึก/ยกเลิก */}
    <div className="flex justify-end gap-3 mt-6">
      
      <button
        onClick={handleSaveAppointment}
        className="h-[50px] w-[130px] rounded-xl bg-[#FA9529] text-white font-bold transition shadow-[1px_4px_4px_rgba(156,156,156,0.8)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Lock size={16} strokeWidth={3} /> SAVE
      </button>
      
      <button
        type="button"
        onClick={() => setShowAppointmentForm(false)}
        className="h-[50px] w-[130px] rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-100 transition shadow-[1px_4px_4px_rgba(156,156,156,0.8)]"
      >
        ยกเลิก
      </button>
      
    </div>
  </div>
)}

        {(() => {
          const appointmentList = Array.isArray(appointments)
            ? appointments
            : [];
          if (appointmentList.length === 0) return null;

          const filtered = appointmentList.filter(
            (item) => String(item.pet_id) === String(selectedPetId)
          );

          const filteredAppointments = filtered.filter((item) => {
            if (filter === "all") return true; // 🔹 All = ทั้งหมด
            if (filter === "completed") return item.status === "completed"; // ✅ ติ๊กแล้ว
            if (filter === "pending") return item.status === "pending"; // ⏳ ยังไม่ทำ
            return true;
          });

          const filterLabelMap: Record<typeof filter, string> = {
            all: "ทั้งหมด",
            completed: "เสร็จแล้ว",
            pending: "ยังไม่เสร็จ",
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

             if (res.ok) {
      // ✅ ห้ามแค่ setAppointments เอง 
      // ✅ ต้องเรียกฟังก์ชันที่ไปดึงข้อมูลจาก API มาใหม่ (เช่น loadAppointments)
      await loadAppointments(); 
    }
  } catch (error) {
    console.error(error);
  }
};

          return (
           <div className={`mt-6 ${lexend.className}`}>
  {/* ส่วน Filter และ Status */}
  <div className="flex space-x-5 mb-4">
    <button
      onClick={() => setFilter("all")}
      className={`px-10 py-2 rounded-lg text-sm transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80
${
  filter === "all"
    ? "bg-[#FA9529] text-white"
    : "bg-white text-[#9C9C9C]"
}`}
    >
      All
    </button>

    <button
      onClick={() => setFilter("completed")}
      className={`px-4 py-2 rounded-lg text-sm transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80
${
  filter === "completed"
    ? "bg-[#FA9529] text-white"
    : "bg-white text-[#9C9C9C]"
}`}
    >
      Completed
    </button>

    <button
      onClick={() => setFilter("pending")}
      className={`px-10 py-2 rounded-lg text-sm transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80
${
  filter === "pending"
    ? "bg-[#FA9529] text-white"
    : "bg-white text-[#9C9C9C]"
}`}
    >
      To Do
    </button>
  </div>

  <div className="text-sm text-[#9C9C9C] mb-4">
    Status Filter Terminology : {filterLabelMap[filter]}
  </div>

  {/* Grid Layout สำหรับการ์ดกิจกรรม */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {filteredAppointments.map((item) => (
      <div
        key={item.id}
        className="bg-white p-5 rounded-2xl border border-gray-200 transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 relative"
      >
        {/* ปุ่ม X ที่มุมขวาบน */}
        <button
          onClick={async () => {
            await fetch(`${API_URL}/api/appointment/${item.id}`, {
              method: "DELETE",
            });
            loadAppointments();
          }}
          className="absolute top-2 right-2 z-10 bg-gray-100/80 hover:bg-red-500 hover:text-white text-gray-400 p-1 rounded-full transition-all"
          title="ลบกิจกรรม"
        >
          <X size={14} strokeWidth={2.5} />
        </button>

        {/* ส่วนหัวของการ์ด: Checkbox และ Title */}
        <div className="flex items-start mb-7 pr-8 ml-2">
          <label className="flex items-start space-x-4 cursor-pointer flex-1 -mt-1">
            <input
              type="checkbox"
              checked={item.status === "completed"}
              className="appearance-none border-2 border-gray-300 rounded-lg w-7 h-6 mt-1.5 flex-shrink-0 checked:bg-blue-600 checked:border-blue-600 cursor-pointer transition-all relative before:content-[''] before:absolute before:hidden checked:before:block before:left-1/2 before:top-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-[5px] before:h-[9px] before:border-white before:border-r-[2.5px] before:border-b-[2.5px] before:rotate-45 shadow-sm"
              onChange={() => handleToggleStatus(item.id, item.status)}
            />
            <div className="flex-1">
              <div className="font-bold text-[#425B80] text-[19px]">
                {item.title}
              </div>
              <div className="text-[14px] text-[#B4B4B4] mb-2">
                {item.description}
              </div>
            </div>
          </label>
        </div>

        {/* วันที่และเวลา */}
        <div className="space-y-2 mt-3 ml-3">
          <div className="flex items-center text-sm">
            <Calendar color="#FA9529" size={20} />
            <span className="text-[12px] text-[#B4B4B4] ml-2">
              วันที่กำหนด{" "}
              {new Date(item.appointment_date).toLocaleDateString("th-TH")}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <Clock3 color="#FA9529" size={20} />
            <span className="text-[12px] text-[#B4B4B4] ml-2">
              เวลากำหนด{" "}
              {new Date(item.appointment_date).toLocaleTimeString("th-TH", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              น.
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
  onClick={() => checkPetBeforeAction(() => setShowDiaryForm(true))}
  className={`${lexend.className} bg-white p-8 rounded-xl transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 border border-gray-100 flex flex-col items-center justify-center gap-4 hover:shadow-md transition-all active:scale-95 h-32 w-full group`}
>
  <div className="w-[55px] h-[55px] shrink-0 rounded-full border-3 border-orange-400 flex items-center justify-center text-orange-500">
    <SmilePlus size={30} />
  </div>
  <span className="text-[#425B80] font-sm">
    สร้างโพสต์ใหม่ลงใน Diary ของคุณ
  </span>
</button>

{showDiaryForm && (
  <div className={`${lexend.className} w-full bg-white p-6 rounded-2xl transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 border border-white mt-2`}>
    
    {/* หัวข้อ */}
    <label className="text-2xl text-[#425B80] font-bold ml-5">สร้างโพสต์ใหม่</label>
    <input
      className="w-full bg-slate-100 p-4 rounded-[90px] mt-1 focus:outline-none mt-5 text-[#425B80] "
      placeholder="หัวข้อ"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />

    {/* เนื้อหา */}
    <label className="text-[15px] text-[#425B80] font-bold ml-5">
   
    </label>
    <textarea
      className="w-full bg-slate-100 p-5 rounded-[30px] focus:outline-none mt-5 text-[#425B80] "
      rows={4}
      placeholder="เนื้อหา"
      value={content}
      onChange={(e) => setContent(e.target.value)}
    />

    {/* วันที่ (ย้อนหลังได้) */}
    <label className="text-[15px] text-[#425B80] font-bold ml-5 mt-2">
      
    </label>
    <input
      type="date"
      placeholder="คลิกเพื่อเลือกวันที่"
      className="w-full bg-slate-100 p-4 rounded-[90px] focus:outline-none mt-5 text-[#425B80] "
      value={logDate}
      onChange={(e) => setLogDate(e.target.value)}
    />

    {/* อัปโหลดรูป */}
    <input
      id="diary-images"
      type="file"
      accept="image/*"
      multiple
      className="hidden"
      onChange={(e) => {
        const files = e.target.files;
        if (!files) return;

        setImages((prev) => [...prev, ...Array.from(files)]);
      }}
    />

    {/* preview รูป */}
    {images.length > 0 && (
      <div className="grid grid-cols-3 gap-4 mb-4">
        {images.map((file, index) => (
          <div
            key={index}
            className="relative group rounded-xl overflow-hidden border-none mt-5"
          >
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="w-full h-45 object-cover border-none"
            />

            {/* ปุ่มลบ */}
            <button
              type="button"
              onClick={() =>
                setImages((prev) => prev.filter((_, i) => i !== index))
              }
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-gray-500 flex items-center justify-center shadow hover:bg-red-500 hover:text-white transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    )}
           

            {/* ปุ่ม action */}
<div className={`flex items-center justify-between w-full gap-3 mt-10 ${lexend.className}`}>
  {/* ฝั่งซ้าย: ปุ่มเพิ่มรูปภาพ */}
  <label
    htmlFor="diary-images"
    className="mt-2 inline-flex items-center gap-3 px-10 py-3 border-2 border-[#FA9529] rounded-2xl font-medium cursor-pointer hover:bg-orange-50 text-[#FA9529]"
  >
    <ImagePlus size={22} />
    เพิ่มรูปภาพ
  </label>

  {/* ฝั่งขวา: กลุ่มปุ่มยกเลิก และ SAVE */}
  <div className="flex items-center gap-3 mt-2">

    <button
      onClick={handleSaveDiary}
      className="h-[50px] w-[130px] rounded-xl bg-[#FA9529] text-white font-bold transition shadow-[1px_4px_4px_rgba(156,156,156,0.8)] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
    >
      <Lock size={16} strokeWidth={3} /> SAVE
    </button>
      
    <button
      type="button"
      onClick={() => setShowDiaryForm(false)}
      className="h-[50px] w-[130px] rounded-xl border border-gray-100 text-[#425B80] hover:bg-gray-100 transition shadow-[1px_4px_4px_rgba(156,156,156,0.8)]"
    >
      ยกเลิก
    </button>

  </div>
</div>
  </div>
)}

       {/* =======================
  Diary List
======================= */}
{/* ✅ ปรับเป็นแถวละ 2 การ์ด (md:grid-cols-2) */}
{/* ปรับให้เหลือแถวละ 1 ในมือถือ และแถวละ 2 ในคอม เพื่อให้แต่ละการ์ด "กว้าง" ออกด้านข้าง */}
<div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 w-full ${lexend.className}`}>
  {diaries.map((diary) => (
    <Link
      key={diary.id}
      href={`/iddiarie/${diary.id}`}
      // ✅ กลับไปใช้ความสูง h-40 หรือ h-44 เพื่อไม่ให้มัน "ใหญ่" (สูง) เกินไป
      // ✅ แต่การที่มันอยู่แถวละ 2 จะทำให้มัน "กว้าง" ออกด้านข้างโดยปริยาย
      className="relative bg-white rounded-md border-none overflow-hidden transition shadow-[1px_5px_4px_rgba(156,156,156,0.8)] group cursor-pointer h-45 w-full"
    >
      <button
        onClick={(e) => {
          e.preventDefault(); // ป้องกันไม่ให้ลิงก์ทำงาน
          setDeleteId(diary.id); // เก็บ ID ไว้รอการยืนยัน
          setShowDeleteModal(true); // เปิด Modal
        }}
        className="absolute top-2 right-2 z-10 bg-gray-100/80 hover:bg-red-500 hover:text-white text-gray-400 p-1 rounded-full transition-all"
      >
        <X size={14} strokeWidth={3} />
      </button>

      <div className="flex items-center h-full p-4 sm:p-6 gap-6">
        
        {/* ส่วนข้อความ (ตอนนี้จะมีพื้นที่ด้านกว้างเยอะมาก) */}
        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-[10px] sm:text-xs text-[#FA9529] font-semibold uppercase">
            เมื่อ {new Date(diary.log_date).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>

          <h4 className="font-bold text-[#425B80] text-sm sm:text-[18px] leading-tight line-clamp-1 mt-3">
            {diary.title}
          </h4>

          {diary.content && (
            <p className="text-sm sm:text-[14px] text-[#B4B4B4] whitespace-pre-line break-words line-clamp-2 leading-relaxed mt-4">
              {diary.content}
            </p>
          )}
        </div>

        {/* ส่วนรูปภาพ - ปรับความกว้าง (Width) ของรูปให้มากขึ้นตามตัวการ์ดที่กว้างขึ้น */}
        {Array.isArray(diary.image_urls) && diary.image_urls.length > 0 && (
          <div className="w-32 h-24 sm:w-44 sm:h-30 flex-shrink-0 rounded-md overflow-hidden shadow-sm mr-2">
            <img
              src={diary.image_urls[0]}
              alt="diary cover"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </Link>
  ))}
</div>
      </main>

     {/* WARNING MODAL */}
{showWarningModal && (
  <div 
    onClick={() => setShowWarningModal(false)}
    className={`${lexend.className} fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4`}
  >
    <div className="bg-white rounded-md w-full max-w-md p-12 flex flex-col items-center text-center relative cursor-default">
      <div className="flex flex-col items-center justify-center w-full">
  <NextImage
    className="w-17 h-17 mb-7 object-contain"
    src="/info2.png" 
    alt="info icon"
    width={64} // ปรับให้สัมพันธ์กับ className
    height={64}
  />
</div>

      <h3 className="text-xl text-[#425B80] mb-2">
        Please Add Your Pet
      </h3>
    </div>
  </div>
)}

{showDeleteModal && (
  <div 
    className={`${lexend.className} fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 cursor-pointer`}
    onClick={() => setShowDeleteModal(false)}
  >
    <div 
      // ✅ ขยับ max-w จาก 340px เป็น 380px (กว้างขึ้นอีกหน่อย)
      // ✅ ขยับ py จาก 6 เป็น 8 เพื่อให้ดูมีพื้นที่หายใจ (Vertical space)
      // ✅ ขอบมนกำลังดี rounded-[1.5rem]
      className="bg-white rounded-[1rem] w-full max-w-[380px] px-8 py-8 flex flex-col items-center text-center shadow-2xl relative cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
     
<div className="flex flex-col items-center justify-center w-full">
  <NextImage
    className="w-17 h-17 mb-7 object-contain"
    src="/info2.png" 
    alt="info icon"
    width={64} // ปรับให้สัมพันธ์กับ className
    height={64}
  />
</div>


      {/* 2. ส่วนข้อความ: ฟอนต์ 16px อ่านง่าย */}
      <h3 className="text-[16px] font-sm text-[#425B80] mb-8 leading-tight">
        คุณต้องการลบข้อมูลนี้ใช่หรือไม่?
      </h3>

      {/* 3. ส่วนปุ่ม: กลับมาใช้ขนาด w-[130px] ตามที่มึงเคยเขียนไว้ตอนแรกได้แล้ว เพราะกล่องกว้างพอ */}
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={() => setShowDeleteModal(false)}
          className="h-[48px] w-[130px] rounded-xl border border-gray-300 text-[#425B80] text-sm hover:bg-gray-50 transition shadow-[0px_2px_4px_rgba(0,0,0,0.1)]"
        >
          ยกเลิก
        </button>
        <button
          onClick={() => {
            if (deleteId) {
              handleDelete(deleteId);
              setShowDeleteModal(false);
              setDeleteId(null);
            }
          }}
          className="h-[48px] w-[130px] rounded-xl bg-[#FA9529] text-white text-sm font-bold transition shadow-[0px_2px_4px_rgba(0,0,0,0.15)] active:scale-95 flex items-center justify-center"
        >
          ใช่
        </button>
      </div>
    </div>
  </div>
)}

{showDeletePetModal && (
  <div 
    className={`${lexend.className} fixed inset-0 bg-slate-900/60 z-[100] flex items-center justify-center p-4 cursor-pointer`}
    onClick={() => setShowDeletePetModal(false)}
  >
    <div 
      className="bg-white rounded-[1rem] w-full max-w-[380px] px-8 py-8 flex flex-col items-center text-center relative cursor-default"
      onClick={(e) => e.stopPropagation()}
    >
    <div className="flex flex-col items-center justify-center w-full">
  <NextImage
    className="w-17 h-17 mb-7 object-contain"
    src="/info2.png" 
    alt="info icon"
    width={64} // ปรับให้สัมพันธ์กับ className
    height={64}
  />
</div>

      {/* 2. ส่วนข้อความ: รักษาฟอนต์และสีเดิมของมึงไว้ */}
      <h3 className="text-[16px] font-sm text-[#425B80] mb-8 leading-tight">
        คุณต้องการลบข้อมูลนี้ใช่หรือไม่?
      </h3>
      
      {/* 3. ส่วนปุ่ม: ขนาด 130x50 ตามที่มึงต้องการ จัดวางกึ่งกลาง */}
      <div className="flex gap-4 w-full justify-center">
        <button
          onClick={() => setShowDeletePetModal(false)}
          className="h-[48px] w-[130px] rounded-xl border border-gray-300 text-[#425B80] text-sm hover:bg-gray-50 transition shadow-[0px_2px_4px_rgba(0,0,0,0.1)]"
        >
          ยกเลิก
        </button>
        <button
          onClick={() => {
            if (deletePetId) {
              handleDeletePet(deletePetId);
              setShowDeletePetModal(false);
              setDeletePetId(null);
            }
          }}
          className="h-[48px] w-[130px] rounded-xl bg-[#FA9529] text-white text-sm font-bold transition shadow-[0px_2px_4px_rgba(0,0,0,0.15)] active:scale-95 flex items-center justify-center"
        >
          ใช่
        </button>
      </div>
    </div>
  </div>
)}



















    {/* ADD PET MODAL */}
      {showAddPetModal && (
        <div className={`${lexend.className} fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4`}>
          <div className="bg-white rounded-[1rem] w-full max-w-[30rem] p-6 relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="text-center mb-4 shrink-0">
              <h2 className="text-2xl font-bold text-[#425B80]">
                เพิ่มสัตว์เลี้ยงของคุณ
              </h2>
            </div>

            <div className="space-y-4 overflow-y-auto px-1 pb-2 ">
              <div className="space-y-1 mt-5">
                <label className="text-sm font-semibold text-[#425B80] ml-1">
                  ชื่อ
                </label>
                <input
                  type="text"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="Please Enter Pet Nickname"
                  className="w-full bg-gray-100 border-none rounded-xl px-4 py-3 text-gray-400 focus:none outline-none  transition-all text-[#425B80] "
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-[#425B80] ml-1">
                    รูปภาพสัตว์เลี้ยง
                  </label>
                  {imageSrc && (
                    <button
                      onClick={handleCancelImage}
                      className="text-xs text-[#425B80] hover:underline cursor-pointer font-medium"
                    >
                      เปลี่ยนรูปภาพ
                    </button>
                  )}
                </div>

                {imageSrc ? (
                  <div className="flex flex-col gap-3">
                    <div
                      className="relative w-full aspect-square bg-slate-200 rounded-2xl overflow-hidden shadow-inner ring-4 ring-orange-50 touch-none"
                      ref={containerRef}
                      onMouseDown={(e) =>
                        handleMouseDown(e as unknown as MouseEvent)
                      }
                      onMouseMove={(e) =>
                        handleMouseMove(e as unknown as MouseEvent)
                      }
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseLeave}
                      onTouchStart={(e) =>
                        handleTouchStart(e as unknown as TouchEvent)
                      }
                      onTouchMove={(e) =>
                        handleTouchMove(e as unknown as TouchEvent)
                      }
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

                    <div className={`flex items-center gap-3 px-2 ${lexend.className}`}>
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
                    <p className={`text-xs text-center text-gray-400 ${lexend.className}`}>
                      ลากเพื่อจัดตำแหน่ง • เลื่อนแถบเพื่อซูม
                    </p>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-26 border-2 border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-300 hover:bg-orange-50/50 transition-all group bg-white ${lexend.className}`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef as never}
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                    <div className="flex justify-items-start gap-3 text-gray-400 group-hover:text-orange-400 transition-colors mr-64">
                      {/* ไอคอน ImagePlus */}
                      <ImagePlus size={30} strokeWidth={1.5} /> 
                      
                      {/* ข้อความอัพโหลด */}
                      <span className="text-base font-medium">
                        อัพโหลดรูปภาพ
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className={`flex gap-4 pt-4 mt-auto border-t border-gray-100 ${lexend.className}`}>
              <button
                onClick={handleCancelModal}
                className="flex-1 py-3 px-6 rounded-xl border border-gray-200 text-slate-600 font-semibold hover:bg-gray-50 transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleSavePet}
                disabled={isSaving}
                className="flex-1 py-3 px-6 rounded-xl bg-[#FA9529] text-white font-bold transition shadow-[1px_5px_4px_] shadow-[#9C9C9C]/80 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Lock size={16} strokeWidth={3} /> SAVE
                  </>
                )}
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
