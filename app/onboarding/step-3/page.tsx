"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Sparkles } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { saveOnboardingStep, uploadAvatar } from "@/lib/api";
import { resizeToSquareJpeg } from "@/lib/image";
import { stepPath } from "@/lib/onboarding";
import Avatar from "@/components/ui/Avatar";

const MAX_INPUT_BYTES = 25 * 1024 * 1024;

export default function Step3Page() {
    const router = useRouter();
    const user = useUserStore((s) => s.user);
    const setUser = useUserStore((s) => s.setUser);

    const [blob, setBlob] = useState<Blob | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (preview) URL.revokeObjectURL(preview);
        };
    }, [preview]);

    const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Please choose an image file.");
            return;
        }

        if (file.size > MAX_INPUT_BYTES) {
            setError("That image is too large. Choose one under 25MB.");
            return;
        }

        setError("");

        try {
            const out = await resizeToSquareJpeg(file);

            if (preview) {
                URL.revokeObjectURL(preview);
            }

            setBlob(out);
            setPreview(URL.createObjectURL(out));
        } catch {
            setError("We couldn't read that image. Try a different one.");
        }
    };

    const finish = async () => {
        if (saving) return;

        setSaving(true);
        setError("");

        try {
            if (blob) await uploadAvatar(blob);

            const updated = await saveOnboardingStep({ step: 3 });
            setUser(updated);
            router.replace("/");
        } catch (err: any) {
            setError(
                err?.message || "Something went wrong. Please try again."
            );
            setSaving(false);
        }
    };

    const hasPhoto = Boolean(blob || user?.avatar);

    return (
        <div className="flex min-h-[calc(100vh-120px)] flex-col">
            <div className="max-w-xl">
                <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-primary">
                    <Camera className="h-5 w-5" strokeWidth={2} />
                </div>

                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                    Add a profile photo.
                </h1>

                <p className="mt-3 max-w-md text-[15px] leading-6 text-slate-500">
                    Give your profile a face. Choose a photo that represents
                    you — you can always change it later.
                </p>
            </div>

            <div className="flex flex-1 items-center justify-center py-10">
                <div className="flex w-full max-w-md flex-col items-center">
                    <div className="relative">
                        <div
                            className={`rounded-full p-1 transition-all duration-300 ${
                                preview
                                    ? "bg-linear-to-br from-primary via-violet-400 to-fuchsia-400"
                                    : "bg-slate-100"
                            }`}
                        >
                            <div className="rounded-full bg-white p-1">
                                <Avatar
                                    src={preview ?? user?.avatar}
                                    name={user?.name}
                                    username={user?.username}
                                    seed={user?.id}
                                    size={152}
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={saving}
                            aria-label="Choose profile photo"
                            className="absolute bottom-1 right-1 flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg ring-4 ring-white transition-all hover:scale-105 hover:bg-primary disabled:pointer-events-none disabled:opacity-60"
                        >
                            <Camera className="h-5 w-5" />
                        </button>
                    </div>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={onPick}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={saving}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <ImagePlus className="h-4 w-4" />
                        {hasPhoto ? "Choose a different photo" : "Choose a photo"}
                    </button>

                    <p className="mt-3 text-[11px] text-slate-400">
                        JPG, PNG or WebP · Up to 25MB
                    </p>
                </div>
            </div>

            {error ? (
                <div
                    role="alert"
                    className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
                >
                    {error}
                </div>
            ) : null}

            <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-5">
                <Link
                    href={stepPath(2)}
                    className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                    Back
                </Link>

                <button
                    type="button"
                    onClick={finish}
                    disabled={saving}
                    className="group flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? (
                        "Saving..."
                    ) : hasPhoto ? (
                        <>
                            Finish setup
                        </>
                    ) : (
                        "Skip for now"
                    )}
                </button>
            </div>
        </div>
    );
}