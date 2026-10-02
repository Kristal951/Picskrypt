
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  ImagePlus,
  Loader2,
  MapPin,
  RefreshCw,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { usePictureStore } from "@/store/pictureStore";
import { useToast } from "@/hooks/useToast";
import { prepareImage } from "@/lib/image";

const ACCEPTED = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
];

const MAX_INPUT_BYTES = 30 * 1024 * 1024;

const TITLE_MAX = 80;
const STORY_MAX = 500;
const LOCATION_MAX = 100;
const TAG_MAX = 30;
const TAGS_LIMIT = 10;

const normalizeTag = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/^#+/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_\u00C0-\uFFFF-]/g, "")
    .slice(0, TAG_MAX);

const formatBytes = (n: number) =>
  n < 1024 * 1024
    ? `${Math.max(1, Math.round(n / 1024))} KB`
    : `${(n / 1024 / 1024).toFixed(1)} MB`;

const fieldClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition " +
  "placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 sm:text-sm";

const labelClass =
  "mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700";

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const atLimit = tags.length >= TAGS_LIMIT;

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map(normalizeTag)
      .filter(Boolean);

    if (parts.length) {
      onChange(
        [...new Set([...tags, ...parts])].slice(0, TAGS_LIMIT),
      );
    }

    setDraft("");
  };

  return (
    <div>
      <div
        className="
          flex min-h-12 flex-wrap items-center gap-2
          rounded-xl border border-slate-300 bg-white
          px-3 py-2.5
          focus-within:border-indigo-500
          focus-within:ring-4
          focus-within:ring-indigo-500/10
        "
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="
              inline-flex items-center gap-1
              rounded-full bg-indigo-50
              py-1 pl-3 pr-1.5
              text-xs font-semibold text-indigo-700
            "
          >
            #{tag}

            <button
              type="button"
              onClick={() =>
                onChange(tags.filter((item) => item !== tag))
              }
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 hover:bg-indigo-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <input
          value={draft}
          disabled={atLimit}
          onChange={(e) => {
            const value = e.target.value;

            if (value.includes(",")) {
              commit(value);
            } else {
              setDraft(value);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
            }

            if (
              e.key === "Backspace" &&
              !draft &&
              tags.length
            ) {
              onChange(tags.slice(0, -1));
            }
          }}
          onBlur={() => {
            if (draft) commit(draft);
          }}
          placeholder={tags.length ? "" : "travel, sunset"}
          aria-label="Add a tag"
          className="
            min-w-[8ch] flex-1
            bg-transparent
            text-base
            outline-none
            placeholder:text-slate-400
            disabled:cursor-not-allowed
            sm:text-sm
          "
        />
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        {atLimit
          ? `That's the maximum of ${TAGS_LIMIT} tags.`
          : "Press Enter or comma to add. Up to 10."}
      </p>
    </div>
  );
}

