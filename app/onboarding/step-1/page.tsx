"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { saveOnboardingStep } from "@/lib/api";
import { stepPath, validateName } from "@/lib/onboarding";

export default function Step1Page() {
    const router = useRouter();
    const setUser = useUserStore((s) => s.setUser);

    const [name, setName] = useState(
        () => useUserStore.getState().user?.name ?? "",
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        const { name: clean, error: localError } = validateName(name);
        if (localError) {
            setError(localError);
            return;
        }

        setSaving(true);
        setError("");
        try {
            const updated = await saveOnboardingStep({ step: 1, name: clean });
            setUser(updated);
            router.push(stepPath(updated.onboardingStep));
        } catch (err: any) {
            setError(err?.message || "Something went wrong. Please try again.");
            setSaving(false);
        }
    };

    return (
        <>
            <h1 className="text-xl font-bold text-slate-900">
                What should we call you?
            </h1>
            <p className="mt-1 text-sm text-slate-600">
                This name shows on the photos you share.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Display name
                    </label>
                    <input
                        id="name"
                        type="text"
                        required
                        minLength={2}
                        maxLength={50}
                        autoComplete="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>

                {error ? (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                ) : null}

                <button
                    type="submit"
                    disabled={saving || name.trim().length < 2}
                    className="w-full rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white
                     hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                    {saving ? "Saving..." : "Continue"}
                </button>
            </form>
        </>
    );
}