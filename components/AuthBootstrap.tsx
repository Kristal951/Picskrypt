"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { stepPath } from "@/lib/onboarding";

export default function AuthBootstrap() {
    const router = useRouter();
    const pathname = usePathname();
    const user = useUserStore((s) => s.user);
    const hydrateUser = useUserStore((s) => s.hydrateUser);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        hydrateUser().finally(() => setReady(true));
    }, [hydrateUser]);

    useEffect(() => {
        if (!ready || !user || user.onboarded) return;
        if (pathname.startsWith("/onboarding") || pathname.startsWith("/auth/")) {
            return;
        }
        router.replace(stepPath(user.onboardingStep));
    }, [ready, user, pathname, router]);

    return null;
}