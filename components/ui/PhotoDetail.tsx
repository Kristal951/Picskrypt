"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Bookmark,
    Calendar,
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

const focusRing =
    "focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25";

const pillBase =
    "inline-flex h-11 items-center justify-center gap-2 rounded-full border px-5 text-sm font-semibold " +
    "transition-colors duration-200 active:scale-[0.98] motion-reduce:transition-none " +
    focusRing;

const pillIdle =
    "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50";

const iconBtn =
    "inline-flex h-11 flex-1 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 " +
    "transition-colors duration-200 hover:border-stone-300 hover:bg-stone-50 hover:text-stone-900 " +
    "active:scale-95 motion-reduce:transition-none " +
    focusRing;

export default function PhotoDetail({
    initial,
    related,
}: {
    initial: Picture;
    related?: ReactNode;
}) {
    const router = useRouter();
    const [photo, setPhoto] = useState(initial);
    const [loaded, setLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        if (imgRef.current?.complete) setLoaded(true);
    }, []);

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
        ? cloudinaryLoader({
              src: photo.imageUrl,
              width: Math.min(1280, usable[usable.length - 1]),
          })
        : photo.imageUrl;

    const srcSet = isCloudinary
        ? usable
              .map(
                  (w) =>
                      `${cloudinaryLoader({
                          src: photo.imageUrl,
                          width: w,
                      })} ${w}w`
              )
              .join(", ")
        : undefined;

    const u = photo.user;

    const handle =
        u?.username && !isPlaceholderUsername(u.username)
            ? `@${u.username}`
            : null;

    const posted = new Date(photo.createdAt).toLocaleDateString("en", {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
    });

    return (
        <main className="min-h-screen bg-white">
            <div className="mx-auto w-full max-w-7xl px-4 pb-20 pt-5 sm:px-6 md:pt-8">
                <Link
                    href="/"
                    className={`group inline-flex items-center gap-2 rounded-md text-sm font-semibold text-stone-500 transition-colors hover:text-indigo-600 ${focusRing}`}
                >
                    <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
                    Back to gallery
                </Link>

                <div className="mt-5 flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
                    <figure className="w-full min-w-0 [--sw:100%] lg:w-(--sw) lg:flex-none lg:[--sw:min(max(36vw,480px),calc(min(100vw,80rem)-476px))]">
                        <div
                            className="relative mx-auto overflow-hidden rounded-2xl"
                            style={{
                                aspectRatio: `${photo.width} / ${photo.height}`,
                                width: "var(--sw)",
                                maxHeight: "calc(100dvh - 7rem)",
                            }}
                        >
                            <img
                                ref={imgRef}
                                src={src}
                                srcSet={srcSet}
                                sizes="(max-width: 1024px) 100vw, 760px"
                                alt={photo.title}
                                width={photo.width}
                                height={photo.height}
                                decoding="async"
                                referrerPolicy="no-referrer"
                                onLoad={() => setLoaded(true)}
                                className={`relative block h-full w-full object-cover transition-opacity duration-500 motion-reduce:transition-none ${
                                    loaded ? "opacity-100" : "opacity-0"
                                }`}
                            />
                        </div>
                    </figure>

                    <aside className="w-full lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:w-95 lg:shrink-0 lg:overflow-y-auto">
                        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-4xl">
                            {photo.title}
                        </h1>

                        <div className="mt-5 flex items-center gap-3">
                            <Avatar
                                src={u?.avatar}
                                name={u?.name}
                                username={u?.username}
                                seed={u?.id}
                                size={44}
                            />

                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-stone-900">
                                    {u?.name || handle || "Unknown photographer"}
                                </p>

                                {u?.name && handle ? (
                                    <p className="truncate text-sm text-stone-500">
                                        {handle}
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => void actions.toggleLike()}
                                aria-pressed={liked}
                                className={`${pillBase} ${
                                    liked
                                        ? "border-red-500 bg-red-500 text-white hover:border-red-600 hover:bg-red-600"
                                        : pillIdle
                                }`}
                            >
                                <Heart
                                    className={`h-4 w-4 ${
                                        liked ? "fill-current" : ""
                                    }`}
                                />
                                {likeCount > 0 ? formatCount(likeCount) : "Like"}
                            </button>

                            <button
                                type="button"
                                onClick={() => void actions.toggleSave()}
                                aria-pressed={saved}
                                className={`${pillBase} ${
                                    saved
                                        ? "border-indigo-600 bg-indigo-600 text-white hover:border-indigo-700 hover:bg-indigo-700"
                                        : pillIdle
                                }`}
                            >
                                <Bookmark
                                    className={`h-4 w-4 ${
                                        saved ? "fill-current" : ""
                                    }`}
                                />
                                {saved ? "Saved" : "Save"}
                            </button>
                        </div>

                        <div className="mt-3 flex items-center w-full gap-2">
                            <button
                                type="button"
                                onClick={() => void actions.share()}
                                aria-label="Share"
                                title="Share"
                                className={iconBtn}
                            >
                                <Share2 className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => void actions.copyLink()}
                                aria-label="Copy link"
                                title="Copy link"
                                className={iconBtn}
                            >
                                <Link2 className="h-4 w-4" />
                            </button>

                            <button
                                type="button"
                                onClick={actions.download}
                                aria-label="Download"
                                title="Download"
                                className={iconBtn}
                            >
                                <Download className="h-4 w-4" />
                            </button>
                        </div>

                        {photo.story ? (
                            <p className="mt-8 whitespace-pre-line font-serif text-[17px] leading-8 text-stone-700">
                                {photo.story}
                            </p>
                        ) : null}

                        {photo.tags.length > 0 ? (
                            <ul className="mt-6 flex flex-wrap gap-2">
                                {photo.tags.map((tag) => (
                                    <li
                                        key={tag}
                                        className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600"
                                    >
                                        #{String(tag).replace(/^#/, "")}
                                    </li>
                                ))}
                            </ul>
                        ) : null}

                        <dl className="mt-7 space-y-3 border-t border-stone-200 pt-6 text-sm text-stone-600">
                            {photo.location ? (
                                <div className="flex items-start gap-2.5">
                                    <dt className="mt-0.5">
                                        <MapPin className="h-4 w-4 text-stone-400" />
                                        <span className="sr-only">Location</span>
                                    </dt>
                                    <dd>{photo.location}</dd>
                                </div>
                            ) : null}

                            <div className="flex items-start gap-2.5">
                                <dt className="mt-0.5">
                                    <Calendar className="h-4 w-4 text-stone-400" />
                                    <span className="sr-only">Posted</span>
                                </dt>
                                <dd>{posted}</dd>
                            </div>
                        </dl>

                        {actions.isOwner ? (
                            <button
                                type="button"
                                onClick={() => void actions.remove()}
                                className={`mt-7 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-stone-500 transition-colors hover:text-red-600 motion-reduce:transition-none ${focusRing}`}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete photo
                            </button>
                        ) : null}
                    </aside>
                </div>

                {related}
            </div>
        </main>
    );
}