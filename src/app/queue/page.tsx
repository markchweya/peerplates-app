"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  "w-full rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-black transition hover:opacity-95 hover:-translate-y-[1px] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

const subtleButton =
  "w-full rounded-2xl border border-black/10 bg-white px-6 py-3 text-center font-extrabold text-black hover:bg-black/5 transition";

function onlyDigits(v: string) {
  return v.replace(/\D/g, "").slice(0, 6);
}

function normalizeQueueCode(v: string) {
  // allow A-Z 0-9, strip spaces/symbols, uppercase
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

export default function QueuePage() {
  const sp = useSearchParams();
  const codeFromUrl = (sp.get("code") || "").trim();

  const [mode, setMode] = useState<"code" | "otp">("code");

  const [code, setCode] = useState(codeFromUrl);
  const [otp, setOtp] = useState(""); // 6 digits

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<QueueResult | null>(null);

  // If you still rely on these envs elsewhere, keep the warning.
  const envMissing = false;

  const inFlight = useRef(false);

  const fetchStatus = async (raw: string) => {
    const queueCode = normalizeQueueCode(raw);
    if (!queueCode || queueCode.length < 6) {
      setErr("Please enter a valid code.");
      return;
    }

    if (inFlight.current) return;
    inFlight.current = true;

    setErr("");
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/queue-status?code=${encodeURIComponent(queueCode)}`);
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to fetch queue status.");
      setResult(payload as QueueResult);
    } catch (e: any) {
      setErr(e?.message || "Failed to fetch status.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  };

  // Auto-load if link had ?code=
  useEffect(() => {
    const c = normalizeQueueCode(codeFromUrl);
    if (c) {
      setMode("code");
      setCode(c);
      fetchStatus(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeFromUrl]);

  // ✅ Auto-submit OTP the instant it becomes 6 digits
  useEffect(() => {
    if (mode !== "otp") return;
    if (otp.length === 6) {
      fetchStatus(otp); // treat OTP as code input (server accepts A-Z0-9; digits are fine)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, mode]);

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

  const reset = () => {
    setResult(null);
    setErr("");
    setLoading(false);
    inFlight.current = false;
  };

  const otpBoxes = useMemo(() => {
    const digits = otp.padEnd(6, " ").split("").slice(0, 6);
    return digits;
  }, [otp]);

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
            Enter your <span className="font-semibold">queue code</span> or your <span className="font-semibold">6-digit OTP</span>. We’ll auto-check when OTP is complete.
          </p>

          {envMissing ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm">
              Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel env vars.
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

          {!result ? (
            <div className="mt-5 grid gap-4">
              {/* Mode toggle */}
              <div className="grid grid-cols-2 gap-2 rounded-2xl border border-black/10 bg-white p-2">
                <button
                  type="button"
                  onClick={() => setMode("code")}
                  className={[
                    "rounded-2xl px-4 py-2.5 font-extrabold transition",
                    mode === "code" ? "bg-[#fcb040] text-black" : "bg-white hover:bg-black/5",
                  ].join(" ")}
                >
                  Queue code
                </button>
                <button
                  type="button"
                  onClick={() => setMode("otp")}
                  className={[
                    "rounded-2xl px-4 py-2.5 font-extrabold transition",
                    mode === "otp" ? "bg-[#fcb040] text-black" : "bg-white hover:bg-black/5",
                  ].join(" ")}
                >
                  6-digit OTP
                </button>
              </div>

              {mode === "code" ? (
                <>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">Queue code</label>
                    <input
                      className={inputBase}
                      placeholder="e.g. 7H2K9QX1AB"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      autoCapitalize="characters"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>

                  <button
                    className={buttonBase}
                    onClick={() => fetchStatus(code)}
                    disabled={loading || !normalizeQueueCode(code) || envMissing}
                  >
                    {loading ? "Loading…" : "View status"}
                  </button>

                  <div className="text-xs text-black/50">
                    Don’t have your code? Check the email you received after submitting the waitlist form.
                  </div>
                </>
              ) : (
                <>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">6-digit OTP</label>

                    {/* Nice OTP “boxes” UI */}
                    <div className="flex items-center gap-2">
                      {otpBoxes.map((d, i) => (
                        <div
                          key={i}
                          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white text-lg font-extrabold"
                          style={{
                            boxShadow: d.trim() ? "0 0 0 3px rgba(252,176,64,0.25)" : undefined,
                          }}
                        >
                          {d === " " ? "" : d}
                        </div>
                      ))}
                    </div>

                    {/* Hidden real input */}
                    <input
                      className={inputBase}
                      inputMode="numeric"
                      placeholder="Type your 6 digits…"
                      value={otp}
                      onChange={(e) => {
                        setErr("");
                        setOtp(onlyDigits(e.target.value));
                      }}
                      maxLength={6}
                      autoComplete="one-time-code"
                    />

                    <div className="text-xs text-black/50">
                      Auto-checks instantly at 6 digits.
                    </div>
                  </div>

                  <button
                    className={buttonBase}
                    onClick={() => fetchStatus(otp)}
                    disabled={loading || otp.length !== 6 || envMissing}
                  >
                    {loading ? "Loading…" : "View status"}
                  </button>
                </>
              )}
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

                  <div className="text-xs text-black/50">
                    Joined: {new Date(result.created_at).toLocaleString()}
                  </div>
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
                  </div>
                </MotionDiv>
              ) : null}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className={buttonBase}
                  onClick={() => fetchStatus(mode === "otp" ? otp : code)}
                  disabled={loading}
                >
                  {loading ? "Refreshing…" : "Refresh"}
                </button>
                <button className={subtleButton} onClick={reset} disabled={loading}>
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
