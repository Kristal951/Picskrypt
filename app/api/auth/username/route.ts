import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { validateUsername } from "@/lib/username";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await rateLimit("username-check", session.userId, 30, 60))) {
    return NextResponse.json(
      { error: "Too many checks. Slow down a little." },
      { status: 429 },
    );
  }

  const raw = new URL(req.url).searchParams.get("u") ?? "";
  const { username, error } = validateUsername(raw);
  if (error) {
    return NextResponse.json({ available: false, reason: error });
  }

  const existing = await prisma.user.findFirst({
    where: { username },
    select: { id: true },
  });
  const available = !existing || existing.id === session.userId;

  return NextResponse.json({
    available,
    reason: available ? null : "That username is taken.",
  });
}
