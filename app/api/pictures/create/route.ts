import { NextRequest, NextResponse } from "next/server";
import type { UploadApiResponse } from "cloudinary";
import cloudinary from "@/lib/cloudinary";
import prisma from "@/lib/prisma";
import { getBlurDataURL } from "@/lib/blur";
import { getSession } from "@/lib/session";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const story = formData.get("story") as string;
    const tagsRaw = formData.get("tags") as string | null;
    const location = formData.get("location") as string;

    if (!file) {
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

    const me = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { onboarded: true },
    });
    if (me?.onboarded !== true) {
      return NextResponse.json(
        { error: "Finish setting up your profile first." },
        { status: 403 },
      );
    }

    let tags: string[] = [];
    try {
      tags = tagsRaw ? JSON.parse(tagsRaw) : [];
      if (!Array.isArray(tags)) tags = [];
    } catch {
      return NextResponse.json({ error: "Invalid tags" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: "picskrypt",
              resource_type: "image",
              transformation: [
                {
                  width: 2560,
                  height: 2560,
                  crop: "limit",
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

    const blurDataURL = await getBlurDataURL(uploadRes.secure_url);

    const picture = await prisma.photo.create({
      data: {
        imageUrl: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        title,
        story,
        tags,
        location,
        userId,
        height: uploadRes.height,
        width: uploadRes.width,
        blurDataURL,
      },
    });

    return NextResponse.json({ success: true, picture });
  } catch (error: any) {
    console.error("POST upload failed:", error);
    const msg = error?.message?.includes("File size too large")
      ? "File exceeds your Cloudinary plan's upload limit"
      : "Upload failed";
    return NextResponse.json(
      { error: msg },
      { status: error?.http_code ?? 500 },
    );
  }
}