const UploadPicture = () => {
  const router = useRouter();

  const uploadPicture = usePictureStore(
    (state) => state.uploadPicture,
  );

  const { showToast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    size: number;
    originalSize: number;
  } | null>(null);

  const [preparing, setPreparing] = useState(false);
  const [fileError, setFileError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [cameraSupported, setCameraSupported] =
    useState(false);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<
    "environment" | "user"
  >("environment");

  const [cameraError, setCameraError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobUrlRef = useRef<string | null>(null);

  const setPreview = useCallback((blob: Blob | null) => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
    }

    blobUrlRef.current = blob
      ? URL.createObjectURL(blob)
      : null;

    setPreviewUrl(blobUrlRef.current);
  }, []);

  useEffect(() => {
    setCameraSupported(
      !!navigator.mediaDevices?.getUserMedia,
    );

    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!file || submitting) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);

    return () =>
      window.removeEventListener(
        "beforeunload",
        onBeforeUnload,
      );
  }, [file, submitting]);

  useEffect(() => {
    if (!cameraOpen) return;

    let cancelled = false;
    let stream: MediaStream | null = null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";
    setCameraError("");

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCameraOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    (async () => {
      try {
        stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: facing,
              width: { ideal: 2560 },
              height: { ideal: 1440 },
            },
            audio: false,
          });

        if (cancelled) {
          stream
            .getTracks()
            .forEach((track) => track.stop());

          return;
        }

        const video = videoRef.current;

        if (video) {
          video.srcObject = stream;
          await video.play().catch(() => { });
        }
      } catch (err: any) {
        if (cancelled) return;

        setCameraError(
          err?.name === "NotAllowedError"
            ? "Camera access was blocked. Allow it in your browser settings and try again."
            : "We couldn't start the camera on this device.",
        );
      }
    })();

    return () => {
      cancelled = true;

      stream
        ?.getTracks()
        .forEach((track) => track.stop());

      window.removeEventListener("keydown", onKey);

      document.body.style.overflow =
        previousOverflow;
    };
  }, [cameraOpen, facing]);

  const handleFile = useCallback(
    async (picked: File) => {
      setFileError("");

      if (!ACCEPTED.includes(picked.type)) {
        setFileError(
          "Please choose a JPG, PNG, WebP or AVIF image.",
        );
        return;
      }

      if (picked.size > MAX_INPUT_BYTES) {
        setFileError(
          "That image is over 30 MB. Please choose a smaller one.",
        );
        return;
      }

      setPreparing(true);

      try {
        const prepared = await prepareImage(picked);

        setFile(prepared.file);

        setPreview(prepared.file);

        setImageInfo({
          width: prepared.width,
          height: prepared.height,
          size: prepared.file.size,
          originalSize: prepared.originalSize,
        });
      } catch (err: any) {
        setFileError(
          err?.message ||
          "We couldn't read that image. Try a different one.",
        );
      } finally {
        setPreparing(false);
      }
    },
    [setPreview],
  );

  const takePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (
      !video ||
      !canvas ||
      !video.videoWidth
    ) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas
      .getContext("2d")
      ?.drawImage(
        video,
        0,
        0,
        canvas.width,
        canvas.height,
      );

    const blob =
      await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(
          resolve,
          "image/jpeg",
          0.92,
        ),
      );

    if (!blob) {
      setCameraError(
        "We couldn't capture the photo. Please try again.",
      );
      return;
    }

    setCameraOpen(false);

    await handleFile(
      new File(
        [blob],
        `camera-${Date.now()}.jpg`,
        {
          type: "image/jpeg",
        },
      ),
    );
  };

  const removePhoto = () => {
    setFile(null);
    setImageInfo(null);
    setFileError("");
    setPreview(null);
  };

  const onDrop = (
    e: React.DragEvent<HTMLDivElement>,
  ) => {
    e.preventDefault();

    setIsDragging(false);

    const dropped =
      e.dataTransfer.files?.[0];

    if (dropped) {
      void handleFile(dropped);
    }
  };

  const onSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    if (
      !file ||
      submitting ||
      preparing
    ) {
      return;
    }

    const cleanTitle = title.trim();

    if (!cleanTitle) {
      showToast(
        "Please add a title",
        "error",
      );
      return;
    }

    const formData = new FormData();

    formData.append("file", file);
    formData.append("title", cleanTitle);
    formData.append(
      "story",
      story.trim(),
    );
    formData.append(
      "location",
      location.trim(),
    );
    formData.append(
      "tags",
      JSON.stringify(tags),
    );

    setSubmitting(true);

    try {
      await uploadPicture(formData);

      showToast(
        "Your photo is live",
        "success",
      );

      router.push("/");
    } catch (err: any) {
      showToast(
        err?.message ||
        "We couldn't post your photo. Please try again.",
        "error",
      );

      setSubmitting(false);
    }
  };

  const canPost =
    !!file &&
    title.trim().length > 0 &&
    !preparing &&
    !submitting;

  return (
    <div className="h-screen bg-slate-50 relative w-full flex flex-col items-center justify-center text-slate-900">
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          const picked =
            e.target.files?.[0];

          e.target.value = "";

          if (picked) {
            void handleFile(picked);
          }
        }}
      />

      <header className="absolute right-0 top-2">
        <div
          className="
            mx-auto flex py-2 w-full max-w-6xl
            items-center justify-end
            px-4 sm:px-6
          "
        >
          {/* <Link
            href="/"
            className="
              inline-flex items-center gap-2
              rounded-lg py-2
              text-sm font-semibold
              text-slate-600
              transition hover:text-slate-900
            "
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Link> */}

          {/* <Link
            href="/"
            className="
              absolute left-1/2
              -translate-x-1/2
              text-lg font-black
              tracking-tight text-slate-900
            "
          >
            Picskrypt
          </Link> */}

          <Link
            href="/"
            aria-label="Close"
            className="
              flex h-9 w-9 items-center
              justify-center rounded-full
              text-slate-500
              transition hover:bg-slate-100
              hover:text-slate-700
            "
          >
            <X className="h-6 w-6" />
          </Link>
        </div>
      </header>

      <main
        className="
          mx-auto w-full max-w-6xl
          px-4 py-6
          sm:px-6 sm:py-10
          lg:py-14
        "
      >
        {!file ? (
          <section
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              if (
                !e.currentTarget.contains(
                  e.relatedTarget as Node,
                )
              ) {
                setIsDragging(false);
              }
            }}
            onDrop={onDrop}
            className={`
              mx-auto
              w-full max-w-3xl
              rounded-3xl
              border-2 border-dashed
              px-5 py-10
              sm:px-10 sm:py-14
              ${isDragging
                ? "border-indigo-500 bg-indigo-50/60"
                : "border-slate-300 bg-white"
              }
              transition-colors
            `}
          >
            {preparing ? (
              <div
                role="status"
                className="
                  flex min-h-70
                  flex-col items-center
                  justify-center gap-3
                  text-slate-600
                "
              >
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />

                <p className="text-sm font-medium">
                  Preparing your photo...
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div
                  className="
                    mb-5 flex h-16 w-16
                    items-center justify-center
                    rounded-2xl bg-indigo-50
                    text-indigo-600
                  "
                >
                  <ImagePlus className="h-7 w-7" />
                </div>

                <h1
                  className="
                    text-2xl font-extrabold
                    tracking-tight
                    sm:text-3xl
                  "
                >
                  Share a photo
                </h1>

                <p
                  className="
                    mt-2 max-w-sm
                    text-sm leading-6
                    text-slate-500
                    sm:text-base
                  "
                >
                  Drag and drop your photo here,
                  or choose one from your device.
                </p>

                <div
                  className="
                    mt-7 flex w-full
                    max-w-sm flex-col gap-3
                    sm:flex-row sm:max-w-none items-center justify-center
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      inputRef.current?.click()
                    }
                    className="
                      inline-flex
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-indigo-600
                      px-6 py-3.5
                      text-sm font-bold
                      text-white
                      transition
                      hover:bg-indigo-700
                      focus:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-indigo-500/30
                    "
                  >
                    <ImagePlus className="h-4 w-4" />
                    Choose a photo
                  </button>

                  {cameraSupported ? (
                    <button
                      type="button"
                      onClick={() =>
                        setCameraOpen(true)
                      }
                      className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        border
                        border-slate-300
                        bg-white
                        px-6 py-3.5
                        text-sm font-bold
                        text-slate-700
                        transition
                        hover:bg-slate-50
                      "
                    >
                      <Camera className="h-4 w-4 text-indigo-600" />
                      Take a photo
                    </button>
                  ) : null}
                </div>

                <p className="mt-6 text-xs text-slate-400">
                  JPG, PNG, WebP or AVIF.
                  Large photos are optimized for you.
                </p>

                {fileError ? (
                  <p
                    role="alert"
                    className="
                      mt-4 max-w-sm
                      text-sm font-medium
                      text-red-600
                    "
                  >
                    {fileError}
                  </p>
                ) : null}
              </div>
            )}
          </section>
        ) : (
          <form
            onSubmit={onSubmit}
            className="
              grid
              grid-cols-1
              gap-8
              lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]
              lg:gap-12
            "
          >
            <section className="min-w-0">
              <div className="mb-7 md:hidden flex-col">
                <h1
                  className="
                    text-2xl font-extrabold
                    tracking-tight
                    sm:text-3xl
                    text-center
                  "
                >
                  Add the details
                </h1>

                <p className="mt-2 text-sm leading-6 text-center text-slate-500">
                  Give your photo some context.
                  Only the title is required.
                </p>
              </div>
              <div
                className="
                  overflow-hidden
                  rounded-2xl
                  border border-slate-200
                  bg-slate-100
                "
              >
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview of your photo"
                    className="
                      mx-auto block
                      max-h-[55vh]
                      w-auto max-w-full
                      object-contain
                      sm:max-h-[65vh]
                      lg:max-h-[70vh]
                    "
                  />
                ) : null}
              </div>

              <div
                className="
                  mt-3 flex
                  gap-3
                 justify-between
                 items-center
                "
              >
                <p className="text-xs text-slate-500">
                  {imageInfo &&
                    imageInfo.width > 0
                    ? `${imageInfo.width}×${imageInfo.height} · `
                    : ""}

                  {imageInfo
                    ? formatBytes(
                      imageInfo.size,
                    )
                    : ""}

                  {imageInfo &&
                    imageInfo.originalSize >
                    imageInfo.size
                    ? ` (optimized from ${formatBytes(
                      imageInfo.originalSize,
                    )})`
                    : ""}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      inputRef.current?.click()
                    }
                    disabled={
                      submitting ||
                      preparing
                    }
                    className="
                      inline-flex
                      items-center gap-1.5
                      rounded-lg
                      border border-slate-300
                      bg-white
                      px-3 py-2
                      text-xs font-semibold
                      text-slate-700
                      transition
                      hover:bg-slate-50
                      disabled:opacity-50
                    "
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Replace
                  </button>

                  <button
                    type="button"
                    onClick={removePhoto}
                    disabled={
                      submitting ||
                      preparing
                    }
                    className="
                      inline-flex
                      items-center gap-1.5
                      rounded-lg
                      border border-slate-300
                      bg-white
                      px-3 py-2
                      text-xs font-semibold
                      text-red-600
                      transition
                      hover:bg-red-50
                      disabled:opacity-50
                    "
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
              </div>

              {preparing ? (
                <p
                  role="status"
                  className="
                    mt-3 flex items-center
                    gap-2 text-xs text-slate-500
                  "
                >
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Preparing your photo...
                </p>
              ) : null}

              {fileError ? (
                <p
                  role="alert"
                  className="
                    mt-3 text-sm
                    font-medium text-red-600
                  "
                >
                  {fileError}
                </p>
              ) : null}
            </section>

            <section className="min-w-0">
              <div className="mb-7 hidden md:flex flex-col">
                <h1
                  className="
                    text-2xl font-extrabold
                    tracking-tight
                    sm:text-3xl
                  "
                >
                  Add the details
                </h1>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Give your photo some context.
                  Only the title is required.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="title"
                    className={labelClass}
                  >
                    Title
                    <span className="text-red-500">
                      *
                    </span>
                  </label>

                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value.slice(
                          0,
                          TITLE_MAX,
                        ),
                      )
                    }
                    placeholder="Summer bliss"
                    maxLength={TITLE_MAX}
                    autoComplete="off"
                    className={fieldClass}
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {title.length}/{TITLE_MAX}
                  </p>
                </div>

                {/* Story */}
                <div>
                  <label
                    htmlFor="story"
                    className={labelClass}
                  >
                    Story
                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <textarea
                    id="story"
                    value={story}
                    onChange={(e) =>
                      setStory(
                        e.target.value.slice(
                          0,
                          STORY_MAX,
                        ),
                      )
                    }
                    placeholder="Tell us about this moment..."
                    rows={5}
                    maxLength={STORY_MAX}
                    className={`${fieldClass} resize-none`}
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {story.length}/{STORY_MAX}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <label
                    htmlFor="location"
                    className={labelClass}
                  >
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />

                    Location

                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) =>
                      setLocation(
                        e.target.value.slice(
                          0,
                          LOCATION_MAX,
                        ),
                      )
                    }
                    placeholder="Paris, France"
                    maxLength={LOCATION_MAX}
                    autoComplete="off"
                    className={fieldClass}
                  />
                </div>

                {/* Tags */}
                <div>
                  <span className={labelClass}>
                    <Tag className="h-3.5 w-3.5 text-indigo-500" />

                    Tags

                    <span className="font-normal text-slate-400">
                      (optional)
                    </span>
                  </span>

                  <TagInput
                    tags={tags}
                    onChange={setTags}
                  />
                </div>

                {/* Publish */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!canPost}
                    className="
                      flex w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-indigo-600
                      px-6 py-3.5
                      text-sm font-bold
                      text-white
                      shadow-lg
                      shadow-indigo-600/20
                      transition
                      hover:bg-indigo-700
                      focus:outline-none
                      focus-visible:ring-4
                      focus-visible:ring-indigo-500/30
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      disabled:shadow-none
                    "
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      "Post photo"
                    )}
                  </button>
                </div>
              </div>
            </section>
          </form>
        )}
      </main>

      {/* Camera */}
      {cameraOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Take a photo"
          className="
            fixed inset-0 z-60
            flex flex-col
            bg-black
          "
        >
          <div className="flex items-center justify-between p-4">
            <button
              type="button"
              onClick={() =>
                setCameraOpen(false)
              }
              aria-label="Close camera"
              className="
                rounded-full
                bg-white/15 p-3
                text-white
                backdrop-blur
                hover:bg-white/25
              "
            >
              <X className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                setFacing((current) =>
                  current === "environment"
                    ? "user"
                    : "environment",
                )
              }
              aria-label="Switch camera"
              className="
                rounded-full
                bg-white/15 p-3
                text-white
                backdrop-blur
                hover:bg-white/25
              "
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          <div className="relative min-h-0 flex-1">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`
                h-full w-full
                object-contain
                ${facing === "user"
                  ? "transform-[scaleX(-1)]"
                  : ""
                }
              `}
            />

            {cameraError ? (
              <div
                role="alert"
                className="
                  absolute inset-0
                  flex items-center
                  justify-center
                  p-8 text-center
                  text-sm text-white
                "
              >
                {cameraError}
              </div>
            ) : null}
          </div>

          <div
            className="
              flex items-center
              justify-center
              p-6
              pb-[calc(1.5rem+env(safe-area-inset-bottom))]
            "
          >
            <button
              type="button"
              onClick={takePhoto}
              disabled={!!cameraError}
              aria-label="Take photo"
              className="
                h-20 w-20
                rounded-full
                border-4
                border-white/40
                bg-white
                p-1.5
                shadow-2xl
                transition
                active:scale-95
                disabled:opacity-40
              "
            >
              <span className="block h-full w-full rounded-full bg-indigo-600" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UploadPicture;

