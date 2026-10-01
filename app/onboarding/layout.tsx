
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { getMe } from "@/lib/api";
import { stepFromPath, stepPath } from "@/lib/onboarding";
import Spinner from "@/components/ui/Spinner";
import Image from "next/image";

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

                if (fresh) {
                    setUser(fresh);
                } else {
                    router.replace("/auth");
                }
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) {
                    setReady(true);
                }
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
            <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6">
                <div className="text-center">
                    {!ready || user ? (
                        <Spinner />
                    ) : (
                        <p className="text-sm text-slate-600">
                            We couldn&apos;t load your profile.{" "}
                            <Link
                                href="/auth"
                                className="font-medium text-[#6c3fc5] underline underline-offset-4"
                            >
                                Sign in again
                            </Link>
                        </p>
                    )}
                </div>
            </main>
        );
    }

    const current = requested ?? 1;

    return (
        <main className="h-screen bg-background w-full">
            <section className="relative flex min-h-screen flex-col bg-white">
                <header className="flex items-center justify-between px-6 py-6 lg:hidden">
                    <div className="relative w-32 h-8 md:w-40 md:h-10">
                        <Image
                            src="/assets/PicsKrypt_2.png"
                            alt="PicsKrypt"
                            fill
                            priority
                            className="object-contain"
                            sizes="(max-width: 768px) 128px, 160px"
                        />
                    </div>

                    <span className="text-xs font-medium text-slate-400">
                        {current} / {LABELS.length}
                    </span>
                </header>

                <div className="px-6 py-6">
                    <div className="hidden items-center justify-between lg:flex">
                        <div className="relative w-32 h-8 md:w-40 md:h-10">
                            <Image
                                src="/assets/PicsKrypt_2.png"
                                alt="PicsKrypt"
                                fill
                                priority
                                className="object-contain"
                                sizes="(max-width: 768px) 128px, 160px"
                            />
                        </div>
                        <span className="text-xs font-medium text-slate-400">
                            {String(current).padStart(2, "0")} /{" "}
                            {String(LABELS.length).padStart(2, "0")}
                        </span>
                    </div>

                    <div className="mt-4 md:mt-8 flex gap-3">
                        {LABELS.map((label, i) => {
                            const n = i + 1;

                            return (
                                <div
                                    key={label}
                                    className="flex-1"
                                    aria-current={
                                        n === current ? "step" : undefined
                                    }
                                >
                                    <div
                                        className={`h-1 rounded-full transition-colors ${n <= current
                                                ? "bg-[#6c3fc5]"
                                                : "bg-slate-200"
                                            }`}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-6 py-12 sm:px-10 lg:px-16 lg:py-16 xl:px-24">
                    <div className="w-full max-w-xl">{children}</div>
                </div>

            </section>
        </main>
    );
}
