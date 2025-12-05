'use client';


import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from "framer-motion";
import { supabaseClient } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const AuthForm = () => {
  const router = useRouter();
  const supabase = supabaseClient(); 

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.push('/');
    });
  }, [supabase, router]);

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // ✅ 1. ยิงไปที่ Bun Backend
        console.log("Jumping to:", `${API_URL}/api/auth/login`);
        const res = await fetch(`${API_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        setLoading(false);

        if (!data.ok) {
          alert(data.message || "Login failed");
          return;
        }

        // ✅ 2. สำคัญมาก: รับ Session จาก Backend มาฝังลง Browser
        // (เพื่อให้ Supabase ฝั่ง Client รู้ว่าเรา Login แล้ว)
        if (data.session) {
          const { error } = await supabase.auth.setSession(data.session);
          if (error) throw error;
        }

        router.push("/");
        return;
      }

      // --- REGISTER ---
      // ✅ 3. ยิงไปที่ Bun Backend
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, username: name }),
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
         alert("สมัครสมาชิกไม่สำเร็จ: " + (data.message || "Unknown error"));
         return;
      }

      alert("สมัครสำเร็จ! โปรดเข้าสู่ระบบ");
      setIsLogin(true);

    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Server");
    }
  };

  return (
    <div className="flex items-center justify-center mt-10 ">

      {/* FORM BOX */}
      <div className="w-full max-w-md 
        p-10 pt-8
        bg-gradient-to-b from-[#FFD361] to-[#FF8A00]
        rounded-3xl shadow-xl 
        min-h-[560px]
        flex flex-col justify-start">

        {/* HEAD */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-semibold text-white leading-tight">
            {isLogin ? 'Welcome Back!' : 'Yay, We Love Your Pets!'}
          </h1>
          <p className="mt-2 text-white/90 text-sm">
            Please give us basic information Thanks!
          </p>
        </div>

        {/* FORM */}
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Username animation */}
          <motion.div
            layout="position"
            transition={{ layout: { type: "spring", stiffness: 200, damping: 20 } }}
            className="relative min-h-[60px] "
          >
            <AnimatePresence>
              {!isLogin && (
                <motion.div
                  key="username-input"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ type: "spring", stiffness: 180, damping: 18 }}
                  className="relative"
                >
                  <input
                    type="text"
                    placeholder="Username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full py-3.5 pl-5 pr-12 bg-[#FFC88D] 
                      rounded-full text-white placeholder-white/70 "
                    required
                  />

                  {/* USER ICON */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                    viewBox="0 0 24 24" fill="#ffffff"
                    className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <path d="M12 2a5 5 0 1 1 -5 5a5 5 0 0 1 5 -5z" />
                    <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Email */}
          <motion.div
            layout="position"
            transition={{ layout: { type: "spring", stiffness: 200, damping: 20 } }}
            className="relative"
          >
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3.5 pl-5 pr-12 bg-[#FFC88D]
              rounded-full text-white placeholder-white/70 rounded-"
              required
            />

            {/* EMAIL ICON */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="#ffffff"
              className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
              <path d="M22 7.5v9.5a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-9.5l10 6l10 -6z" />
              <path d="M19 4a3 3 0 0 1 3 3l-10 6l-10 -6a3 3 0 0 1 3 -3h14z" />
            </svg>
          </motion.div>

          {/* Password */}
          <motion.div
            layout="position"
            transition={{ layout: { type: "spring", stiffness: 200, damping: 20 } }}
            className="relative"
          >
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3.5 pl-5 pr-12 bg-[#FFC88D]
              rounded-full rou text-white placeholder-white/70"
              required
            />

            {/* LOCK ICON */}
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" className="icon icon-tabler icons-tabler-filled icon-tabler-lock w-5 h-5 text-white absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 2a5 5 0 0 1 5 5v3a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3v-3a5 5 0 0 1 5 -5m0 12a2 2 0 0 0 -1.995 1.85l-.005 .15a2 2 0 1 0 2 -2m0 -10a3 3 0 0 0 -3 3v3h6v-3a3 3 0 0 0 -3 -3" /></svg>
          </motion.div>

          {/* Submit */}
          <motion.button
            layout="position"
            transition={{ layout: { type: "spring", stiffness: 200, damping: 20 } }}
            type="submit"
            className="w-full py-3 text-orange-600 bg-white rounded-full shadow-md hover:bg-yellow-50 transition"
            disabled={loading}
          >
            {loading ? "Please wait..." : isLogin ? 'Login' : 'Register'}
          </motion.button>

          {/* TOGGLE */}
          <motion.div
            layout="position"
            transition={{ layout: { type: "spring", stiffness: 200, damping: 20 } }}
            className="text-center pt-2"
          >
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-white/90 hover:underline"
            >
              {isLogin ? "Don’t have an account? Register" : 'Already have an account? Login'}
            </button>
          </motion.div>

        </form>

      </div>

      {/* DOG IMAGE */}
      <div className=" ml-20">
        <Image
          src="/Dog_log.png"
          alt="Dog wearing a hat"
          width={420}
          height={520}
          className="object-contain "
        />
      </div>

    </div>
  );
};

export default AuthForm;