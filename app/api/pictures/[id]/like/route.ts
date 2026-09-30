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
      { error: "Log in to like photos." },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!OBJECT_ID.test(id)) {
    return NextResponse.json({ error: "Invalid photo." }, { status: 400 });
  }

  if (!(await rateLimit("like", session.userId, 60, 60))) {
    return NextResponse.json({ error: "Slow down a little." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.liked !== "boolean") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const liked: boolean = body.liked;

  const photo = await prisma.photo.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!photo) {
    return NextResponse.json({ error: "Photo not found." }, { status: 404 });
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        if (liked) {
          await tx.like.create({
            data: { userId: session.userId, photoId: id },
          });
          await tx.photo.update({
            where: { id },
            data: { likeCount: { increment: 1 } },
          });
        } else {
          const removed = await tx.like.deleteMany({
            where: { userId: session.userId, photoId: id },
          });
          if (removed.count > 0) {
            await tx.photo.update({
              where: { id },
              data: { likeCount: { decrement: 1 } },
            });
          }
        }
      },
      { maxWait: 10_000, timeout: 15_000 },
    );
  } catch (err) {
    const duplicate =
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002";
    if (!duplicate) {
      console.error("PUT /api/pictures/[id]/like failed:", err);
      return NextResponse.json(
        { error: "Couldn't update like." },
        { status: 500 },
      );
    }
  }

  const fresh = await prisma.photo.findUnique({
    where: { id },
    select: { likeCount: true },
  });

  return NextResponse.json({
    liked,
    likeCount: Math.max(0, fresh?.likeCount ?? 0),
  });
}
