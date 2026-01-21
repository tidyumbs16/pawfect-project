import { NextResponse, type NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // ดึง cookie ที่เป็น auth token แบบ dynamic
  const token = Array.from(req.cookies.getAll())
    .find((c) => c.name.includes("-auth-token"))
    ?.value;

  const protectedRoutes = ["/profile", "/favorites", "/aichat","/app/diary","/app/iddiarie/[id]"];

  const path = req.nextUrl.pathname;
  const isProtected = protectedRoutes.some((r) => path.startsWith(r));

  if (isProtected && !token) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/profile/:path*", "/favorites/:path*", "/aichat/:path*","/diary/:path*","/iddiarie/[id]:path*"],
};
