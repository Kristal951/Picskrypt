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
            const updated = await saveOnboardingStep({
                step: 1,
                name: clean,
            });

            setUser(updated);
            router.push(stepPath(updated.onboardingStep));
        } catch (err: any) {
            setError(
                err?.message || "Something went wrong. Please try again.",
            );
            setSaving(false);
        }
    };

    return (
        <main className="h-full bg-background text-primary">
            
            <section className="relative flex h-full flex-col">
                <div className="flex flex-1 items-center justify-center px-6 py-12 ">
                    <div className="w-full">
                        <div className="mb-10 flex items-center justify-center flex-col">
                            <span className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-primary">
                                <svg
                                    width="30"
                                    height="30"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="8"
                                        r="3.5"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    />
                                    <path
                                        d="M5 20C5.8 16.8 8.2 15 12 15C15.8 15 18.2 16.8 19 20"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </span>

                            <h1 className="text-4xl text-center font-bold tracking-[-0.035em] text-primary">
                                What should we call you?
                            </h1>

                            <p className="mt-2 text-center text-base leading-7 text-slate-500">
                                Choose a name people will recognize you by when you share and save photos.
                            </p>
                        </div>

                        <form onSubmit={onSubmit}>
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-3 block text-sm font-semibold text-primary"
                                >
                                    Display name
                                </label>

                                <div className="relative">
                                    <input
                                        id="name"
                                        type="text"
                                        required
                                        minLength={2}
                                        maxLength={50}
                                        autoComplete="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Enter your name"
                                        className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-5 text-base font-medium text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.03)] outline-none transition-all placeholder:text-slate-300 hover:border-slate-300 focus:border-[#6c3fc5] focus:ring-4 focus:ring-[#6c3fc5]/10"
                                    />

                                    <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-xs text-slate-300">
                                        {name.length}/50
                                    </span>
                                </div>
                            </div>

                            {error ? (
                                <div
                                    role="alert"
                                    className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                                >
                                    {error}
                                </div>
                            ) : null}

                            <button
                                type="submit"
                                disabled={
                                    saving || name.trim().length < 2
                                }
                                className="group mt-7 flex py-4 w-full items-center justify-center gap-3 rounded-xl bg-[#171022] text-sm font-semibold text-white shadow-xl shadow-slate-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6c3fc5] hover:shadow-[#6c3fc5]/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
                            >
                                <span>
                                    {saving ? "Saving..." : "Continue"}
                                </span>

                                {!saving && (
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        className="transition-transform duration-200 group-hover:translate-x-1"
                                    >
                                        <path
                                            d="M5 12H19M19 12L13 6M19 12L13 18"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                )}
                            </button>

                            <p className="mt-5 text-center text-xs text-slate-400">
                                You can change your display name later.
                            </p>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    );
}
