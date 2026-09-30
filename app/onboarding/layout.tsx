"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { getMe } from "@/lib/api";
import { stepFromPath, stepPath } from "@/lib/onboarding";
import Spinner from "@/components/ui/Spinner";

const LABELS = ["Name", "Username", "Photo"];

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const user = useUserStore((s) => s.user);
    const setUser = useUserStore((s) => s.setUser);
    const [ready, setReady] = useState(false);

    const requested = stepFromPath(pathname);

    useEffect(() => {
        let cancelled = false;
        getMe()
            .then((fresh) => {
                if (cancelled) return;
                if (fresh) setUser(fresh);
                else router.replace("/auth");
            })
            .catch(() => {
            })
            .finally(() => {
                if (!cancelled) setReady(true);
            });
        return () => {
            cancelled = true;
        };
    }, [router, setUser]);

    useEffect(() => {
        if (!ready || !user) return;
        if (user.onboarded) {
            router.replace("/");
            return;
        }
        if (requested === null || requested > user.onboardingStep) {
            router.replace(stepPath(user.onboardingStep));
        }
    }, [ready, user, requested, router]);

    const allowed =
        ready &&
        !!user &&
        !user.onboarded &&
        requested !== null &&
        requested <= user.onboardingStep;

    if (!allowed) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
                <p className="text-sm text-slate-600">
                    {ready && !user ? (
                        <>
                            We couldn&apos;t load your profile.{" "}
                            <Link href="/auth" className="underline">
                                Sign in again
                            </Link>
                        </>
                    ) : (
                        <Spinner/>
                    )}
                </p>
            </main>
        );
    }

    const current = requested ?? 1;

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <ol className="mb-6 flex items-start gap-2" aria-label="Progress">
                    {LABELS.map((label, i) => {
                        const n = i + 1;
                        return (
                            <li
                                key={label}
                                className="flex-1"
                                aria-current={n === current ? "step" : undefined}
                            >
                                <div
                                    className={`h-1.5 rounded-full ${n <= current ? "bg-indigo-600" : "bg-slate-200"
                                        }`}
                                />
                                <span
                                    className={`mt-1.5 flex items-center gap-1 text-[11px] font-medium ${n === current ? "text-indigo-700" : "text-slate-400"
                                        }`}
                                >
                                    {n < current ? <Check className="w-3 h-3" /> : null}
                                    {label}
                                </span>
                            </li>
                        );
                    })}
                </ol>

                {children}
            </div>
        </main>
    );
}