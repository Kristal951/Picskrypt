"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
            setError(err?.message || "Something went wrong. Please try again.");
            setSaving(false);
        }
    };

    return (
        <>
            <h1 className="text-xl font-bold text-slate-900">Add a profile photo</h1>
            <p className="mt-1 text-sm text-slate-600">
                Optional. You can always add one later.
            </p>

            <div className="mt-6 flex flex-col items-center gap-4">
                <Avatar
                    src={preview ?? user?.avatar}
                    name={user?.name}
                    username={user?.username}
                    seed={user?.id}
                    size={112}
                />

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
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                >
                    {blob || user?.avatar ? "Choose a different photo" : "Choose a photo"}
                </button>
            </div>

            {error ? (
                <p role="alert" className="mt-4 text-sm text-red-600">
                    {error}
                </p>
            ) : null}

            <div className="mt-6 flex gap-3">
                <Link
                    href={stepPath(2)}
                    className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                    Back
                </Link>
                <button
                    type="button"
                    onClick={finish}
                    disabled={saving}
                    className="flex-1 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white
                     hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? "Saving..." : blob ? "Save and finish" : "Skip for now"}
                </button>
            </div>
        </>
    );
}