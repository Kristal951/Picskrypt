"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bookmark,
    Download,
    Heart,
    Link2,
    MapPin,
    Share2,
    Trash2,
} from "lucide-react";
import { usePhotoActions } from "@/hooks/usePhotoActions";
import { formatCount } from "@/lib/photo-utils";
import { isPlaceholderUsername } from "@/lib/username";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import Avatar from "./Avatar";
import { Picture } from "@/types/Photo";

const WIDTHS = [640, 960, 1280, 1600, 2000];

export default function PhotoDetail({ initial }: { initial: Picture }) {
    const router = useRouter();
    const [photo, setPhoto] = useState(initial);

    const actions = usePhotoActions(photo, {
        onPatch: (patch) => setPhoto((p) => ({ ...p, ...patch })),
        onDeleted: () => router.replace("/"),
    });

    const liked = !!photo.likedByMe;
    const saved = !!photo.savedByMe;
    const likeCount = photo.likeCount ?? 0;

    const isCloudinary =
        photo.imageUrl.includes("res.cloudinary.com") &&
        photo.imageUrl.includes("/upload/");
    const widths = WIDTHS.filter((w) => w <= photo.width);
    const usable = widths.length ? widths : [Math.round(photo.width)];

    const src = isCloudinary
        ? cloudinaryLoader({ src: photo.imageUrl, width: Math.min(1280, usable[usable.length - 1]) })
        : photo.imageUrl;
    const srcSet = isCloudinary
        ? usable
            .map((w) => `${cloudinaryLoader({ src: photo.imageUrl, width: w })} ${w}w`)
            .join(", ")
        : undefined;

    const u = photo.user;
    const handle =
        u?.username && !isPlaceholderUsername(u.username) ? `@${u.username}` : null;

    const posted = new Date(photo.createdAt).toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });

    const btn =
        "inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors " +
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20";
    const idle = "border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

    return (
        <main className="mx-auto w-full max-w-4xl px-4 py-6 md:py-10">
            <Link
                href="/"
                className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to gallery
            </Link>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                <img
                    src={src}
                    srcSet={srcSet}
                    sizes="(max-width: 1024px) 100vw, 896px"
                    alt={photo.title}
                    width={photo.width}
                    height={photo.height}
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="block h-auto w-full"
                    style={{
                        aspectRatio: `${photo.width} / ${photo.height}`,
                        ...(photo.blurDataURL
                            ? {
                                backgroundImage: `url(${photo.blurDataURL})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }
                            : {}),
                    }}
                />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={() => void actions.toggleLike()}
                    aria-pressed={liked}
                    className={`${btn} ${liked ? "border-red-500 bg-red-500 text-white hover:bg-red-600" : idle
                        }`}
                >
                    <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
                    {likeCount > 0 ? formatCount(likeCount) : "Like"}
                </button>

                <button
                    type="button"
                    onClick={() => void actions.toggleSave()}
                    aria-pressed={saved}
                    className={`${btn} ${saved ? "border-indigo-600 bg-indigo-600 text-white hover:bg-indigo-700" : idle
                        }`}
                >
                    <Bookmark className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
                    {saved ? "Saved" : "Save"}
                </button>

                <button type="button" onClick={() => void actions.share()} className={`${btn} ${idle}`}>
                    <Share2 className="w-4 h-4" />
                    Share
                </button>

                <button type="button" onClick={() => void actions.copyLink()} className={`${btn} ${idle}`}>
                    <Link2 className="w-4 h-4" />
                    Copy link
                </button>

                <button type="button" onClick={actions.download} className={`${btn} ${idle}`}>
                    <Download className="w-4 h-4" />
                    Download
                </button>

                {actions.isOwner ? (
                    <button
                        type="button"
                        onClick={() => void actions.remove()}
                        className={`${btn} border-red-200 bg-white text-red-600 hover:bg-red-50 md:ml-auto`}
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                ) : null}
            </div>

            <div className="mt-8">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                    {photo.title}
                </h1>

                <div className="mt-4 flex items-center gap-3">
                    <Avatar
                        src={u?.avatar}
                        name={u?.name}
                        username={u?.username}
                        seed={u?.id}
                        size={40}
                    />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                            {u?.name || handle || "Unknown photographer"}
                        </p>
                        {u?.name && handle ? (
                            <p className="truncate text-xs text-slate-500">{handle}</p>
                        ) : null}
                    </div>
                </div>

                {photo.story ? (
                    <p className="mt-6 whitespace-pre-line text-base leading-7 text-slate-700">
                        {photo.story}
                    </p>
                ) : null}

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    {photo.location ? (
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-4 h-4" />
                            {photo.location}
                        </span>
                    ) : null}
                    <span>Posted {posted}</span>
                </div>

                {photo.tags.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {photo.tags.map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"
                            >
                                #{String(t).replace(/^#/, "")}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        </main>
    );
}