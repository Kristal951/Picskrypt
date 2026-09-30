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
    const [availability, setAvailability] = useState<Availability>("idle");
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

        const { username: clean, error: localError } = validateUsername(username);
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
                setAvailability(res.available ? "available" : "taken");
                setHint(res.available ? "" : (res.reason ?? "That username is taken."));
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
        (availability === "available" || availability === "idle");

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        const { username: clean, error: localError } = validateUsername(username);
        if (localError) {
            setAvailability("invalid");
            setHint(localError);
            return;
        }

        setSaving(true);
        setError("");
        try {
            const updated = await saveOnboardingStep({ step: 2, username: clean });
            setUser(updated);
            router.push(stepPath(updated.onboardingStep));
        } catch (err: any) {
            const msg = err?.message || "Something went wrong. Please try again.";
            if (err?.status === 409) {
                setAvailability("taken");
                setHint(msg);
            } else {
                setError(msg);
            }
            setSaving(false);
        }
    };

    return (
        <>
            <h1 className="text-xl font-bold text-slate-900">Pick a username</h1>
            <p className="mt-1 text-sm text-slate-600">
                This is how people will find you.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <div>
                    <label
                        htmlFor="username"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Username
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                            @
                        </span>
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
                                    e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                                )
                            }
                            placeholder="username"
                            aria-describedby="username-status"
                            aria-invalid={availability === "taken" || availability === "invalid"}
                            className="w-full rounded-xl border border-slate-300 py-2.5 pl-7 pr-3 text-sm
                         focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                    </div>
                    <p
                        id="username-status"
                        aria-live="polite"
                        className={`mt-1 min-h-5 text-xs ${availability === "available"
                                ? "text-emerald-600"
                                : availability === "taken" || availability === "invalid"
                                    ? "text-red-600"
                                    : "text-slate-500"
                            }`}
                    >
                        {availability === "checking" && "Checking..."}
                        {availability === "available" && "Available"}
                        {(availability === "taken" || availability === "invalid") && hint}
                        {availability === "idle" &&
                            "3 to 20 characters: letters, numbers, underscores."}
                    </p>
                </div>

                {error ? (
                    <p role="alert" className="text-sm text-red-600">
                        {error}
                    </p>
                ) : null}

                <div className="flex gap-3">
                    <Link
                        href={stepPath(1)}
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                        Back
                    </Link>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 rounded-xl bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white
                       hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {saving ? "Saving..." : "Continue"}
                    </button>
                </div>
            </form>
        </>
    );
}