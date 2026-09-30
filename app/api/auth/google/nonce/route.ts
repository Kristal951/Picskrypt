import { NextResponse } from "next/server";
import crypto from "crypto";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const NONCE_COOKIE = "g_nonce";

export async function GET(req: Request) {
  if (!(await rateLimit("google-nonce", getClientIp(req), 30, 10 * 60))) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  const res = NextResponse.json({ nonce });

  res.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth/google", 
    maxAge: 60 * 10,
  });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
