import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";

const cookieName = process.env.AUTH_COOKIE_NAME || "picskrypt_session";

function isValidSession(token: string | undefined): boolean {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) {
    console.error("proxy: AUTH_JWT_SECRET is not set");
    return false;
  }
  if (!token) return false;

  try {
    jwt.verify(token, secret, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false; 
  }
}

export function proxy(req: NextRequest) {
  const token = req.cookies.get(cookieName)?.value;

  if (!isValidSession(token)) {
    const res = NextResponse.redirect(new URL("/auth", req.url));
    if (token) res.cookies.delete(cookieName); 
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/pictures/create", "/profile/:path*", "/onboarding/:path*"],
};