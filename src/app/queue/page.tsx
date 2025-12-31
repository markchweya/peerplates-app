// src/app/queue/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { MotionDiv } from "@/app/ui/motion";
import LogoCinematic from "@/app/ui/LogoCinematic";

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
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  if (s === "reviewed") return "Reviewed";
  return "Pending";
}

const inputBase =
  "h-12 w-full rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold text-black outline-none " +
  "focus:ring-4 focus:ring-[rgba(252,176,64,0.30)] placeholder:text-black/40";

const primaryBtn =
  "w-full rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-black transition " +
  "hover:opacity-95 hover:-translate-y-[1px] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

const subtleBtn =
  "w-full rounded-2xl border border-black/10 bg-white px-6 py-3 text-center font-extrabold text-black transition " +
  "hover:bg-black/5 hover:-translate-y-[1px] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0";

export default function QueuePage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const [info, setInfo] = useState<string>("");
  const [result, setResult] = useState<QueueResult | null>(null);

  const canVerify = useMemo(() => {
    const em = String(email || "").trim();
    const token = String(code || "").trim();
    return !!em && token.length >= 6;
  }, [email, code]);

  const verifyCode = async () => {
    setErr("");
    setInfo("");
    setLoading(true);
    setResult(null);

    try {
      const em = String(email || "").trim().toLowerCase();
      const token = String(code || "").trim();

      if (!em) throw new Error("Please enter your email.");
      if (!token || token.length < 6) throw new Error("Please enter the 6‑digit code.");

      const res = await fetch("/api/queue-verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, token }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Failed to verify code.");

      setResult(payload as QueueResult);
    } catch (e: any) {
      setErr(e?.message || "Failed to verify.");
    } finally {
      setLoading(false);
    }
  };

  const sendNewCode = async () => {
    setErr("");
    setInfo("");
    setSending(true);

    try {
      const em = String(email || "").trim().toLowerCase();
      if (!em) throw new Error("Please enter your email to request a new code.");

      const res = await fetch("/api/queue-send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Couldn’t send a new code.");

      setInfo("New code sent. Check your inbox (and spam).");
    } catch (e: any) {
      setErr(e?.message || "Couldn’t send a new code.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      {/* soft cinematic bg */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/60 to-white" />
        <div
          className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(252,176,64,0.30)" }}
        />
        <div
          className="absolute -right-44 bottom-[-120px] h-[560px] w-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(138,107,67,0.18)" }}
        />
      </div>

      <div className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-between gap-4"
        >
          <Link href="/" className="flex items-center">
            <LogoCinematic size={56} wordScale={1} />
          </Link>

          <div className="text-sm text-black/60 whitespace-nowrap">Queue</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 shadow-sm"
          style={{ boxShadow: "0 18px 60px rgba(2,6,23,0.08)" }}
        >
          <h1 className="text-xl font-extrabold tracking-tight">Check your queue status</h1>
          <p className="mt-2 text-sm text-black/60">
            Enter your email and the 6‑digit code from the email. You can also request a new code.
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

          {info ? (
            <MotionDiv
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-[#fcb040]/40 bg-white p-3 text-sm text-black"
              style={{ boxShadow: "0 0 0 1px rgba(252,176,64,0.18), 0 18px 50px rgba(252,176,64,0.10)" }}
            >
              {info}
            </MotionDiv>
          ) : null}

          {!result ? (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Email</label>
                <input
                  className={inputBase}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">6‑digit code</label>
                <input
                  className={inputBase}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  inputMode="numeric"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button className={primaryBtn} onClick={verifyCode} disabled={loading || !canVerify}>
                  {loading ? "Verifying…" : "Verify"}
                </button>

                <button className={subtleBtn} onClick={sendNewCode} disabled={sending || !String(email).trim()}>
                  {sending ? "Sending…" : "Send new code"}
                </button>
              </div>

              <div className="text-xs text-black/50">
                Tip: request a code, then paste it here.
              </div>
            </div>
          ) : (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.985, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="mt-6 grid gap-4"
            >
              <div className="rounded-3xl border border-[#fcb040]/50 bg-white p-5">
                <div className="text-sm font-extrabold">Your status</div>

                <div className="mt-3 grid gap-2 text-sm text-black/80">
                  <div>
                    <span className="font-semibold">Email:</span> {result.email}
                  </div>
                  <div>
                    <span className="font-semibold">Role:</span> {result.role}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Status:</span>
                    <span className="inline-flex items-center rounded-full border border-black/10 bg-black/5 px-2.5 py-1 text-xs font-extrabold">
                      {formatStatus(result.review_status)}
                    </span>
                  </div>

                  <div>
                    <span className="font-semibold">Queue position:</span>{" "}
                    {typeof result.position === "number" ? (
                      <span className="font-extrabold">#{result.position}</span>
                    ) : (
                      <span className="text-black/60">Not available</span>
                    )}
                  </div>

                  <div className="text-xs text-black/50">
                    Joined: {new Date(result.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button className={primaryBtn} onClick={verifyCode} disabled={loading}>
                  {loading ? "Refreshing…" : "Refresh"}
                </button>

                <button
                  className={subtleBtn}
                  onClick={() => {
                    setResult(null);
                    setErr("");
                    setInfo("");
                    setCode("");
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
