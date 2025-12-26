// src/app/queue/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { MotionDiv } from "@/app/ui/motion";

const BRAND = "#fcb040";

type QueueResult = {
  email: string;
  role: "consumer" | "vendor";
  review_status: "pending" | "reviewed" | "approved" | "rejected";
  position: number | null;
  score: number;
  created_at: string;
  referral_code: string | null;
  referral_link: string | null;
};

const inputBase =
  "h-12 w-full rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold text-black outline-none " +
  "focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]";

const buttonBase =
  "w-full rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-black transition hover:opacity-95 hover:-translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed";

const subtleButton =
  "w-full rounded-2xl border border-black/10 bg-white px-6 py-3 text-center font-extrabold text-black hover:bg-black/5 transition";

function formatStatus(s: QueueResult["review_status"]) {
  if (s === "approved") return "Approved ✅";
  if (s === "rejected") return "Rejected ❌";
  if (s === "reviewed") return "Reviewed 🔎";
  return "Pending ⏳";
}

export default function QueuePage() {
  // ✅ Prevent Vercel prerender crash: never create Supabase client on the server.
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return; // will show a nice error below
    setSupabase(createClient(url, anon));
  }, []);

  const [step, setStep] = useState<"verify" | "result">("verify");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState("");
  const [result, setResult] = useState<QueueResult | null>(null);

  const canUseSupabase = !!supabase;

  const sendOtp = async () => {
    setErr("");
    setToast("");

    const e = email.trim().toLowerCase();
    if (!e) return setErr("Please enter your email.");
    if (!supabase) return setErr("Supabase env vars missing on this deployment (check Vercel env).");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/queue" : undefined,
        },
      });
      if (error) throw error;
      setToast("Email sent. Use the 6‑digit code or click the link.");
    } catch (e: any) {
      setErr(e?.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setErr("");
    setToast("");

    const e = email.trim().toLowerCase();
    const code = otp.trim();
    if (!e) return setErr("Enter your email.");
    if (!code) return setErr("Enter the 6‑digit code from the email.");
    if (!supabase) return setErr("Supabase env vars missing on this deployment (check Vercel env).");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: e,
        token: code,
        type: "email",
      });
      if (error) throw error;

      const accessToken = data?.session?.access_token;
      if (!accessToken) throw new Error("Login failed. Request a new code and try again.");

      const res = await fetch("/api/queue-status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to fetch queue status.");

      setResult(payload as QueueResult);
      setStep("result");
    } catch (e: any) {
      setErr(e?.message || "Invalid/expired code. Request a new one.");
    } finally {
      setLoading(false);
    }
  };

  const copyReferral = async () => {
    if (!result?.referral_link) return;
    try {
      await navigator.clipboard.writeText(result.referral_link);
      setToast("Referral link copied!");
      setTimeout(() => setToast(""), 2000);
    } catch {
      setErr("Could not copy. Try manually selecting the link.");
    }
  };

  const signOut = async () => {
    setErr("");
    setToast("");
    setLoading(true);
    try {
      await supabase?.auth.signOut();
      setResult(null);
      setOtp("");
      setStep("verify");
    } finally {
      setLoading(false);
    }
  };

  // If env vars missing, show a helpful message instead of crashing build/runtime
  const envMissing = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    return !url || !anon;
  }, []);

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-between gap-4"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl" style={{ background: BRAND }} />
            <div className="text-lg font-semibold tracking-tight">PeerPlates</div>
          </Link>
          <div className="text-sm text-black/60 whitespace-nowrap">Queue</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.06 }}
          className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
        >
          <h1 className="text-xl font-extrabold tracking-tight font-heading">Check your queue status</h1>
          <p className="mt-2 text-sm text-black/60">
            Enter your email and the 6‑digit code from the email. You can also request a new code.
          </p>

          {envMissing ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm">
              Missing <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span> or{" "}
              <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> in Vercel environment variables.
            </div>
          ) : null}

          {err ? (
            <MotionDiv
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm text-black"
            >
              {err}
            </MotionDiv>
          ) : null}

          {toast ? (
            <MotionDiv
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-[#fcb040] bg-white p-3 text-sm font-semibold"
            >
              {toast}
            </MotionDiv>
          ) : null}

          {step === "verify" ? (
            <div className="mt-5 grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Email</label>
                <input
                  className={inputBase}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  inputMode="email"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">6‑digit code</label>
                <input
                  className={inputBase}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button className={buttonBase} onClick={verify} disabled={loading || !canUseSupabase}>
                  {loading ? "Verifying…" : "Verify"}
                </button>
                <button className={subtleButton} onClick={sendOtp} disabled={loading || !canUseSupabase}>
                  {loading ? "Sending…" : "Send new code"}
                </button>
              </div>

              <div className="text-xs text-black/50">
                Tip: you can either click the email button (magic link) or type the code here.
              </div>
            </div>
          ) : null}

          {step === "result" && result ? (
            <MotionDiv
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 grid gap-3"
            >
              <div className="rounded-3xl border border-[#fcb040] bg-white p-4">
                <div className="text-sm font-extrabold">Your status</div>

                <div className="mt-2 grid gap-2 text-sm text-black/80">
                  <div>
                    <span className="font-semibold">Email:</span> {result.email}
                  </div>
                  <div>
                    <span className="font-semibold">Role:</span> {result.role}
                  </div>
                  <div>
                    <span className="font-semibold">Status:</span> {formatStatus(result.review_status)}
                  </div>

                  <div>
                    <span className="font-semibold">Queue position:</span>{" "}
                    {result.position ? <span className="font-extrabold">#{result.position}</span> : <span className="text-black/60">Not available</span>}
                  </div>

                  <div>
                    <span className="font-semibold">{result.role === "consumer" ? "Referral points" : "Vendor score"}:</span>{" "}
                    <span className="font-extrabold">{result.score}</span>
                  </div>

                  <div className="text-xs text-black/50">Joined: {new Date(result.created_at).toLocaleString()}</div>
                </div>
              </div>

              {result.referral_link ? (
                <div className="rounded-3xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-extrabold">Your referral link</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input className={inputBase} value={result.referral_link} readOnly />
                    <button
                      className="shrink-0 rounded-2xl border border-black/10 bg-white px-4 py-3 font-extrabold transition hover:bg-black/5"
                      onClick={copyReferral}
                      type="button"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="mt-2 text-xs text-black/50">
                    This goes to <span className="font-mono">/join?ref=...</span> (role chooser), not consumer-only.
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button className={buttonBase} onClick={signOut} disabled={loading}>
                  {loading ? "Signing out…" : "Sign out"}
                </button>
                <Link href="/join" className={subtleButton}>
                  Share join page
                </Link>
              </div>
            </MotionDiv>
          ) : null}
        </MotionDiv>
      </div>
    </main>
  );
}
