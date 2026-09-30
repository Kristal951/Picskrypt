import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const PAGE_SIZE = 24;
const OBJECT_ID = /^[a-f\d]{24}$/i;

export async function GET(req: NextRequest) {
  const cursor = new URL(req.url).searchParams.get("cursor");
  if (cursor && !OBJECT_ID.test(cursor)) {
    return NextResponse.json({ error: "Invalid cursor" }, { status: 400 });
  }

  try {
    const rows = await prisma.photo.findMany({
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    const hasMore = rows.length > PAGE_SIZE;
    const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;

    const userIds = [...new Set(page.map((p) => p.userId))];
    const users = userIds.length
      ? await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true, username: true, avatar: true },
        })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));

    const items = page.map((p) => ({ ...p, user: byId.get(p.userId) ?? null }));

    return NextResponse.json({
      items,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    });
  } catch (error) {
    console.error("GET /api/pictures failed:", error);
    return NextResponse.json(
      { error: "Failed to load pictures" },
      { status: 500 },
    );
  }
}