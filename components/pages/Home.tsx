"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { Masonry } from "masonic";
import { Camera, Search } from "lucide-react";
import PhotoCard from "../ui/PhotoCard";
import Spinner from "../ui/Spinner";
import GoogleOneTap from "../google/GoogleOneTap";
import { usePictureStore } from "@/store/pictureStore";
import { useUserStore } from "@/store/userStore";
import type { Picture } from "@/types/Photo";
import CreatePictureButton from "../ui/CreatePictureButton";

type HomeProps = {
  searchQuery: string;
};

const GUTTER = 16;

// Same breakpoints as before: 2 columns, 3 from md, 4 from xl
function useColumnCount() {
  const [count, setCount] = useState(2);

  useEffect(() => {
    const md = window.matchMedia("(min-width: 768px)");
    const xl = window.matchMedia("(min-width: 1280px)");
    const update = () => setCount(xl.matches ? 4 : md.matches ? 3 : 2);

    update();
    md.addEventListener("change", update);
    xl.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      xl.removeEventListener("change", update);
    };
  }, []);

  return count;
}

const MasonryCard = ({
  data,
  index,
}: {
  data: Picture;
  index: number;
  width: number;
}) => <PhotoCard photo={data} priority={index < 4} />;

const itemKey = (data: Picture) => data.id;

const Home = ({ searchQuery }: HomeProps) => {
  const pictures = usePictureStore((s) => s.pictures);
  const loading = usePictureStore((s) => s.loading);
  const loadingMore = usePictureStore((s) => s.loadingMore);
  const error = usePictureStore((s) => s.error);
  const hasMore = usePictureStore((s) => s.hasMore);
  const fetchPictures = usePictureStore((s) => s.fetchPictures);
  const loadMore = usePictureStore((s) => s.loadMore);

  const userId = useUserStore((s) => s.user?.id ?? null);

  const [fetched, setFetched] = useState(false);
  const [mounted, setMounted] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const columnCount = useColumnCount();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    fetchPictures()
      .catch(() => { })
      .finally(() => setFetched(true));
  }, [fetchPictures, userId]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loadMore, pictures.length]);

  const filteredPhotos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^[#@]/, "");
    if (!q) return pictures;

    return pictures.filter((photo) => {
      const haystack = [
        (photo.tags ?? []).join(" "),
        photo.title,
        photo.story,
        photo.location,
        photo.id,
        photo.user?.username,
        photo.user?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [searchQuery, pictures]);

  const prevIdsRef = useRef<string[]>([]);
  const [layoutVersion, setLayoutVersion] = useState(0);

  useLayoutEffect(() => {
    const prev = prevIdsRef.current;
    const next = filteredPhotos.map((p) => p.id);
    const isAppend =
      prev.length <= next.length && prev.every((id, i) => id === next[i]);

    prevIdsRef.current = next;
    if (!isAppend) setLayoutVersion((v) => v + 1);
  }, [filteredPhotos]);

  const noPhotosYet = pictures.length === 0;
  const searching = searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen w-full bg-[#fcfcfc] text-slate-900 relative">
      <main className="w-full mx-auto px-4 pt-20 pb-20">
        {searching ? (
          <header className="mb-12 mt-4">
            <h1 className="text-4xl font-extrabold tracking-tight mb-2">
              Results for &ldquo;{searchQuery}&rdquo;
            </h1>
            <p className="text-slate-500 text-lg" aria-live="polite">
              {filteredPhotos.length}
              {hasMore ? "+" : ""} image
              {filteredPhotos.length === 1 && !hasMore ? "" : "s"} found.
            </p>
          </header>
        ) : (
          <div className="mt-4" />
        )}

        {noPhotosYet && (loading || !fetched) ? (
          <div className="py-40 flex items-center justify-center">
            <Spinner />
          </div>
        ) : noPhotosYet && error ? (
          <div className="py-20 text-center">
            <h3 className="text-lg font-semibold text-red-600">
              Failed to load pictures
            </h3>
            <p className="text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => {
                fetchPictures().catch(() => { });
              }}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : noPhotosYet ? (
          <div className="py-20 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold">No photos yet</h3>
            <p className="text-slate-500">Be the first to share one.</p>
            <Link
              href="/pictures/create"
              className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              Post a photo
            </Link>
          </div>
        ) : filteredPhotos.length > 0 ? (
          mounted ? (
            <Masonry
              key={layoutVersion}
              items={filteredPhotos}
              render={MasonryCard}
              itemKey={itemKey}
              columnCount={columnCount}
              columnGutter={GUTTER}
              rowGutter={GUTTER}
              itemHeightEstimate={320}
              overscanBy={3}
            />
          ) : null
        ) : hasMore ? (
          <div className="py-20 text-center text-slate-500">
            Searching more photos&hellip;
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold">No results found</h3>
            <p className="text-slate-500">
              Try searching by tags, title, or location.
            </p>
          </div>
        )}

        {hasMore ? (
          <div ref={sentinelRef} aria-hidden className="h-px w-full" />
        ) : null}

        {loadingMore ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : null}

        {error && !noPhotosYet ? (
          <div className="py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="mt-3 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Try again
            </button>
          </div>
        ) : null}

        {!hasMore && !noPhotosYet && !searching && !error ? (
          <p className="py-10 text-center text-sm text-slate-400">
            You&apos;ve reached the end.
          </p>
        ) : null}
      </main>

      <GoogleOneTap />
      <CreatePictureButton />
    </div>
  );
};

export default Home;