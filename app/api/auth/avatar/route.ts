import { NextRequest, NextResponse } from "next/server";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/rate-limit";
import { SELF_SELECT, toSelfDto } from "@/lib/user-dto";

const MAX_BYTES = 5 * 1024 * 1024; 
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await rateLimit("avatar-upload", session.userId, 10, 10 * 60))) {
      return NextResponse.json(
        { error: "Too many uploads. Please try again later." },
        { status: 429 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type" },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 413 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "picskrypt/avatars",
              public_id: session.userId,
              overwrite: true,
              invalidate: true,
              resource_type: "image",
              transformation: [
                {
                  width: 512,
                  height: 512,
                  crop: "fill",
                  gravity: "auto",
                  quality: "auto:good",
                },
              ],
            },
            (error, result) => {
              if (error || !result) reject(error);
              else resolve(result);
            },
          )
          .end(buffer);
      },
    );

    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { avatar: uploadRes.secure_url },
      select: SELF_SELECT,
    });

    return NextResponse.json({ user: toSelfDto(user) });
  } catch (error) {
    console.error("POST /api/auth/avatar failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
