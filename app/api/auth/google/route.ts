import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { OAuth2Client, type TokenPayload } from "google-auth-library";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  COOKIE_NAME,
  assertSessionConfig,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/session";
import { toSelfDto } from "@/lib/user-dto";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const oauth = new OAuth2Client();

const NONCE_COOKIE = "g_nonce";
const NONCE_PATH = "/api/auth/google";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

function isSameOriginJson(req: Request): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) return false;
  try {
    if (new URL(origin).host !== host) return false;
  } catch {
    return false;
  }
  return (req.headers.get("content-type") ?? "").includes("application/json");
}

const fail = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

export async function POST(req: Request) {
  try {
    if (!CLIENT_ID) {
      console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return fail("Google sign-in isn't configured.", 500);
    }
    if (!isSameOriginJson(req)) return fail("Forbidden", 403);

    if (!(await rateLimit("google-auth", getClientIp(req), 20, 10 * 60))) {
      return fail("Too many attempts. Please try again later.", 429);
    }

    assertSessionConfig();

    const body = await req.json().catch(() => null);
    const credential = body?.credential;
    if (
      typeof credential !== "string" ||
      credential.length < 20 ||
      credential.length > 4096
    ) {
      return fail("Invalid request.", 400);
    }

    let payload: TokenPayload | undefined;
    try {
      const ticket = await oauth.verifyIdToken({
        idToken: credential,
        audience: CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (err) {
      console.error("Google token verification failed:", err);
      return fail("Google sign-in failed. Please try again.", 401);
    }

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return fail("Your Google email address isn't verified.", 401);
    }

    const expectedNonce = (await cookies()).get(NONCE_COOKIE)?.value;
    if (
      !expectedNonce ||
      typeof payload.nonce !== "string" ||
      !safeEqual(payload.nonce, expectedNonce)
    ) {
      return fail("Sign-in expired. Please try again.", 401);
    }

    const sub = payload.sub;
    const email = payload.email.trim().toLowerCase();
    const googleName = (payload.name ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 50);
    const picture = payload.picture ?? null;

    let user = await prisma.user.findFirst({ where: { googleId: sub } });

    if (!user) {
      const byEmail = await prisma.user.findUnique({ where: { email } });

      if (byEmail) {
        if (byEmail.googleId && byEmail.googleId !== sub) {
          return fail(
            "This email is already linked to a different Google account.",
            409,
          );
        }
        user = await prisma.user.update({
          where: { id: byEmail.id },
          data: {
            googleId: sub,
            ...(!byEmail.name && googleName ? { name: googleName } : {}),
            ...(!byEmail.avatar && picture ? { avatar: picture } : {}),
          },
        });
      } else {
        try {
          user = await prisma.user.create({
            data: {
              email,
              googleId: sub,
              name: googleName || null,
              avatar: picture,
              username: `user_${crypto.randomBytes(4).toString("hex")}`,
              onboarded: false,
              onboardingStep: 1,
            },
          });
        } catch (err) {
          if (
            err instanceof Prisma.PrismaClientKnownRequestError &&
            err.code === "P2002"
          ) {
            user = await prisma.user.findUnique({ where: { email } });
          } else {
            throw err;
          }
        }
      }
    }

    if (!user) return fail("Sign-in failed. Please try again.", 500);

    const res = NextResponse.json({ ok: true, user: toSelfDto(user) });
    res.cookies.set(
      COOKIE_NAME,
      signSessionToken(user.id),
      sessionCookieOptions,
    );

    res.cookies.set(NONCE_COOKIE, "", { path: NONCE_PATH, maxAge: 0 });

    return res;
  } catch (err) {
    console.error("Google sign-in failed:", err);
    return fail("Sign-in failed. Please try again.", 500);
  }
}