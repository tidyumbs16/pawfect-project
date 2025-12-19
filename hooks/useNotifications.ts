// hooks/useNotifications.ts
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Notification = {
// ... (Type Notification เหมือนเดิม)
 id: string;
 title: string;
 description: string | null;
 appointment_date: string;
 pets: {
 name: string;
 image: string | null;
 };
};

type NotificationGroups = {
// ... (Type NotificationGroups เหมือนเดิม)
 today: Notification[];
 upcoming: Notification[];
 past: Notification[];
};

export function useNotifications(userId: string | null) {
// ... (State Declarations เหมือนเดิม)
 const [notifications, setNotifications] = useState<NotificationGroups>({
 today: [],
 upcoming: [],
 past: [],
 });
 const [unreadCount, setUnreadCount] = useState(0);
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const isLoadingRef = useRef(false);
 const lastUserIdRef = useRef<string | null>(null);
// ... (loadNotifications เหมือนเดิม)
 const loadNotifications = useCallback(async () => {
    // ... (implementation of loadNotifications remains the same)
 if (!userId) return;

 if (isLoadingRef.current) {
 console.log("⚠️ Already loading, skipping...");
 return;
 }

 if (lastUserIdRef.current === userId && notifications.today.length > 0) {
 console.log("✅ Using cached data");
 return;
 }

 isLoadingRef.current = true;
 setIsLoading(true);
 setError(null);

 try {
const res = await fetch(`${API_URL}/notifications/grouped?user_id=${userId}`);
  if (!res.ok) {
 throw new Error(`HTTP ${res.status}`);
 }

 const data = await res.json();

 if (data.ok) {
 setNotifications(data.groups);
 setUnreadCount(data.unreadCount);
 lastUserIdRef.current = userId;
 console.log("✅ Notifications loaded");
 } else {
 throw new Error(data.error || "Failed to load notifications");
 }
 } catch (err) {
 const message = err instanceof Error ? err.message : "Unknown error";
 setError(message);
 console.error("❌ Failed to load notifications:", err);
 } finally {
 setIsLoading(false);
 isLoadingRef.current = false;
 }
 }, [userId, notifications.today.length]);
// ... (dismissNotification เหมือนเดิม)
 const dismissNotification = useCallback(async (appointmentId: string) => {
    // ... (implementation of dismissNotification remains the same)
 if (!userId) return;

 try {
const res = await fetch(`${API_URL}/notifications/dismiss`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 user_id: userId,
 appointment_id: appointmentId,
 }),
});

 const data = await res.json();

if (data.ok) {
 setNotifications((prev) => ({
 today: prev.today.filter((n) => n.id !== appointmentId),
 upcoming: prev.upcoming.filter((n) => n.id !== appointmentId),
 past: prev.past.filter((n) => n.id !== appointmentId),
 }));

setUnreadCount((prev) => Math.max(0, prev - 1));
 console.log("✅ Notification dismissed");
 } else {
 throw new Error(data.error);
 }
 } catch (error) {
 console.error("❌ Error dismissing notification:", error);
 await loadNotifications();
 }
 }, [userId, loadNotifications]);
// ... (refresh เหมือนเดิม)
 const refresh = useCallback(() => {
 lastUserIdRef.current = null;
 loadNotifications();
 }, [loadNotifications]);

 // 🚀 โค้ดที่ถูกแก้ไข: ทำให้ resetUnreadCount เป็น async และเรียก API
 const resetUnreadCount = useCallback(async () => {
    if (!userId) return;
    
    // 1. อัปเดต Client State ทันทีเพื่อให้จุดแดงหายไป (Visual Feedback)
    setUnreadCount(0);
    
    try {
        // 2. เรียก API เพื่อบอก Backend ว่าผู้ใช้ได้อ่านแจ้งเตือนทั้งหมดแล้ว
        const res = await fetch(`${API_URL}/notifications/mark-all-read`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Unknown API error" }));
            console.error("❌ Failed to mark notifications as read:", errorData);
        } else {
            console.log("✅ All notifications marked as read on server.");
        }
        
        // 🚀 ขั้นตอนสำคัญ: บังคับโหลดข้อมูลใหม่ (loadNotifications)
        // ต้องรีเซ็ต lastUserIdRef ก่อนเพื่อให้ loadNotifications ไม่ใช้ cache และดึง unreadCount = 0 ที่ Server คำนวณมาใหม่
        lastUserIdRef.current = null; 
        await loadNotifications();

    } catch (error) {
        console.error("❌ API error while resetting unread count:", error);
        // หากเกิดข้อผิดพลาด ให้ลองโหลดข้อมูลใหม่เพื่อซิงค์
        await loadNotifications(); 
    }
}, [userId, loadNotifications]);


 useEffect(() => {
  if (userId) {
 loadNotifications();
  }
 }, [userId, loadNotifications]);

 return {
 notifications,
 unreadCount,
 isLoading,
 error,
 dismissNotification,
 refresh,
 resetUnreadCount,
 };
}