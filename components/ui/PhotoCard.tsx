"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Download,
  ExternalLink,
  Heart,
  Link2,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { usePhotoActions } from "@/hooks/usePhotoActions";
import { usePictureStore } from "@/store/pictureStore";
import { photoPath } from "@/lib/photo-utils";
import { isPlaceholderUsername } from "@/lib/username";
import cloudinaryLoader from "@/lib/cloudinaryLoader";
import Avatar from "./Avatar";
import { Picture } from "@/types/Photo";
import { useRouter } from "next/navigation";

interface PhotoCardProps {
  photo: Picture;
  onOpen?: (photo: Picture) => void;
  priority?: boolean;
}

const WIDTHS = [320, 480, 640, 800, 1200, 1600];

const SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

const TOUCH_SHOW =
  "[@media(hover:none)]:opacity-0 [@media(hover:none)]:translate-y-0";

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onOpen,
  priority = false,
}) => {
  const patchPicture = usePictureStore((s) => s.patchPicture);
  const removePicture = usePictureStore((s) => s.removePicture);
  const router = useRouter();

  const actions = usePhotoActions(photo, {
    onPatch: (patch) => patchPicture(photo.id, patch),
    onDeleted: () => removePicture(photo.id),
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const liked = !!photo.likedByMe;
  const saved = !!photo.savedByMe;
  const likeCount = photo.likeCount ?? 0;

  const safeWidth = photo.width && photo.width > 0 ? photo.width : 1200;
  const safeHeight = photo.height && photo.height > 0 ? photo.height : 900;

  const { src, srcSet } = useMemo(() => {
    const url = photo.imageUrl || "";
    const isCloudinary =
      url.includes("res.cloudinary.com") && url.includes("/upload/");
    if (!isCloudinary) return { src: url, srcSet: undefined };

    let widths = WIDTHS.filter((w) => w <= safeWidth);
    if (!widths.length) widths = [Math.round(safeWidth)];

    const fallbackW = widths.filter((w) => w <= 800).pop() ?? widths[0];

    return {
      src: cloudinaryLoader({ src: url, width: fallbackW }),
      srcSet: widths
        .map((w) => `${cloudinaryLoader({ src: url, width: w })} ${w}w`)
        .join(", "),
    };
  }, [photo.imageUrl, safeWidth]);

  const byline = useMemo(() => {
    const u = photo.user;
    const handle =
      u?.username && !isPlaceholderUsername(u.username)
        ? `@${u.username}`
        : u?.name || "";
    return handle
  }, [photo.user]);

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const openCard = () => {
    if (onOpen) onOpen(photo);
    else router.push(photoPath(photo.id));
  }

  const glass =
    "backdrop-blur-md border transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20";
  const glassIdle = "bg-white/85 text-slate-700 border-white/40 hover:bg-white";

  return (
    <article
      className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70
                 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10"
    >
      <button
        type="button"
        onClick={openCard}
        className="relative block w-full text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
        aria-label={photo.title ? `Open ${photo.title}` : "Open photo"}
      >
        <div className="relative">
          <img
            src={src}
            srcSet={srcSet}
            sizes={srcSet ? SIZES : undefined}
            alt={photo.title || "Picture"}
            width={safeWidth}
            height={safeHeight}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            referrerPolicy="no-referrer"
            style={{
              width: "100%",
              height: "auto",
              aspectRatio: `${safeWidth} / ${safeHeight}`,
              objectFit: "cover",
              display: "block",
              ...(photo.blurDataURL
                ? {
                  backgroundImage: `url(${photo.blurDataURL})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
                : {}),
            }}
          />

          <div
            className={`pointer-events-none absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent
                        opacity-0 group-hover:opacity-100 ${TOUCH_SHOW} transition-opacity duration-300`}
          />
        </div>
      </button>

      <div
        className="
          absolute md:top-3 top-1 md:right-3 right-1 z-30
          flex items-center md:gap-3
          opacity-0 translate-y-2.5
          group-hover:opacity-100 group-hover:translate-y-0
          focus-within:opacity-100 focus-within:translate-y-0
          [@media(hover:none)]:opacity-100
          [@media(hover:none)]:translate-y-0
          transition-all duration-300
        "
        >
        <button
          type="button"
          onClick={(e) => {
            stop(e);
            void actions.toggleLike();
          }}
          aria-pressed={liked}
          aria-label={liked ? "Unlike photo" : "Like photo"}
          title={liked ? "Unlike" : "Like"}
          className="p-1 text-white transition-transform duration-200
               hover:scale-110 focus:outline-none
               focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
        >
          <Heart
            style={{
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.9))",
            }}
            className={`md:h-8 h-6 md:w-8 w-6 transition-colors duration-200 stroke-1 ${liked ? "fill-red-500 text-red-500" : "text-white"
              }`}
          />
        </button>

        <button
          type="button"
          onClick={(e) => {
            stop(e);
            void actions.toggleSave();
          }}
          aria-pressed={saved}
          aria-label={saved ? "Remove from saved" : "Save photo"}
          title={saved ? "Saved" : "Save"}
          className="p-1 text-white transition-transform duration-200
               hover:scale-110 focus:outline-none
               focus-visible:ring-2 focus-visible:ring-white/60 rounded-full"
        >
          <Bookmark
            style={{
              filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.9))",
            }}
            className={`md:h-8 h-6 md:w-8 w-6 transition-colors duration-200 stroke-1 ${saved ? "fill-blue-500 text-blue-500" : "text-white"
              }`}
          />
        </button>
      </div>

      <div
        className={`pointer-events-none absolute bottom-0 left-0 right-0 z-20 p-4 transition-all duration-300 ${menuOpen
          ? "opacity-100 translate-y-0"
          : `opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0
               focus-within:opacity-100 focus-within:translate-y-0 ${TOUCH_SHOW}`
          }`}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0 text-white">
            <h3 className="text-sm font-bold truncate drop-shadow">
              {photo.title || "Untitled"}
            </h3>

            <div className="mt-1 flex items-center gap-2">
              <Avatar
                src={photo.user?.avatar}
                name={photo.user?.name}
                username={photo.user?.username}
                seed={photo.user?.id}
                size={24}
                className="shadow"
              />
              <span className="text-xs font-medium opacity-90 truncate">
                {byline}
              </span>
            </div>

            {/* {photo.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {photo.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center rounded-full bg-white/10 backdrop-blur px-2 py-0.5
                               text-[11px] font-semibold border border-white/15"
                  >
                    {String(t).startsWith("#") ? String(t) : `#${t}`}
                  </span>
                ))}
                {photo.tags.length > 3 ? (
                  <span className="text-[11px] font-semibold opacity-80">
                    +{photo.tags.length - 3}
                  </span>
                ) : null}
              </div>
            ) : null} */}
          </div>

          <div className="pointer-events-auto flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 backdrop-blur-lg p-1">
            <button
              type="button"
              onClick={(e) => {
                stop(e);
                actions.download();
              }}
              className="p-2 rounded-lg text-white/95 hover:bg-white/15 transition-colors
                         focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              title="Download"
              aria-label="Download"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                stop(e);
                void actions.share();
              }}
              className="p-2 rounded-lg text-white/95 hover:bg-white/15 transition-colors
                         focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
              title="Share"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen((v) => !v);
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="p-2 rounded-lg text-white/95 hover:bg-white/15 transition-colors
                           focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
                title="More options"
                aria-label="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute bottom-full right-0 mb-2 w-44 overflow-hidden rounded-xl border border-slate-200/70
                             bg-white text-slate-800 shadow-xl"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      stop(e);
                      setMenuOpen(false);
                      void actions.copyLink();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-slate-50"
                  >
                    <Link2 className="w-4 h-4 text-slate-400" />
                    Copy link
                  </button>

                  <Link
                    href={photoPath(photo.id)}
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-slate-50"
                  >
                    <ExternalLink className="w-4 h-4 text-slate-400" />
                    View photo
                  </Link>

                  {actions.isOwner ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={(e) => {
                        stop(e);
                        setMenuOpen(false);
                        void actions.remove();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete photo
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default React.memo(PhotoCard);