import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  COOKIE_NAME,
  assertSessionConfig,
  sessionCookieOptions,
  signSessionToken,
} from "@/lib/session";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { toSelfDto } from "@/lib/user-dto";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const invalid = () =>
  NextResponse.json({ message: "Link invalid or expired" }, { status: 401 });

export async function POST(req: Request) {
  try {
    if (!(await rateLimit("magic-verify", getClientIp(req), 20, 10 * 60))) {
      return NextResponse.json(
        { message: "Too many attempts. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => null);
    const id = body?.id;
    const token = body?.token;

    if (typeof token !== "string" || !token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 },
      );
    }
    if (typeof id !== "string" || !OBJECT_ID.test(id)) {
      return NextResponse.json({ message: "Invalid link" }, { status: 400 });
    }

    assertSessionConfig();

    const record = await prisma.magicLinkToken.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return invalid();
    }

    const ok = await bcrypt.compare(token, record.tokenHash);
    if (!ok) return invalid();

    const now = new Date();
    const claimed = await prisma.magicLinkToken.updateMany({
      where: {
        id: record.id,
        expiresAt: { gt: now },
        OR: [{ usedAt: null }, { usedAt: { isSet: false } }],
      },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return invalid();

    const res = NextResponse.json({
      ok: true,
      user: toSelfDto(record.user),
    });

    res.cookies.set(
      COOKIE_NAME,
      signSessionToken(record.user.id),
      sessionCookieOptions,
    );

    return res;
  } catch (err) {
    console.error("Magic link verify failed:", err);
    return NextResponse.json(
      { message: "Verification failed" },
      { status: 500 },
    );
  }
}
