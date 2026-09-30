"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useGoogleSignIn } from "@/hooks/useGoogleSignIn";
import { getGoogleNonce } from "@/lib/api";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleSignInButton({
    redirectTo = "/",
    onError,
}: {
    redirectTo?: string;
    onError?: (message: string) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const signIn = useGoogleSignIn({ redirectTo, onError });

    useEffect(() => {
        const gsi = window.google?.accounts.id;
        const el = ref.current;
        if (!scriptReady || !gsi || !el || !CLIENT_ID) return;

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
                client_id: CLIENT_ID,
                nonce,
                callback: (res) => {
                    void signIn(res.credential);
                },
                itp_support: true,
                use_fedcm_for_button: true,
            });

            el.innerHTML = "";
            gsi.renderButton(el, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                logo_alignment: "left",
                width: Math.min(400, Math.max(200, el.clientWidth || 320)),
            });
        })();

        return () => {
            cancelled = true;
        };
    }, [scriptReady, signIn]);

    if (!CLIENT_ID) return null;

    return (
        <>
            <Script
                id="google-gsi"
                src="https://accounts.google.com/gsi/client"
                strategy="afterInteractive"
                onReady={() => setScriptReady(true)}
            />
            <div ref={ref} className="flex min-h-11 w-full justify-center" />
        </>
    );
}