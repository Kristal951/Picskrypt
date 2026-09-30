"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  ArrowRight,
  Camera,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { getMe } from "@/lib/api";
import GoogleSignInButton from "@/components/google/GoogleSignInButton";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SECONDS = 60;

const Register = () => {
  const router = useRouter();

  const email = useUserStore((s) => s.magicEmail);
  const status = useUserStore((s) => s.magicStatus);
  const errorMsg = useUserStore((s) => s.magicErrorMsg);
  const cooldown = useUserStore((s) => s.magicCooldown);
  const setEmail = useUserStore((s) => s.setMagicEmail);
  const setCooldown = useUserStore((s) => s.setMagicCooldown);
  const sendMagicLink = useUserStore((s) => s.sendMagicLink);
  const resetMagic = useUserStore((s) => s.resetMagic);

  const [googleError, setGoogleError] = useState("");

  const emailValid = useMemo(() => EMAIL_RE.test(email.trim()), [email]);

  useEffect(() => {
    resetMagic();
  }, [resetMagic]);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((user) => {
        if (user && !cancelled) router.replace("/");
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown, setCooldown]);

  const sendLink = () => sendMagicLink({ cooldownSeconds: COOLDOWN_SECONDS });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailValid || status === "sending") return;
    sendLink();
  };

  const usernamePreview = useMemo(() => {
    const clean = email.trim();
    if (!clean.includes("@")) return "";
    return clean.split("@")[0];
  }, [email]);

  const progress = useMemo(() => {
    if (status !== "sent") return 0;
    return ((COOLDOWN_SECONDS - cooldown) / COOLDOWN_SECONDS) * 100;
  }, [status, cooldown]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex font-sans selection:bg-primary/20">
      <aside className="hidden lg:flex w-[48%] relative overflow-hidden bg-slate-950">
        <Image
          src="https://images.unsplash.com/photo-1492691523567-6170c24e5fb9?auto=format&fit=crop&q=80&w=1200"
          alt="Photography Background"
          fill
          sizes="48vw"
          className="object-cover opacity-40 scale-105"
        />
        <div className="absolute inset-0 bg-linear-to-br from-indigo-500/20 via-transparent to-slate-950" />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/40 to-transparent" />

        <div className="relative z-10 p-16 flex flex-col justify-between h-full w-full">
          <Link href="/" className="group flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 group-hover:bg-white/20 transition-all shadow-2xl">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl tracking-tighter text-white italic">
              PicsKrypt
            </span>
          </Link>

          <div className="max-w-md space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-100">
                Creators First Platform
              </span>
            </div>

            <h1 className="text-7xl text-white leading-[0.85] tracking-tighter">
              Capture the <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-cyan-400">
                Unseen.
              </span>
            </h1>

            <p className="text-slate-300 text-xl leading-relaxed font-medium opacity-90">
              Your vision deserves a sanctuary. Join the most secure gallery for
              modern visual storytellers.
            </p>
          </div>

          <footer className="flex items-center gap-8 text-[10px] text-slate-500 uppercase tracking-widest">
            <span className="text-slate-400">© 2026 PicsKrypt</span>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors"
            >
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms
            </Link>
          </footer>
        </div>
      </aside>

      {/* --- Right: Form Side --- */}
      <main className="flex-1 flex items-center justify-center p-6 md:p-16">
        <div className="w-full max-w-110 space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="text-center lg:text-left">
            <h2 className="text-5xl text-primary mb-2">
              {status === "sent" ? "Check Email" : "Join Us"}
            </h2>
            <p className="text-slate-500 text-lg">
              {status === "sent"
                ? "We've sent a magic link to your inbox."
                : "No passwords. Just your creative spark."}
            </p>
          </div>

          {status !== "sent" ? (
            <form onSubmit={onSubmit} className="space-y-6">
              <GoogleSignInButton redirectTo="/" onError={setGoogleError} />
              {googleError ? (
                <p
                  role="alert"
                  className="text-center text-xs uppercase tracking-wider text-red-500"
                >
                  {googleError}
                </p>
              ) : null}

              <div className="relative flex items-center justify-center">
                <div className="w-full border-t border-slate-100" />
                <span className="absolute bg-white px-6 text-[10px] text-slate-400 uppercase tracking-[0.3em]">
                  or
                </span>
              </div>
              <div className="space-y-3">
                <div className="relative group">
                  <Mail
                    className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 transition-all ${emailValid ? "text-indigo-600" : "text-slate-400"}`}
                  />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    aria-label="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full py-4 pl-14 pr-6 rounded-md bg-slate-100 focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none font-bold text-slate-900 placeholder:text-slate-400"
                  />
                </div>
                {status === "error" && errorMsg && (
                  <div
                    role="alert"
                    className="flex items-center gap-2 px-2 text-red-500"
                  >
                    <div className="h-1 w-1 rounded-full bg-red-500" />
                    <p className="text-xs uppercase tracking-wider">
                      {errorMsg}
                    </p>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!emailValid || status === "sending" || cooldown > 0}
                className="w-full py-3 px-2 bg-primary text-white rounded-md text-lg shadow-2xl shadow-slate-900/20 hover:bg-primary hover:shadow-indigo-600/30 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 group"
              >
                {status === "sending" ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : cooldown > 0 ? (
                  <>Try again in {cooldown}s</>
                ) : (
                  <>
                    Send Link
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="relative p-0.5 bg-linear-to-b from-indigo-500 to-accent rounded-[40px] shadow-2xl shadow-indigo-500/20 animate-in zoom-in-95 duration-500">
              <div className="bg-white rounded-[38px] p-10 text-center">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 rotate-3 hover:rotate-0 transition-transform duration-500">
                  <CheckCircle2 className="w-10 h-10 text-indigo-600" />
                </div>

                <h3 className="text-2xl text-slate-900 mb-3 tracking-tight">
                  Hi {usernamePreview || "there"}!
                </h3>
                <p className="text-slate-500 font-bold leading-relaxed mb-8">
                  We've sent a secure link to{" "}
                  <span className="text-indigo-600">{email}</span>. Click it to
                  unlock your gallery.
                </p>

                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-8">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400">
                      Resend available in
                    </span>
                    <span className="text-xs text-indigo-600">
                      {cooldown > 0 ? `${cooldown}s` : "Now"}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={sendLink}
                    disabled={cooldown > 0}
                    className="w-full py-4 rounded-2xl bg-accent text-white text-sm hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend Magic Link
                  </button>
                  <button
                    type="button"
                    onClick={resetMagic}
                    className="text-xs text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    Use different email
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 text-center space-y-4">
            <p className="text-slate-400 text-sm">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-indigo-600">
                Terms
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-indigo-600">
                Privacy Policy
              </Link>
              .
            </p>
            {/* <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5" />
              Passwordless secure sign-in
            </div> */}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;