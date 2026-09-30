import { create } from "zustand";
import { persist } from "zustand/middleware";
import { requestMagicLink, getMe, logoutRequest, ApiError } from "@/lib/api";
import { UserStore } from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      loading: false,

      magicEmail: "",
      magicStatus: "idle",
      magicErrorMsg: "",
      magicCooldown: 0,

      setUser: (user) => set({ user }),
      setLoading: (value) => set({ loading: value }),
      resetMagic: () =>
        set({ magicStatus: "idle", magicErrorMsg: "", magicCooldown: 0 }),

      logout: async () => {
        set({ user: null });
        if (typeof window !== "undefined") {
          window.google?.accounts.id.disableAutoSelect();
        }
        try {
          await logoutRequest();
        } catch {}
      },

      hydrateUser: async () => {
        try {
          const user = await getMe();
          set({ user, hydrated: true });
        } catch {
          set({ hydrated: true });
        }
      },

      setMagicEmail: (email) => set({ magicEmail: email }),
      setMagicCooldown: (seconds) => set({ magicCooldown: seconds }),

      sendMagicLink: async (opts) => {
        const cooldownSeconds = opts?.cooldownSeconds ?? 60;
        const toast = opts?.toast;

        const { magicStatus, magicEmail, magicCooldown } = get();
        if (magicStatus === "sending" || magicCooldown > 0) return;

        const clean = magicEmail.trim().toLowerCase();
        if (!EMAIL_RE.test(clean)) {
          set({
            magicErrorMsg: "Please enter a valid email.",
            magicStatus: "error",
          });
          return;
        }

        set({ magicErrorMsg: "", magicStatus: "sending" });

        try {
          await requestMagicLink(clean);

          set({ magicStatus: "sent", magicCooldown: cooldownSeconds });
          toast?.(
            "If an account exists, a login link has been sent.",
            "success",
          );
        } catch (err: any) {
          const rateLimited = err instanceof ApiError && err.status === 429;
          const msg = rateLimited
            ? "Too many requests. Please wait a minute and try again."
            : err instanceof ApiError
              ? err.message
              : "Network error. Please try again.";

          set({
            magicStatus: "error",
            magicErrorMsg: msg,
            ...(rateLimited ? { magicCooldown: cooldownSeconds } : {}),
          });
          toast?.(msg, "error");
        }
      },
    }),
    {
      name: "user-storage",
      partialize: (state) => ({ user: state.user }),
    },
  ),
);
