"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { saveOnboardingStep, checkUsername } from "@/lib/api";
import { stepPath } from "@/lib/onboarding";
import {
    validateUsername,
    isPlaceholderUsername,
    suggestUsername,
    USERNAME_MAX,
} from "@/lib/username";

type Availability = "idle" | "checking" | "available" | "taken" | "invalid";

export default function Step2Page() {
    const router = useRouter();
    const setUser = useUserStore((s) => s.setUser);

    const [username, setUsername] = useState(() => {
        const u = useUserStore.getState().user;

        return isPlaceholderUsername(u?.username)
            ? suggestUsername(u?.name ?? "")
            : (u?.username ?? "");
    });

    const [availability, setAvailability] =
        useState<Availability>("idle");

    const [hint, setHint] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const requestId = useRef(0);

    useEffect(() => {
        if (!username) {
            setAvailability("idle");
            setHint("");
            return;
        }

        const { username: clean, error: localError } =
            validateUsername(username);

        if (localError) {
            setAvailability("invalid");
            setHint(localError);
            return;
        }

        setAvailability("checking");
        setHint("");

        const id = ++requestId.current;

        const t = setTimeout(async () => {
            try {
                const res = await checkUsername(clean);

                if (id !== requestId.current) return;

                setAvailability(
                    res.available ? "available" : "taken",
                );

                setHint(
                    res.available
                        ? ""
                        : (res.reason ?? "That username is taken."),
                );
            } catch {
                if (id !== requestId.current) return;

                setAvailability("idle");
                setHint("");
            }
        }, 400);

        return () => clearTimeout(t);
    }, [username]);

    const canSubmit =
        !saving &&
        username.length > 0 &&
        (availability === "available" ||
            availability === "idle");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canSubmit) return;

        const { username: clean, error: localError } =
            validateUsername(username);

        if (localError) {
            setAvailability("invalid");
            setHint(localError);
            return;
        }

        setSaving(true);
        setError("");

        try {
            const updated = await saveOnboardingStep({
                step: 2,
                username: clean,
            });

            setUser(updated);
            router.push(stepPath(updated.onboardingStep));
        } catch (err: any) {
            const msg =
                err?.message ||
                "Something went wrong. Please try again.";

            if (err?.status === 409) {
                setAvailability("taken");
                setHint(msg);
            } else {
                setError(msg);
            }

            setSaving(false);
        }
    };

    const isError =
        availability === "taken" ||
        availability === "invalid";

    return (
        <div className="w-full">
            <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-primary">
                <span className="text-[27px] font-semibold leading-none">
                    @
                </span>
            </div>

            <div className="mb-9">
                <h1 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
                    Choose your username.
                </h1>

                <p className="mt-3 max-w-md text-[15px] leading-6 text-slate-500">
                    Pick a unique username so people can easily find you
                    on Picskrypt.
                </p>
            </div>

            <form onSubmit={onSubmit}>
                <div>
                    <label
                        htmlFor="username"
                        className="mb-2.5 block text-sm font-semibold text-slate-800"
                    >
                        Username
                    </label>

                    <div className="group relative">
                        {/* @ prefix */}
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5">
                            <span className="text-base font-semibold text-slate-400 transition-colors group-focus-within:text-primary">
                                @
                            </span>
                        </div>

                        <input
                            id="username"
                            type="text"
                            required
                            maxLength={USERNAME_MAX}
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            value={username}
                            onChange={(e) =>
                                setUsername(
                                    e.target.value
                                        .toLowerCase()
                                        .replace(
                                            /[^a-z0-9_]/g,
                                            "",
                                        ),
                                )
                            }
                            placeholder="yourusername"
                            aria-describedby="username-status"
                            aria-invalid={isError}
                            className={`h-16 w-full rounded-2xl border bg-white pl-11 pr-14 text-[16px] font-medium text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.03)] outline-none transition-all placeholder:text-slate-300 ${
                                isError
                                    ? "border-red-300 focus:border-red-400 focus:ring-4 focus:ring-red-500/10"
                                    : availability === "available"
                                      ? "border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                                      : "border-slate-200 hover:border-slate-300 focus:border-primary focus:ring-4 focus:ring-primary/10"
                            }`}
                        />

                        <div className="pointer-events-none absolute inset-y-0 right-5 flex items-center">
                            {availability === "checking" && (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
                            )}

                            {availability === "available" && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                                    <svg
                                        width="14"
                                        height="14"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M5 12.5L9.5 17L19 7"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-emerald-600"
                                        />
                                    </svg>
                                </div>
                            )}

                            {isError && (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50">
                                    <svg
                                        width="13"
                                        height="13"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path
                                            d="M7 7L17 17M17 7L7 17"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            className="text-red-500"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>

                    <div
                        id="username-status"
                        aria-live="polite"
                        className="mt-3 min-h-5"
                    >
                        {availability === "checking" && (
                            <p className="text-xs font-medium text-slate-400">
                                Checking username availability...
                            </p>
                        )}

                        {availability === "available" && (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                @
                                {username} is available
                            </p>
                        )}

                        {isError && (
                            <p className="text-xs font-medium text-red-500">
                                {hint}
                            </p>
                        )}

                        {availability === "idle" && (
                            <p className="text-xs text-slate-400">
                                3–{USERNAME_MAX} characters · letters,
                                numbers, and underscores
                            </p>
                        )}
                    </div>
                </div>

                {error ? (
                    <div
                        role="alert"
                        className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
                    >
                        {error}
                    </div>
                ) : null}

                <div className="mt-10 flex items-center gap-3">
                    <Link
                        href={stepPath(1)}
                        className="flex h-14 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                    >
                        Back
                    </Link>

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="group flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-lg shadow-slate-950/10 transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:shadow-xl hover:shadow-primary/20 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40 disabled:shadow-none"
                    >
                        <span>
                            {saving ? "Saving..." : "Continue"}
                        </span>

                        {!saving && (
                            <svg
                                width="17"
                                height="17"
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
                </div>

                <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                    Your username will be visible on your Picskrypt profile.
                </p>
            </form>
        </div>
    );
}

