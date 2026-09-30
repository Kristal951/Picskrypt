"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { useUserStore } from "@/store/userStore";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { getGoogleNonce } from "@/lib/api";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleOneTap() {
    const user = useUserStore((s) => s.user);
    const hydrated = useUserStore((s) => s.hydrated);
    const [scriptReady, setScriptReady] = useState(false);

    const signIn = useGoogleSignIn({ onError: (m) => console.error(m) });
    const shouldPrompt = !!CLIENT_ID && scriptReady && hydrated && !user;

    useEffect(() => {
        if (!shouldPrompt) return;
        const gsi = window.google?.accounts.id;
        if (!gsi) return;

        let cancelled = false;

        (async () => {
            let nonce: string;
            try {
                nonce = await getGoogleNonce();
            } catch {
                return;
            }
            if (cancelled) return;

            gsi.initialize({
                client_id: CLIENT_ID!,
                nonce,
                callback: (res) => {
                    void signIn(res.credential);
                },
                cancel_on_tap_outside: false,
                context: "signin",
                itp_support: true,
                use_fedcm_for_prompt: true,
            });
            gsi.prompt();
        })();

        return () => {
            cancelled = true;
            gsi.cancel();
        };
    }, [shouldPrompt, signIn]);

    if (!CLIENT_ID) return null;

    return (
        <Script
            id="google-gsi"
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onReady={() => setScriptReady(true)}
        />
    );
}