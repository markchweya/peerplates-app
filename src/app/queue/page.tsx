// src/app/queue/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

function formatStatus(s: QueueResult["review_status"]) {
  if (s === "approved") return "Approved ✅";
  if (s === "rejected") return "Rejected ❌";
  if (s === "reviewed") return "Reviewed 🔎";
  return "Pending ⏳";
}

const inputBase =
  "h-12 w-full rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold text-black outline-none " +
  "focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]";

const buttonBase =
  "w-full rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-black transition " +
  "hover:opacity-95 hover:-translate-y-[1px] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

const subtleButton =
  "w-full rounded-2xl border border-black/10 bg-white px-6 py-3 text-center font-extrabold text-black hover:bg-black/5 transition";

export default function QueuePage() {
  const sp = useSearchParams();
  const codeFromUrl = (sp.get("code") || "").trim();

  const [code, setCode] = useState(codeFromUrl);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<QueueResult | null>(null);

  const fetchStatus = async (queueCode: string) => {
    setErr("");
    setLoading(true);
    setResult(null);

    try {
      const cleaned = queueCode.trim();
      if (!cleaned) throw new Error("Please enter your queue code.");

      const res = await fetch(`/api/queue-status?code=${encodeURIComponent(cleaned)}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to fetch queue status.");
      setResult(payload as QueueResult);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch status.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load if link had ?code=
  useEffect(() => {
    const c = (codeFromUrl || "").trim();
    if (c) fetchStatus(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  const copyReferral = async () => {
    if (!result?.referral_link) return;
    try {
      await navigator.clipboard.writeText(result.referral_link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setErr("Copy failed. Please copy manually.");
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
            Paste your queue code (from email) to view your current status and position.
          </p>

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

          {!result ? (
            <div className="mt-5 grid gap-3">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Queue code</label>
                <input
                  className={inputBase}
                  placeholder="e.g. 7H2K9QX1AB"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <button className={buttonBase} onClick={() => fetchStatus(code)} disabled={loading || !code.trim()}>
                {loading ? "Loading…" : "View status"}
              </button>

              <div className="text-xs text-black/50">
                Don’t have your code? Check the email you received after submitting the waitlist form.
              </div>
            </div>
          ) : (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
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

              {/* Referral link + copy */}
              {result.referral_link ? (
                <MotionDiv
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05 }}
                  className="rounded-3xl border border-black/10 bg-white p-4"
                >
                  <div className="text-sm font-extrabold">Your referral link</div>
                  <div className="mt-2 grid gap-2">
                    <div className="flex items-center gap-2">
                      <input className={inputBase} value={result.referral_link} readOnly />
                      <button
                        type="button"
                        onClick={copyReferral}
                        className="shrink-0 rounded-2xl border border-black/10 bg-white px-4 py-3 font-extrabold hover:bg-black/5 transition"
                      >
                        {copied ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div className="text-xs text-black/50">
                      This link goes to <span className="font-semibold">/join</span> so they choose Vendor or Consumer first.
                    </div>
                  </div>
                </MotionDiv>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button className={buttonBase} onClick={() => fetchStatus(code)} disabled={loading}>
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
                <button
                  className={subtleButton}
                  onClick={() => {
                    setResult(null);
                    setErr("");
                  }}
                  disabled={loading}
                >
                  Check another code
                </button>
              </div>
            </MotionDiv>
          )}
        </MotionDiv>
      </div>
    </main>
  );
}
