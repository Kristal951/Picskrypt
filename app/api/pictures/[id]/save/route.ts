import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";

const OBJECT_ID = /^[a-f\d]{24}$/i;

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Log in to save photos." },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: "Invalid photo." }, { status: 400 });
  }

  if (!(await rateLimit("save", session.userId, 60, 60))) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.saved !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const saved: boolean = body.saved;

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  try {
    if (saved) {
      await prisma.save.create({
        data: { userId: session.userId, photoId: id },
      });
    } else {
      await prisma.save.deleteMany({
        where: { userId: session.userId, photoId: id },
      });
    }
  } catch (err) {
    const duplicate =
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002";
    if (!duplicate) {
      console.error("PUT /api/pictures/[id]/save failed:", err);
      return NextResponse.json(
        { error: "Couldn't update save." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ saved });
}
