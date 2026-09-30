import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendMagicLinkToEmail } from "@/lib/magicLink";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_MS = 60_000;
const UNUSED = { OR: [{ usedAt: null }, { usedAt: { isSet: false } }] };

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = body?.email;

    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail.length > 254 || !EMAIL_RE.test(normalizedEmail)) {
      return NextResponse.json(
        { message: "Please enter a valid email." },
        { status: 400 },
      );
    }

    const [ipOk, emailOk] = await Promise.all([
      rateLimit("magic-ip", getClientIp(req), 10, 10 * 60),
      rateLimit("magic-email", normalizedEmail, 5, 60 * 60),
    ]);
    if (!ipOk || !emailOk) {
      return NextResponse.json(
        { message: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const rawTtl = Number(process.env.MAGIC_LINK_TTL_MIN);
    const ttlMin = Number.isFinite(rawTtl) && rawTtl > 0 ? rawTtl : 15;
    const ttlMs = ttlMin * 60_000;

    const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/+$/, "");
    if (!baseUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not set");
      return NextResponse.json(
        { message: "Server is not configured correctly." },
        { status: 500 },
      );
    }

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        username: `user_${crypto.randomBytes(4).toString("hex")}`,
        onboarded: false,
        onboardingStep: 1,
      },
    });

    const recent = await prisma.magicLinkToken.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date(Date.now() + ttlMs - RESEND_COOLDOWN_MS) },
        ...UNUSED,
      },
      select: { id: true },
    });
    if (recent) {
      return NextResponse.json(
        { message: "Please wait a minute before requesting another link." },
        { status: 429 },
      );
    }

    await prisma.magicLinkToken.deleteMany({
      where: { userId: user.id, ...UNUSED },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(rawToken, 10);

    const tokenRow = await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });

    const magicLink = `${baseUrl}/auth/magic?id=${tokenRow.id}&token=${rawToken}`;

    try {
      await sendMagicLinkToEmail({
        to_email: normalizedEmail,
        magic_link: magicLink,
        expires_in_minutes: ttlMin,
      });
    } catch (err) {
      console.error("Magic link email failed:", err);
      await prisma.magicLinkToken
        .delete({ where: { id: tokenRow.id } })
        .catch(() => {});
      return NextResponse.json(
        { message: "We couldn't send the email. Please try again shortly." },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Magic link request failed:", err);
    return NextResponse.json(
      { message: "Failed to send magic link" },
      { status: 500 },
    );
  }
}
