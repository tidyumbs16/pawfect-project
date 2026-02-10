"use client";
import { supabase } from "@/lib/supabase-client";
import { Bot, Heart, ImageIcon, Send, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

import { Lexend } from "next/font/google";

const lexend = Lexend({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

// --- Interface ---
interface IPetNameSuggestion {
  nameTh: string;
  nameEn: string;
  meaning: string;
  tag: string;
}
interface IMessage {
  role: "user" | "model";
  text: string;
  image?: string | null;
  suggestions?: IPetNameSuggestion[];
}
interface IChatHistory {
  role: "user" | "model";
  parts: { text: string }[];
}
interface IPetNameRecord {
  name: string;
  meaning: string;
  type: string;
}
interface IFavoriteResponse {
  id: number;
  name_id: number;
  pet_names: IPetNameRecord | IPetNameRecord[];
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  bio?: string | null;
  gender?: string | null;
  birthdate?: string | null;
}

interface PetNameSuggestion {
  nameTh: string;
  nameEn: string;
  style: string;
  meaning: string;
}

const extractTagsFromUserMessage = (userMessage: string): string => {
  const styleKeywords = [
    "เท่",
    "น่ารัก",
    "ขรึม",
    "แข็งแกร่ง",
    "น่าเกรงขาม",
    "สง่า",
    "ดุดัน",
    "ซน",
    "ซุกซน",
    "ร่าเริง",
    "สดใส",
    "เฉียบขาด",
    "กล้าหาญ",
    "อ่อนโยน",
    "เรียบหรู",
    "ทันสมัย",
    "คลาสสิค",
    "ไทยๆ",
    "ญี่ปุ่น",
    "เกาหลี",
    "จีน",
    "ขี้อ้อน",
    "น่ากอด",
    "แสบ",
    "ดุร้าย",
    "cool",
    "cute",
    "strong",
    "fierce",
  ];

  const foundTags: string[] = [];
  const lowerMessage = userMessage.toLowerCase();

  styleKeywords.forEach((keyword) => {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      foundTags.push(keyword);
    }
  });

  return foundTags.length > 0 ? foundTags.join(" / ") : "แนะนำ";
};

const parseAIResponse = (
  text: string | undefined,
  userMessage: string = "",
): IPetNameSuggestion[] => {
  if (!text) return [];

  console.log("🔍 AI Response:", text);
  console.log("👤 User Message:", userMessage);

  const suggestions: IPetNameSuggestion[] = [];
  const lines = text.split("\n");

  const userTags = extractTagsFromUserMessage(userMessage);
  console.log("🏷️ Extracted Tags:", userTags);

  lines.forEach((line, index) => {
    let nameEn = "";
    let nameTh = "";
    let meaning = "";
    let match;

    // ✅ กรณีที่ 1: มีชื่อไทยในวงเล็บ **Name (ชื่อไทย):** ความหมาย
    match = line
      .trim()
      .match(
        /^[\d*\-•]*[\.\)]*\s*\*\*([^*\(]+?)\s*\(([^\)]+?)\)\*\*[\s]*[:\-–—]+\s*(.+)/,
      );

    if (match) {
      const name1 = match[1].trim();
      const name2 = match[2].trim();
      const meaningText = match[3].trim();

      // แยกว่าอันไหนเป็นไทย อันไหนเป็นอังกฤษ
      const hasThaiChar1 = /[\u0E00-\u0E7F]/.test(name1);
      const hasThaiChar2 = /[\u0E00-\u0E7F]/.test(name2);
      const hasEngChar1 = /[a-zA-Z]/.test(name1);
      const hasEngChar2 = /[a-zA-Z]/.test(name2);

      if (hasEngChar1 && hasThaiChar2) {
        nameEn = name1;
        nameTh = name2;
      } else if (hasThaiChar1 && hasEngChar2) {
        nameTh = name1;
        nameEn = name2;
      } else {
        if (hasEngChar1) nameEn = name1;
        if (hasThaiChar1) nameTh = name1;
        if (hasEngChar2) nameEn = nameEn || name2;
        if (hasThaiChar2) nameTh = nameTh || name2;
      }

      meaning = meaningText;
      console.log(`✅ Format with () matched: "${name1}" + "${name2}"`);
    } else {
      // ✅ กรณีที่ 2: ไม่มีวงเล็บ **Name:** ความหมาย
      match = line
        .trim()
        .match(/^[\d*\-•]*[\.\)]*\s*\*\*([^*:]+?)\*\*[\s]*[:\-–—]+\s*(.+)/);

      if (match) {
        const name = match[1].trim();
        const meaningText = match[2].trim();

        // เช็คว่าเป็นภาษาอะไร
        const hasThaiChar = /[\u0E00-\u0E7F]/.test(name);
        const hasEngChar = /[a-zA-Z]/.test(name);

        if (hasEngChar) {
          nameEn = name;
          nameTh = name; // ใช้ชื่อเดียวกันถ้าไม่มีชื่อไทย
        } else if (hasThaiChar) {
          nameTh = name;
          nameEn = name; // ใช้ชื่อเดียวกันถ้าไม่มีชื่ออังกฤษ
        }

        meaning = meaningText;
        console.log(`✅ Format without () matched: "${name}"`);
      }
    }

    if ((nameTh || nameEn) && meaning) {
      console.log(`🔤 nameEn: "${nameEn}"`);
      console.log(`🇹🇭 nameTh: "${nameTh}"`);
      console.log(`📝 meaning: "${meaning}"`);

      const medicalKeywords = [
        "งดอาหาร",
        "สังเกตอาการ",
        "หาหมอ",
        "รักษา",
        "ฉุกเฉิน",
        "แพทย์",
        "ป่วย",
        "ยา",
        "วัคซีน",
        "ผ่าตัด",
        "ติดเชื้อ",
        "สุขภาพ",
        "อาการ",
        "วินิจฉัย",
        "วางยา",
        "ห้องฉุกเฉิน",
        "ตรวจเลือด",
        "แผล",
        "พยาบาล",
        "การดูแล",
        "การรักษา",
        "ขอปรึกษา",
        "มีไข้",
        "เจ็บป่วย",
        "ปวดท้อง",
        "อาเจียน",
        "ท้องเสีย",
        "ซึมเศร้า",
        "เบื่ออาหาร",
        "หายใจลำบาก",
        "แพ้ยา",
        "บาดเจ็บ",
        "คำแนะนำ",
        "ควร",
        "ไม่ควร",
      ];

      const checkText = `${line} ${meaning}`.toLowerCase();
      const isMedical = medicalKeywords.some((word) =>
        checkText.includes(word.toLowerCase()),
      );

      if (!isMedical) {
        suggestions.push({
          nameTh: nameTh || nameEn, // ถ้าไม่มีชื่อไทยให้ใช้อังกฤษแทน
          nameEn: nameEn || nameTh, // ถ้าไม่มีชื่ออังกฤษให้ใช้ไทยแทน
          tag: userTags,
          meaning: meaning,
        });
        console.log(
          `✅ Added: ${nameTh || nameEn} (${nameEn || nameTh}) - Tag: ${userTags}`,
        );
      } else {
        console.log(`❌ Skipped - Medical: ${isMedical}`);
      }
    } else {
      console.log(`❌ Line ${index} NOT matched:`, line);
    }
  });

  console.log("📊 Total suggestions:", suggestions.length);
  return suggestions.slice(0, 3);
};

