"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { googleSignIn } from "@/lib/api";
import { useUserStore } from "@/store/userStore";
import { stepPath } from "@/lib/onboarding";

interface Options {
  redirectTo?: string;
  onError?: (message: string) => void;
}

export function useGoogleSignIn(options: Options = {}) {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const busy = useRef(false);
  const latest = useRef(options);

  useEffect(() => {
    latest.current = options;
  });

  return useCallback(
    async (credential: string) => {
      if (busy.current) return;
      busy.current = true;

      try {
        const user = await googleSignIn(credential);
        setUser(user);

        if (!user.onboarded) {
          router.replace(stepPath(user.onboardingStep));
        } else if (latest.current.redirectTo) {
          router.replace(latest.current.redirectTo);
        } else {
          router.refresh();
        }
      } catch (err: any) {
        latest.current.onError?.(
          err?.message || "Google sign-in failed. Please try again.",
        );
      } finally {
        busy.current = false;
      }
    },
    [router, setUser],
  );
}
