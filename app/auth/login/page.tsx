import AuthForm from '@/components/AuthFrom';

// ✅ ประกาศ Config ใน Server Component (ตรงนี้ Next.js จะเชื่อฟังแน่นอน)
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function LoginPage() {
  return (
    <AuthForm />
  );
}