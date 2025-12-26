"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MotionDiv } from "@/app/ui/motion";

const BRAND = "#fcb040";

type QueueResult = {
  email: string;
  role: "consumer" | "vendor";
  review_status: "pending" | "reviewed" | "approved" | "rejected";
  position: number | null;
  score: number;
  created_at: string;
  referral_code?: string | null;
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
  const supabase = useMemo(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, anon);
  }, []);

  const [step, setStep] = useState<"email" | "otp" | "result">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<QueueResult | null>(null);

  const [toast, setToast] = useState<string>("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  const sendOtp = async () => {
    setErr("");
    const e = email.trim().toLowerCase();
    if (!e) return setErr("Please enter your email.");

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: e,
        options: {
          // keeps redirect sane if Supabase includes it
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin + "/queue" : undefined,
        },
      });
      if (error) throw error;

      setStep("otp");
      setToast("Code sent ✉️");
    } catch (e: any) {
      setErr(e?.message || "Failed to send code.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setErr("");
    const e = email.trim().toLowerCase();
    const code = otp.trim();

    if (!e) return setErr("Missing email.");
    if (!code) return setErr("Enter the 6-digit code.");
    if (code.length < 6) return setErr("Code should be 6 digits.");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: e,
        token: code,
        type: "email",
      });
      if (error) throw error;

      const accessToken = data?.session?.access_token;
      if (!accessToken) throw new Error("Login failed. Please request a new code.");

      const res = await fetch("/api/queue-status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to fetch queue status.");

      setResult(payload as QueueResult);
      setStep("result");
      setToast("Welcome 👋");
    } catch (e: any) {
      setErr(e?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setErr("");
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data?.session?.access_token;
      if (!accessToken) throw new Error("You’re not logged in. Please request a new code.");

      const res = await fetch("/api/queue-status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to refresh.");

      setResult(payload as QueueResult);
      setToast("Updated ✅");
    } catch (e: any) {
      setErr(e?.message || "Failed to refresh.");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setErr("");
    setLoading(true);
    try {
      await supabase.auth.signOut();
      setResult(null);
      setOtp("");
      setStep("email");
      setToast("Signed out");
    } finally {
      setLoading(false);
    }
  };

  const referralLink = (() => {
    if (!result?.referral_code) return "";
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/join?ref=${encodeURIComponent(result.referral_code)}`; // ✅ role chooser
  })();

  const copyReferral = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setToast("Referral link copied ✨");
    } catch {
      setToast("Copy failed — please copy manually");
    }
  };

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
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
        >
          <h1 className="text-xl font-extrabold tracking-tight font-heading">Check your queue status</h1>
          <p className="mt-2 text-sm text-black/60">
            Enter your email. We’ll send a <span className="font-semibold">6‑digit code</span> so you can view your
            current status and position.
          </p>

          {err ? (
            <MotionDiv
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm text-black"
            >
              {err}
            </MotionDiv>
          ) : null}

          {step === "email" ? (
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

              <button className={buttonBase} onClick={sendOtp} disabled={loading}>
                {loading ? "Sending…" : "Send 6‑digit code"}
              </button>
            </div>
          ) : null}

          {step === "otp" ? (
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-black/10 bg-black/5 p-3 text-sm">
                Code sent to <span className="font-semibold">{email.trim().toLowerCase()}</span>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">6-digit code</label>
                <input
                  className={inputBase}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <button className={buttonBase} onClick={verifyOtp} disabled={loading}>
                {loading ? "Verifying…" : "Verify & view status"}
              </button>

              <button
                className={subtleButton}
                onClick={() => {
                  setOtp("");
                  setStep("email");
                }}
                disabled={loading}
              >
                Use a different email
              </button>
            </div>
          ) : null}

          {step === "result" && result ? (
            <MotionDiv
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
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
                    {result.position ? (
                      <span className="font-extrabold">#{result.position}</span>
                    ) : (
                      <span className="text-black/60">Not available</span>
                    )}
                  </div>

                  <div>
                    <span className="font-semibold">
                      {result.role === "consumer" ? "Referral points" : "Vendor score"}:
                    </span>{" "}
                    <span className="font-extrabold">{result.score}</span>
                  </div>

                  <div className="text-xs text-black/50">Joined: {new Date(result.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* ✅ Referral link + copy */}
              {result.referral_code ? (
                <div className="rounded-3xl border border-black/10 bg-white p-4">
                  <div className="text-sm font-extrabold">Your referral link</div>
                  <p className="mt-1 text-xs text-black/60">
                    Share this link — your friend will choose Consumer or Vendor, and you’ll get credit.
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input className={inputBase} value={referralLink} readOnly />
                    <button
                      type="button"
                      onClick={copyReferral}
                      className="rounded-2xl bg-black px-5 py-3 font-extrabold text-white transition hover:opacity-95"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button className={buttonBase} onClick={refresh} disabled={loading}>
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
                <button className={subtleButton} onClick={signOut} disabled={loading}>
                  Sign out
                </button>
              </div>
            </MotionDiv>
          ) : null}
        </MotionDiv>

        {/* ✅ Toast / popup */}
        {toast ? (
          <MotionDiv
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold shadow-lg"
          >
            {toast}
          </MotionDiv>
        ) : null}
      </div>
    </main>
  );
}
