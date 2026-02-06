"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/lib/supabase-client";
import { useRouter } from "next/navigation";
import { Lexend } from "next/font/google";

const lexend = Lexend({ 
  weight: '400', 
  subsets: ['latin'],
  display: 'swap',
});




const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const AuthForm = () => {
  const router = useRouter();

  // เพิ่มสถานะ 'reset-password'
  const [view, setView] = useState<string>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // State สำหรับหน้า Reset Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // OTP State
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(""));
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timer, setTimer] = useState(60);

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // เช็ค Session (ถ้ามี Session อยู่แล้ว และไม่ได้กำลัง Reset Password ให้เด้งไปหน้าแรก)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session && view !== "reset-password") {
        // router.push('/'); // คอมเม้นไว้ก่อน เผื่อเทส
      }
    });
  }, [router, view]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (view === "verify" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [view, timer]);

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 5 && otpInputRefs.current[index + 1]) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0 &&
      otpInputRefs.current[index - 1]
    ) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendCode = async () => {
    setTimer(60);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) alert("ส่งไม่ผ่าน: " + error.message);
  };

  const switchView = (newView: string) => {
    setView(newView);
    if (newView === "login") {
      setEmail("");
      setPassword("");
      setName("");
    }
    setShowPassword(false);
    if (newView === "verify") {
      setTimer(59);
      setOtp(new Array(6).fill(""));
    }
    if (newView === "reset-password") {
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. FORGOT -> ส่ง OTP
      if (view === "forgot") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });
        setLoading(false);
        if (error) {
          alert("Error: " + error.message);
        } else {
          switchView("verify");
        }
        return;
      }

      // 2. VERIFY OTP -> ตรวจสอบเลข
      if (view === "verify") {
        const token = otp.join("");
        if (token.length !== 6) {
          alert("Please enter a complete 6-digit code.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: "email",
        });

        setLoading(false);

        if (error) {
          alert("Verification failed: " + error.message);
        } else {
          // ✅ สำเร็จ! OTP ถูกต้อง -> ไปหน้าตั้งรหัสใหม่
          switchView("reset-password");
        }
        return;
      }

      // 3. RESET PASSWORD -> ตั้งรหัสใหม่ 
      if (view === "reset-password") {
        if (newPassword !== confirmPassword) {
          alert("Passwords do not match!");
          setLoading(false);
          return;
        }

        // ใช้ updateUser เพราะตอน verifyOtp ผ่าน user จะอยู่ในสถานะ logged in แล้ว
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        setLoading(false);

        if (error) {
          alert("Failed to reset password: " + error.message);
        } else {
          await supabase.auth.signOut();
          switchView("login");
        }
        return;
      }

      // 4. LOGIN
      if (view === "login") {
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
        if (data.session) {
          const { error } = await supabase.auth.setSession(data.session);
          if (error) throw error;
        }
        if (rememberMe) localStorage.setItem("savedEmail", email);
      window.location.href = "/";
        return;
      }

      // 5. REGISTER
      if (view === "register") {
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
        switchView("login");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับ Server");
    }
  };

  // Helper Titles
  const getHeaderTitle = () => {
    if (view === "reset-password") return "Reset Password"; //
    if (view === "verify") return "Enter Verification Code";
    if (view === "forgot") return "Trouble Logging In?";
    if (view === "login") return "Welcome Back!";
    return "Yay, We Love Your Pets!";
  };

  const getSubTitle = () => {
    if (view === "reset-password")
      return "You're all set! Enter your desired new password and confirm it below."; //
    if (view === "verify")
      return "We've sent a 6-digit code to your email address. Please enter the code below to proceed.";
    if (view === "forgot")
      return "No worries! Enter your email and we'll send you a 6-digit code to verify your account.";
    return "Please give us basic information Thanks!";
  };

  return (
  <div className={`flex items-center justify-center mt-10 ${lexend.className}`}>
      <div className="w-full max-w-md p-10 pt-8 bg-gradient-to-b from-[#FFC23B] to-[#EE9106] rounded-[2rem] shadow-xl min-h-[560px] flex flex-col justify-start relative overflow-hidden transition-all duration-300">
        {/* HEAD */}
        <div className="text-center mb-6 z-10">
          <motion.h1
            key={view}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-sm text-white leading-tight"
          >
            {getHeaderTitle()}
          </motion.h1>
          <motion.p
            key={`${view}-sub`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 text-white/90 text-md px-2 leading-relaxed"
          >
            {getSubTitle()}
          </motion.p>
        </div>

        {/* FORM */}
        <form
          className="space-y-4 z-10 flex flex-col flex-1"
          onSubmit={handleSubmit}
        >
          {/* Username (Register Only) */}
          <AnimatePresence>
            {view === "register" && (
              <motion.div
                key="username-input"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="relative overflow-hidden"
              >
                <div className="absolute left-4 top-4 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                  >
                    <path d="M12 2a5 5 0 1 1 -5 5a5 5 0 0 1 5 -5z" />
                    <path d="M14 14a5 5 0 0 1 5 5v1a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-1a5 5 0 0 1 5 -5h4z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Username"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full py-3.5 pl-12 pr-5 bg-[#FFC88D] rounded-full text-white placeholder-white focus:outline-none "
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email: Show everywhere EXCEPT Reset Password (verified user) & Verify */}
         {view !== "verify" && view !== "reset-password" && (
  <motion.div layout className="relative">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none mt-3 ">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
       
        fill={view === "forgot" ? "#FA9529" : "#ffffff"}
      >
        <path d="M22 7.5v9.5a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-9.5l10 6l10 -6z" />
        <path d="M19 4a3 3 0 0 1 3 3l-10 6l-10 -6a3 3 0 0 1 3 -3h14z" />
      </svg>
    </div>
    <input
      type="email"
      placeholder={
        view === "forgot" ? "your.email@example" : "Email Address"
      }
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      className={`w-full py-3.5 pl-12 pr-5 rounded-full focus:outline-none transition-all mt-5 ${lexend.className} 
        ${view === "forgot" 
          ? "bg-white text-slate-600 placeholder-[#D3D3D3] border-none shadow-sm" // แต่งแค่หน้า Forgot ตามที่มึงสั่ง
          : "bg-[#FFC88D] text-white placeholder-white/80"                  // หน้า Login ใช้โค้ดเดิมเป๊ะ ไม่แตะ
        }`}
      required
    />
  </motion.div>
)}

          {/* RESET PASSWORD INPUTS (New Password & Confirm) */}
          {view === "reset-password" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {/* New Password */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                  >
                    <path d="M22 7.5v9.5a3 3 0 0 1 -3 3h-14a3 3 0 0 1 -3 -3v-9.5l10 6l10 -6z" />
                    <path d="M19 4a3 3 0 0 1 3 3l-10 6l-10 -6a3 3 0 0 1 3 -3h14z" />
                  </svg>
                  {/* Note: Icon ตามดีไซน์ */}
                </div>
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full py-3.5 pl-12 pr-5 bg-[#FFC88D] rounded-full text-white placeholder-white focus:outline-none"
                  required
                />
              </div>
              {/* Confirm Password */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="#ffffff"
                  >
                    <path d="M12 2a5 5 0 0 1 5 5v3a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3v-3a5 5 0 0 1 5 -5m0 12a2 2 0 0 0 -1.995 1.85l-.005 .15a2 2 0 1 0 2 -2m0 -10a3 3 0 0 0 -3 3v3h6v-3a3 3 0 0 0 -3 -3" />
                  </svg>
                </div>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-3.5 pl-12 pr-5 bg-[#FFC88D] rounded-full text-white placeholder-white focus:outline-none"
                  required
                />
              </div>
            </motion.div>
          )}

          {/* Password (Login & Register Only) */}
          <AnimatePresence>
            {(view === "login" || view === "register") && (
              <motion.div
                key="password-input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="relative overflow-hidden"
              >
                <div className="pt-4">
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-white -mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="#ffffff"
                      >
                        <path d="M12 2a5 5 0 0 1 5 5v3a3 3 0 0 1 3 3v6a3 3 0 0 1 -3 3h-10a3 3 0 0 1 -3 -3v-6a3 3 0 0 1 3 -3v-3a5 5 0 0 1 5 -5m0 12a2 2 0 0 0 -1.995 1.85l-.005 .15a2 2 0 1 0 2 -2m0 -10a3 3 0 0 0 -3 3v3h6v-3a3 3 0 0 0 -3 -3" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-3.5 pl-12 pr-12 bg-[#FFC88D] rounded-full text-white placeholder-white focus:outline-none -mt-2"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors focus:outline-none -mt-1"
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                          <line x1="2" x2="22" y1="2" y2="22" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="22"
                          height="22"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* OTP INPUTS (Verify Only) */}
         {view === "verify" && (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    /* ปรับ gap-4 ให้ห่างกันมากขึ้น และ mt-12 ให้ห่างจากข้อความด้านบน */
    className="flex justify-center gap-3 mb-8 mt-12"
  >
    {otp.map((digit, index) => (
      <input
        key={index}
        ref={(el) => {
          otpInputRefs.current[index] = el;
        }}
        type="text"
        maxLength={1}
        value={digit} // Logic เดิม
        onChange={(e) => handleOtpChange(index, e.target.value)} // Logic เดิม
        onKeyDown={(e) => handleOtpKeyDown(index, e)} // Logic เดิม
        /* ปรับความกว้าง/สูง และความโค้งมน (rounded-xl) พร้อมสี Text ให้เด่น */
        className={`w-14 h-14 rounded-md bg-white text-center text-2xl font-bold text-[#425B80] focus:outline-none  transition-all  ${lexend.className}`}
      />
    ))}
  </motion.div>
)}

          {/* Submit Button */}
          <motion.button
            layout
            type="submit"
            className={`w-full py-3 rounded-full shadow-md transition font-bold text-lg mt-2
              ${
                view === "forgot" ||
                view === "verify" ||
                view === "reset-password"
                  ? " text-white bg-[#F67F00]"
                  : "bg-white text-[#F16527] "
              }`}
            disabled={loading}
          >
            {loading
              ? "Please wait..."
              : view === "login"
                ? "Login"
                : view === "register"
                  ? "Register"
                  : view === "forgot"
                    ? "Send Verification Code"
                    : view === "verify"
                      ? "Verify"
                      : "Save New Password"}
          </motion.button>

          {/* Bottom Actions */}
          <AnimatePresence mode="wait">
            {/* VIEW: LOGIN */}
            {view === "login" && (
              <motion.div
                key="login-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-between items-center text-white text-sm px-2 pt-1"
              >
                <label className="flex items-center cursor-pointer  transition">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-white checked:bg-blue-600 checked:border-blue-600 transition-all"
                    />
                    <svg
                      className="absolute w-3 h-3 text-white hidden peer-checked:block pointer-events-none left-0.5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  </div>
                  <span className="ml-2 font-medium">Remember Me</span>
                </label>
                <button
                  type="button"
                  onClick={() => switchView("forgot")}
                  className="font-medium underline  transition focus:outline-none"
                >
                  Forgot Password?
                </button>
              </motion.div>
            )}

            {/* VIEW: FORGOT PASSWORD */}
            {view === "forgot" && (
              <motion.div
                key="forgot-actions"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-white text-[19px] pt-6"
              >
                <span>Wait, I remember now! Back to </span>
                <button
                  type="button"
                  onClick={() => switchView("login")}
                  className="font-bold underline hover:text-white/80"
                >
                 Login
                </button>
              </motion.div>
            )}

            {/* VIEW: VERIFY (OTP) */}
            {view === "verify" && (
  <motion.div
    key="verify-actions"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    /* ดันขึ้นไปใกล้ปุ่ม Verify นิดนึงด้วย pt-4 */
    className="text-center text-white text-sm pt-4"
  >
    {/* ปรับให้ขึ้นมาอยู่บรรทัดเดียวกันด้วย flex และ gap-1.5 */}
    <div className="flex items-center justify-center gap-1.5 text-[17px]"> 
      <p>Didn’t receive the code?</p>
      {timer > 0 ? (
        <span className="font-md none-underline">
          Resend Code <span className="none-underline ml-1">in 0:{timer < 10 ? `0${timer}` : timer}</span>
        </span>
      ) : (
        <button
          type="button"
          onClick={handleResendCode}
          className="font-md underline hover:text-white/80 transition-colors"
        >
          Resend Code
        </button>
      )}
    </div>
  </motion.div>
)}

{view === "register" && <motion.div className="h-4" />}
          </AnimatePresence>

          {/* TOGGLE: Login/Register */}
          {(view === "login" || view === "register") && (
            <motion.div layout className="text-center pt-10 ">
              <button
                type="button"
                onClick={() =>
                  switchView(view === "login" ? "register" : "login")
                }
                className="text-white  focus:outline-none text-[18px] "
              >
                <span className="opacity-90">
                  {view === "login"
                    ? "Don’t have an account? "
                    : "Already have an account? "}
                </span>
                <span className="font-bold underline">
                  {view === "login" ? "Register" : "Login"}
                </span>
              </button>
            </motion.div>
          )}
        </form>
      </div>
      <div className="ml-20 hidden lg:block">
        <Image
          src="/Dog_log.png"
          alt="Dog"
          width={420}
          height={520}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
};

export default AuthForm;