const NameCard = ({
  nameTh,
  nameEn,
  meaning,
  tag,
  isAlreadyLiked,
  onLike,
}: IPetNameSuggestion & { isAlreadyLiked: boolean; onLike: () => void }) => {
  // 🔥 คืนค่า Logic Tag ดั้งเดิม ต้องมีคำว่า "แนะนำ"
  const processTags = (tagStr: string) => {
    if (!tagStr) return ["แนะนำ"];
    return tagStr
      .split(/[,\/\s|]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  };

  const tagsArray = processTags(tag);
  const displayTags = tagsArray.join(" / ");

  return (
    <div className="w-[360px] h-[140px] rounded-[1rem] p-5 border border-white flex flex-col gap-4 shrink-0 transition-all shadow-lg bg-white/80 backdrop-blur-sm ">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-baseline min-w-0">
          <h3 className="text-[18px] font-black text-[#4A628A] truncate">
            {nameTh}
            {nameEn ? ` (${nameEn})` : ""}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Tag สี Gradient เดิมเป๊ะ */}
          <span className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#69E3F0] to-[#B6F0D7] text-white text-[12px] font-black shadow-sm">
            {displayTags}
          </span>

          {/* 🔥 คืนค่าปุ่มกลมๆ สีแดง/เทา อันดั้งเดิมของ ห้ามหายไปไหนอีก! */}
          <button
            onClick={(e) => {
              e.preventDefault();
              onLike();
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all active:scale-90 ${
              isAlreadyLiked
                ? "bg-[#FA787C] text-white shadow-md"
                : "bg-[#E5E7EB] text-white hover:bg-red-200"
            }`}
          >
            <Heart
              size={18}
              fill={isAlreadyLiked ? "currentColor" : "none"}
              strokeWidth={isAlreadyLiked ? 0 : 3}
            />
          </button>
        </div>
      </div>

      <p className="text-[12px] text-slate-500 font-bold leading-relaxed whitespace-normal break-words">
        ความหมาย : {meaning}
      </p>
    </div>
  );
};

export default function ChatbotUI() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [history, setHistory] = useState<IChatHistory[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("User");
  const [greeting, setGreeting] = useState("Good Day");
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [favorites, setFavorites] = useState<IPetNameSuggestion[]>([]);
  const [likedNames, setLikedNames] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      // 3.1 หา User ที่ Login อยู่
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // 3.2 ดึงข้อมูลจากตาราง profiles
        const { data, error } = await supabase
          .from("profiles") // เช็คชื่อตารางให้ตรง (profiles หรือ users)
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile(data); // ✅ เก็บเข้า State แล้ว!
          setUsername(data.username || "User"); // อัปเดตชื่อให้ตรงด้วยเลย
        }
      }
    };

    fetchProfile();
  }, []);

  // Favorite Logic
  const toggleFavorite = async (suggestion: IPetNameSuggestion) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน!");
      return;
    }

    const userId = user.id;

    try {
      // 1. บันทึกลง pet_names (Logic เดิม)
      const { data: petData, error: petError } = await supabase
        .from("pet_names")
        .upsert(
          {
            name_th: suggestion.nameTh,
            name_en: suggestion.nameEn,
            meaning: suggestion.meaning,
            type: suggestion.tag,
            name: `${suggestion.nameTh} (${suggestion.nameEn})`,
          },
          { onConflict: "name" },
        )
        .select()
        .single();

      if (petError) throw petError;
      if (!petData) return;

      // 2. เช็คใน favorites
      const { data: existing, error: favError } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("name_id", petData.id)
        .maybeSingle();

      if (favError) throw favError;

      if (existing) {
        // --- กรณี Unlike ---
        await supabase.from("favorites").delete().eq("id", existing.id);

        // 🔥 แก้จุดนี้: ลบ ID และ ลบ "ชื่อ" ออกจาก Set เพื่อให้หัวใจหายแดง
        setLikedIds((prev) => prev.filter((id) => id !== petData.id));
        setLikedNames((prev) => {
          const next = new Set(prev);
          next.delete(suggestion.nameTh);
          return next;
        });

        console.log("Unlike เรียบร้อย");
      } else {
        // --- กรณี Like ---
        await supabase
          .from("favorites")
          .insert({ user_id: userId, name_id: petData.id });

        // 🔥 แก้จุดนี้: เพิ่ม ID และ เพิ่ม "ชื่อ" เข้า Set เพื่อให้หัวใจแดงทันที
        setLikedIds((prev) => [...prev, petData.id]);
        setLikedNames((prev) => new Set(prev).add(suggestion.nameTh));

        console.log("Like เรียบร้อย");
      }
    } catch (err) {
      console.error("เกิดข้อผิดพลาด!: ", err);
    }
  };

  const fetchMyFavorites = async (currentUserId: string) => {
    // ระบุ Type ให้กับ select query
    const { data, error } = await supabase
      .from("favorites")
      .select(
        `
      id,
      name_id,
      pet_names (
        name,
        meaning,
        type
      )
    `,
      )
      .eq("user_id", currentUserId);

    if (error) {
      console.error("Fetch error:", error);
      return [];
    }

    // Casting data เป็น Interface ที่เราสร้างไว้
    const rawData = data as unknown as IFavoriteResponse[];

    return rawData
      .map((item) => {
        // จัดการกับข้อมูลที่อาจจะมาเป็น Array หรือ Object โดยไม่ต้องใช้ any
        const pet = Array.isArray(item.pet_names)
          ? item.pet_names[0]
          : item.pet_names;

        if (!pet) return null;

        const cleanName = pet.name.replace(/\*/g, "").trim();
        const nameTh = cleanName.split(" (")[0].split(" ")[0].trim();
        const nameEnMatch = cleanName.match(/\(([^)]+)\)/);
        let nameEn = nameEnMatch ? nameEnMatch[1].trim() : "";

        if (nameEn === nameTh) nameEn = "";

        return {
          favId: item.id,
          nameTh: nameTh,
          nameEn: nameEn,
          meaning: pet.meaning.replace(/\*/g, "").trim(),
          tag: pet.type || "แนะนำ",
          isAlreadyLiked: true,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    // ตัว filter ด้านบนช่วยให้ TS รู้ว่าผลลัพธ์จะไม่มีค่า null แน่นอน
  };

  // ✅ Handle Send (Update Logic 1, 2, 3)
  const handleSend = async (
    textOverride?: string,
    isNaming: boolean = false,
  ) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim() && !selectedFile) return;

    const isNamingButton =
      textToSend === "ขอชื่อแนะนำ 3 ชื่อ" || textToSend === "ตั้งชื่อตามสไตล์";

    setLoading(true);
    setInputText("");
    const currentPreview = previewUrl;
    const currentFile = selectedFile;
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageFile(null);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: textToSend,
        image: currentPreview,
        isNamingFlow: isNamingButton, // เก็บไว้เช็คตอน AI ตอบกลับ
      },
    ]);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // ✅ กุเซ็ต System Instruction ตรงนี้เลยเพื่อให้ AI ทำตามเงื่อนไข
      let messageToAI = textToSend;

      if (textToSend === "ขอชื่อแนะนำ 3 ชื่อ") {
        messageToAI = `ฉันอยากให้คุณช่วยตั้งชื่อสัตว์เลี้ยง 3 ชื่อ 
    เงื่อนไข:
    1. ตอนนี้อย่าเพิ่งเสนอชื่อ 
    2. ให้คุณถามคำถามฉันก่อน: 1.สัตว์เลี้ยงคืออะไร 2.เพศอะไร 3.สไตล์ไหน
    3. ห้ามใช้รูปแบบ 'ลำดับ. ชื่อไทย [สไตล์] : ความหมาย' ในรอบการถามนี้เด็ดขาด`;
      } else if (textToSend === "ตั้งชื่อตามสไตล์") {
        messageToAI = `ฉันอยากตั้งชื่อตามสไตล์ 
  เงื่อนไขสำคัญ:
  1. ในรอบนี้คุณต้องตอบว่า: "เยี่ยมเลยค่ะ! ช่วยบอก 'สไตล์' หรือ 'บุคลิก' ของสัตว์เลี้ยงที่คุณต้องการหน่อยนะคะ (เช่น ซน, ขี้อ้อน, เท่, ชื่ออาหาร, ชื่อญี่ปุ่น)" เท่านั้น
  2. ห้ามเพิ่งเสนอชื่อจนกว่าฉันจะบอกรายละเอียด
  3. เมื่อถึงขั้นตอนเสนอชื่อในอนาคต ให้ใช้รูปแบบ 'ลำดับ. ชื่อไทย ชื่ออังกฤษ [สไตล์] : ความหมาย' เสมอ`;
      } else {
        messageToAI = `${textToSend} \n(หมายเหตุ: ตอบคำถามตามปกติ หากไม่มีการเสนอชื่อสัตว์เลี้ยง ไม่ต้องใช้รูปแบบลำดับข้อที่มีความหมาย)`;
      }

      let imageBase64 = "";
      if (currentFile) {
        imageBase64 = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = () => res((reader.result as string).split(",")[1]);
          reader.readAsDataURL(currentFile);
        });
      }

      const res = await fetch(`${API_URL}/api/chatbot/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: messageToAI,
          history,
          imageBase64,
          imageType: currentFile?.type,
        }),
      });

      // ✅ ในส่วนสุดท้ายของ handleSend แก้เหลือแค่นี้พอ:
      const data = await res.json();
      const aiText = data?.text || "";

      // แงะชื่อออกมาเลย
      const suggestions = parseAIResponse(aiText, textToSend);
      const hasNames = suggestions.length > 0;

      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: aiText,
          // ✅ แค่แงะเจอชื่อ (hasNames) ก็โชว์การ์ดเลย ไม่ต้องไปดักคำถามซ้อนให้งงสัส!
          suggestions: hasNames ? suggestions : undefined,
        },
      ]);

      setHistory((prev) => [
        ...prev,
        { role: "user", parts: [{ text: textToSend }] },
        { role: "model", parts: [{ text: data.text || "" }] },
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        let name =
          user.user_metadata?.username || user.user_metadata?.user_name;
        if (!name) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
          if (profile) name = profile.username;
        }
        setUsername(name || "Member");
      }
    };
    fetchUser();
    const saved = localStorage.getItem("pet_favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting("Good Morning");
    else if (hour >= 12 && hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
  }, [messages, loading]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setImageFile(url);
    }
  };

  const parseSuggestions = (text: string): PetNameSuggestion[] => {
    const lines = text.split("\n");
    const suggestions: PetNameSuggestion[] = []; // ใช้ Type แทน any

    // Regex เดิมที่กูเขียนให้ (แงะข้อมูลตาม Format)
    const regex = /(\d+)\.\s*([^\s]+)\s+([^\s]+)\s+\[([^\]]+)\]\s*:\s*(.+)/;

    lines.forEach((line) => {
      const match = line.match(regex);
      if (match) {
        // TypeScript จะช่วยเช็คให้มึงด้วยว่าสะกด key ถูกไหม
        suggestions.push({
          nameTh: match[2],
          nameEn: match[3],
          style: match[4],
          meaning: match[5],
        });
      }
    });

    return suggestions;
  };

  return (
    <div
      className={`${lexend.className} min-h-screen bg-[#F8FAFC] flex flex-col items-center py-10 px-0 font-sans mt-16`}
    >
      <div className="w-full max-w-5xl mx-auto px-4 md:px-0">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-[#4A628A] mb-2">
            {greeting}, {username}
          </h2>
          <p className="text-[#4A628A]  text-3xl font-bold mt-2">
            What s on{" "}
            <span className="text-[#FA9529] font-bold text-3xl">
              your mind?
            </span>
          </p>
        </div>
        <div className="relative w-full h-[400px] md:h-[740px] mb-10 -mt-20">
          <div className="absolute left-1/2 -translate-x-1/2 w-[98vw] h-full overflow-hidden">
            <Image
              src="/aich2.png"
              alt="Banner"
              fill
              priority
              className="object-cover object-center scale-100"
            />
          </div>
        </div>
      </div>

      <div className="w-[480vh] max-w-7xl h-[140vh] bg-white shadow-2xl rounded-[1rem] overflow-hidden flex flex-col border border-slate-50 relative mt-[-90px] z-10">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-10 space-y-10 bg-[#F8FAFC]/50 no-scrollbar"
        >
          <div className="text-center pb-2">
            <h3 className="text-3xl font-black text-[#4A628A]">AI Chatbot</h3>
            <p className="text-[#4A628A] text-sm font-medium opacity-80 mt-2">
              คุยกับ AI เพื่อขอคำแนะนำเกี่ยวกับสัตว์เลี้ยง
            </p>
            <div className="w-screen ml-[calc(50%-50vw)] border-b border-slate-200 mt-4"></div>
          </div>

          <div className="px-6 py-6 space-y-10">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-64 text-slate-400">
                Start a conversation now, or select a quick command below
              </div>
            )}

            {messages.map((msg, idx) => {
              // 🔍 เช็คว่าข้อความนี้เป็นการแนะนำชื่อหรือไม่
              const hasSuggestions =
                msg.suggestions && msg.suggestions.length > 0;
              const isModel = msg.role === "model";

              return (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`flex items-end gap-3 max-w-[90%] ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* --- 1. Avatar Section --- */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                        isModel ? "bg-[#00A9FF]" : "bg-white"
                      }`}
                    >
                      {isModel ? (
                        <Bot size={24} className="text-white" />
                      ) : (
                        <img
                          src={profile?.avatar_url || "/avatardefault.png"}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                      )}
                    </div>

                    {/* --- 2. Content Section --- */}
                    <div className="relative flex flex-col gap-3">
                      {/* 🟢 กรณีที่ 1: ข้อความฝั่ง User หรือ ข้อความ Model ที่ "ไม่ใช่" การแนะนำชื่อ (โชว์ Bubble ปกติ) */}
                      {(msg.role === "user" || !hasSuggestions) && (
                        <div
                          className={`p-4 rounded-3xl text-[15px] shadow-sm ${
                            msg.role === "user"
                              ? "bg-white text-slate-600 border border-slate-100 rounded-br-none"
                              : "bg-[#00A9FF] text-white rounded-bl-none"
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              className="rounded-2xl mb-3 max-w-xs border-2 border-white"
                            />
                          )}
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                      )}

                      {/* 🟠 กรณีที่ 2: ข้อความฝั่ง Model ที่ "มี" suggestions (โชว์ Name Cards) */}
                      {isModel &&
                        msg.suggestions &&
                        msg.suggestions.length > 0 && (
                          <div className="flex flex-col gap-4">
                            <p className="text-[14px] font-black text-[#4A628A] ml-2 animate-pulse">
                              ✨ ฉันคัดชื่อสุดพิเศษมาให้แล้ว:
                            </p>

                            <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 px-2 -mx-2">
                              {/* ใช้วิธีเช็คก่อนว่ามี suggestions ถึงจะทำการ map */}
                              {msg.suggestions.map(
                                (s: IPetNameSuggestion, i: number) => (
                                  <div key={i} className="shrink-0">
                                    <NameCard
                                      nameTh={s.nameTh}
                                      nameEn={s.nameEn}
                                      meaning={s.meaning}
                                      tag={s.tag}
                                      isAlreadyLiked={likedNames.has(s.nameTh)}
                                      onLike={() => toggleFavorite(s)}
                                    />
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-[#00A9FF] rounded-full animate-bounce"></span>
                <span className="text-xs font-bold text-[#00A9FF] italic tracking-widest uppercase">
                  AI IS THINKING...
                </span>
              </div>
            )}
          </div>
        </div>

        <div
          className={`p-8 bg-white border-t border-slate-50 ${lexend.className}`}
        >
          <div className="bg-[#F3F4F6] rounded-[1rem] p-4 mb-5 shadow-inner">
            <div className="flex items-center gap-2 mb-10">
              <span className="text-orange-400 text-xl">✨</span>
              <input
                className="w-full bg-transparent outline-none text-[#425B80]"
                placeholder="Ask AI a question..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
            </div>
            {imageFile && (
              <div className="relative inline-block m-2">
                <img
                  src={imageFile}
                  className="w-24 h-24 object-cover rounded-2xl border-2 border-orange-100"
                />
                <button
                  onClick={() => setImageFile(null)}
                  className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 px-6 py-3 bg-white text-orange-500 rounded-2xl border-2 border-orange-400 cursor-pointer font-black shadow-sm active:scale-95 transition-all">
                  <ImageIcon size={20} /> เพิ่มรูปภาพ
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-orange-400 text-orange-400 bg-white"
                >
                  <Smile size={28} />
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-50 left-10 z-50 shadow-2xl">
                    <EmojiPicker
                      onEmojiClick={(e) =>
                        setInputText((prev) => prev + e.emoji)
                      }
                      width={300}
                      height={400}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-10 overflow-x-auto no-scrollbar">
            {[
              { label: "สวัสดี!", icon: "👋", isNaming: false },
              { label: "ขอชื่อแนะนำ 3 ชื่อ", icon: "⭐", isNaming: true },
              { label: "ตั้งชื่อตามสไตล์", icon: "🎨", isNaming: true },
            ].map((item, i) => (
              <button
                key={i}
                // ส่งค่า isNaming เพิ่มเข้าไปใน handleSend
                onClick={() => handleSend(item.label, item.isNaming)}
                className="min-w-[378px] h-[100px] bg-[#F1F5F9] p-6 rounded-[1rem] flex flex-col justify-between items-start hover:bg-gray-200 border border-transparent hover:border-slate-100 transition-all"
              >
                <span className="text-sm font-bold text-[#4A628A]">
                  {item.label}
                </span>
                <span className="text-2xl">{item.icon}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
