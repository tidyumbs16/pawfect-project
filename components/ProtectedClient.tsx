"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    async function check() {
      const res = await fetch("/api/auth/session", {
        credentials: "include", // สำคัญมาก!
      });

      const json = await res.json();

      if (!json.ok) {
        router.push("/auth/login");
      }
    }

    check();
  }, [router]);

  return <>{children}</>;
}
