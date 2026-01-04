import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      fontFamily: {
        // สั่งให้ font-sans เรียกใช้ Lexend เป็นอันดับแรก
        sans: ["var(--font-lexend)", "var(--font-geist-sans)", "sans-serif"],
      },
    },
  },
  // ... ส่วนอื่นๆ คงไว้เหมือนเดิม
};
export default config;