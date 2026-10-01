"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Shield,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { useUserStore } from "@/store/userStore";
import { stepPath } from "@/lib/onboarding";

export default function MagicLinkContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser)

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const id = searchParams.get("id");
    const token = searchParams.get("token");

    if (!id || !token) {
      setStatus("error");
      setErrorMsg("The security token is missing or has expired.");
      return;
    }

    const verifyLink = async () => {
      try {
        const res = await fetch("/api/auth/magic/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, token }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "This link is no longer valid.");
        }

        setStatus("success");
        setUser(data.user);
        setTimeout(() => {
         router.replace(data.user.onboarded ? "/" : stepPath(data.user.onboardingStep));
        }, 2000);
      } catch (err: any) {
        setStatus("error");
        setErrorMsg(err.message);
      }
    };

    verifyLink();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen w-full bg-white flex flex-col">
      <header className="p-8 lg:p-12 w-full flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-700">
        <Link href="/" className="group flex items-center gap-3">
          <img
            src="/assets/Picskrypt_2.png"
            alt="PicsKrypt"
            className="h-8 md:h-10 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity"
          />
        </Link>

        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full border border-slate-100 bg-slate-50/50">
          <Shield className="w-4 h-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Secure Verification
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 -mt-20">
        <div className="w-full max-w-110">
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-indigo-500 to-cyan-500 rounded-[42px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>

            <div className="relative bg-white rounded-[40px] border border-slate-100 shadow-xl p-10 md:p-12">
              {status === "verifying" && (
                <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                  <div className="flex justify-center">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-3xl bg-indigo-500/10 animate-pulse" />
                      <Spinner size={30} stroke={3} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      Authenticating
                    </h2>
                    <p className="text-slate-500 font-bold text-sm leading-relaxed">
                      We're validating your secure token. <br />
                      This will only take a moment.
                    </p>
                  </div>
                </div>
              )}

              {status === "success" && (
                <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 bg-emerald-50 rounded-[28px] flex items-center justify-center border border-emerald-100 shadow-[inset_0_0_12px_rgba(16,185,129,0.1)]">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      Access Granted
                    </h2>
                    <p className="text-slate-500 font-bold text-sm">
                      Verification successful. Welcome to PicsKrypt.
                    </p>
                  </div>

                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-4">
                    <div className="h-full bg-emerald-500 transition-all duration-2000 ease-out w-full" />
                  </div>
                </div>
              )}

              {status === "error" && (
                <div className="text-center space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-center">
                    <div className="h-20 w-20 bg-red-50 rounded-[28px] flex items-center justify-center border border-red-100">
                      <AlertCircle className="w-10 h-10 text-red-500" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      Link Expired
                    </h2>
                    <p className="text-slate-500 font-bold text-sm px-2 leading-relaxed">
                      {errorMsg}. Magic links can only be used once and expire
                      after 15 minutes.
                    </p>
                  </div>

                  <div className="pt-4 flex flex-col gap-3">
                    <Link
                      href="/auth"
                      className="w-full h-14 bg-slate-950 text-white rounded-[20px] font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-lg shadow-slate-200"
                    >
                      Resend Magic Link
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/"
                      className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                    >
                      Continue as guest
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="p-12 hidden lg:flex justify-end animate-in fade-in duration-1000">
        <div className="flex gap-4 items-center">
          <span className="h-px w-12 bg-slate-100" />
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">
            End-to-End <br /> Encryption
          </span>
        </div>
      </footer>
    </div>
  );
}
