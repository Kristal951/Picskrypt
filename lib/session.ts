import "server-only";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export const COOKIE_NAME = process.env.AUTH_COOKIE_NAME || "picskrypt_session";
const MAX_AGE = 60 * 60 * 24 * 30;

function secret(): string {
  const s = process.env.AUTH_JWT_SECRET;
  if (!s || s.length < 32) {
    throw new Error("AUTH_JWT_SECRET missing or shorter than 32 characters");
  }
  return s;
}

export function assertSessionConfig() {
  secret();
}

export function signSessionToken(userId: string): string {
  return jwt.sign({}, secret(), {
    subject: userId,
    expiresIn: MAX_AGE,
    algorithm: "HS256",
  });
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: MAX_AGE,
};

export async function getSession(): Promise<{ userId: string } | null> {
  const key = secret(); 
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, key, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.sub) return null;
    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function destroySession() {
  (await cookies()).delete(COOKIE_NAME);
}