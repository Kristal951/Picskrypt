import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { ogImageUrl } from "@/lib/photo-utils";
import PhotoDetail from "@/components/ui/PhotoDetail";
import { Picture } from "@/types/Photo";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const getPhoto = cache(async (id: string) => {
    if (!OBJECT_ID.test(id)) return null;
    return prisma.photo.findUnique({ where: { id } });
});

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const photo = await getPhoto(id);
    if (!photo) return { title: "Photo not found | Picskrypt" };

    const title = `${photo.title} | Picskrypt`;
    const description = photo.story?.trim().slice(0, 160) || "A photo on Picskrypt";
    const image = ogImageUrl(photo.imageUrl);

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "article",
            images: [{ url: image, width: 1200, height: 630, alt: photo.title }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    };
}

export default async function PicturePage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const photo = await getPhoto(id);
    if (!photo) notFound();

    const session = await getSession().catch(() => null);

    const [owner, like, save] = await Promise.all([
        prisma.user.findUnique({
            where: { id: photo.userId },
            select: { id: true, name: true, username: true, avatar: true },
        }),
        session
            ? prisma.like.findFirst({
                where: { userId: session.userId, photoId: id },
                select: { id: true },
            })
            : null,
        session
            ? prisma.save.findFirst({
                where: { userId: session.userId, photoId: id },
                select: { id: true },
            })
            : null,
    ]);

    const initial: Picture = {
        id: photo.id,
        imageUrl: photo.imageUrl,
        publicId: photo.publicId || "",
        title: photo.title,
        story: photo.story || "",
        location: photo.location || "",
        tags: photo.tags,
        userId: photo.userId,
        width: photo.width,
        height: photo.height,
        blurDataURL: photo.blurDataURL || "",
        createdAt: photo.createdAt.toISOString(),
        updatedAt: photo.updatedAt.toISOString(),
        likeCount: photo.likeCount ?? 0,
        likedByMe: !!like,
        savedByMe: !!save,
        user: owner,
    };

    return <PhotoDetail initial={initial} />;
}