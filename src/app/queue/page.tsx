// src/app/queue/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

/** Spoon + plate icon (matches food brand) */
function FoodIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* plate */}
      <circle cx="13" cy="12" r="6.25" />
      <path d="M4 19h18" />

      {/* spoon */}
      <path d="M6.5 4.5c1.7 0 3 1.4 3 3.1 0 1.1-.6 2.1-1.5 2.7v8.7" />
      <path d="M6.5 4.5c-1.7 0-3 1.4-3 3.1 0 1.1.6 2.1 1.5 2.7v8.7" />
    </svg>
  );
}

/** Clean “X” for close */
function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6l-12 12" />
    </svg>
  );
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
  // ---------- Responsive menu (hard guarantee: menu button never shows on desktop) ----------
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)"); // md breakpoint
    const apply = () => setIsDesktop(mq.matches);
    apply();

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    } else {
      // @ts-ignore
      mq.addListener(apply);
      // @ts-ignore
      return () => mq.removeListener(apply);
    }
  }, []);

  useEffect(() => {
    if (isDesktop) setMenuOpen(false);
  }, [isDesktop]);

  // ✅ Added Mission here (desktop + mobile)
  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home", variant: "ghost" as const },
      { href: "/mission", label: "Mission", variant: "ghost" as const },
      { href: "/faq", label: "FAQ", variant: "ghost" as const },
      { href: "/privacy", label: "Privacy", variant: "ghost" as const },
      { href: "/join", label: "Join waitlist", variant: "primary" as const },
    ],
    []
  );

  const btnBase =
    "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-extrabold shadow-sm transition hover:-translate-y-[1px] whitespace-nowrap";
  const btnGhost = "border border-black/10 bg-white/90 backdrop-blur text-black hover:bg-black/5";
  const btnPrimary = "bg-[#fcb040] text-black hover:opacity-95";

  // lock scroll when mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // ---------- Queue flow ----------
  const [step, setStep] = useState<"email" | "code">("email");

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const [loading, setLoading] = useState(false); // verifying
  const [sending, setSending] = useState(false); // sending code

  const [err, setErr] = useState("");
  const [info, setInfo] = useState<string>("");
  const [result, setResult] = useState<QueueResult | null>(null);

  // resend cooldown
  const COOLDOWN_MS = 30_000;
  const [cooldownUntil, setCooldownUntil] = useState<number>(0);
  const [showCooldownMsg, setShowCooldownMsg] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());

  const verifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyingInFlightRef = useRef(false);

  const canSend = useMemo(() => {
    const em = String(email || "").trim();
    return !!em;
  }, [email]);

  const canVerify = useMemo(() => {
    const em = String(email || "").trim();
    const token = String(code || "").trim();
    return !!em && token.length >= 6;
  }, [email, code]);

  const secondsLeft = useMemo(() => {
    const ms = Math.max(0, cooldownUntil - nowTick);
    return Math.ceil(ms / 1000);
  }, [cooldownUntil, nowTick]);

  useEffect(() => {
    if (!showCooldownMsg) return;
    const t = setInterval(() => setNowTick(Date.now()), 250);
    return () => clearInterval(t);
  }, [showCooldownMsg]);

  useEffect(() => {
    if (!showCooldownMsg) return;
    if (cooldownUntil <= Date.now()) setShowCooldownMsg(false);
  }, [showCooldownMsg, cooldownUntil, nowTick]);

  const verifyCode = async () => {
    if (verifyingInFlightRef.current) return;

    setErr("");
    setInfo("");
    setLoading(true);
    setResult(null);

    verifyingInFlightRef.current = true;

    try {
      const em = String(email || "").trim().toLowerCase();
      const token = String(code || "").trim();

      if (!em) throw new Error("Please enter your email.");
      if (!token || token.length < 6) throw new Error("Please enter the 6-digit code.");

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
      verifyingInFlightRef.current = false;
      setLoading(false);
    }
  };

  const sendNewCode = async (source: "primary" | "resend") => {
    setErr("");
    setInfo("");

    const em = String(email || "").trim().toLowerCase();
    if (!em) {
      setErr("Please enter your email to request a code.");
      return;
    }

    const inCooldown = cooldownUntil > Date.now();
    if (source === "resend" && inCooldown) {
      setShowCooldownMsg(true);
      return;
    }

    setSending(true);

    try {
      const res = await fetch("/api/queue-send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || "Couldn’t send a new code.");

      setInfo("Code sent. Check your inbox (and spam).");
      setShowCooldownMsg(false);

      setCooldownUntil(Date.now() + COOLDOWN_MS);
      setStep("code");
    } catch (e: any) {
      setErr(e?.message || "Couldn’t send a new code.");
    } finally {
      setSending(false);
    }
  };

  // Auto-verify (debounced)
  useEffect(() => {
    if (step !== "code") return;
    if (!canVerify) return;
    if (loading) return;

    if (verifyDebounceRef.current) clearTimeout(verifyDebounceRef.current);

    verifyDebounceRef.current = setTimeout(() => {
      verifyCode();
    }, 450);

    return () => {
      if (verifyDebounceRef.current) clearTimeout(verifyDebounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, canVerify, email, code]);

  const reset = () => {
    setResult(null);
    setErr("");
    setInfo("");
    setCode("");
    setStep("email");
    setShowCooldownMsg(false);
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

      {/* Header */}
      <div className="sticky top-0 z-[60] border-b border-black/10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-5 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="flex items-center min-w-0 overflow-hidden">
              <span className="shrink-0">
                <LogoCinematic size={56} wordScale={1} />
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={[btnBase, l.variant === "primary" ? btnPrimary : btnGhost].join(" ")}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            {/* Mobile menu button (icon only) */}
            {!isDesktop ? (
              <div className="ml-auto shrink-0 relative md:hidden">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  className={[
                    "inline-flex items-center justify-center",
                    "rounded-full border border-black/15 bg-white/95 backdrop-blur",
                    "h-10 w-10 shadow-sm transition hover:-translate-y-[1px]",
                    "text-black",
                  ].join(" ")}
                >
                  {menuOpen ? <CloseIcon /> : <FoodIcon />}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile dropdown */}
        {!isDesktop ? (
          <AnimatePresence initial={false}>
            {menuOpen ? (
              <motion.div
                key="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.2, 0.9, 0.2, 1] }}
                className="md:hidden overflow-hidden"
              >
                <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-5 sm:px-6 lg:px-8 pb-5">
                  <div className="mx-auto w-full max-w-[420px]">
                    <div
                      className="rounded-[28px] border border-black/10 bg-white/92 backdrop-blur p-4 shadow-sm"
                      style={{ boxShadow: "0 18px 60px rgba(2,6,23,0.10)" }}
                    >
                      <div className="grid gap-2">
                        {navLinks.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setMenuOpen(false)}
                            className={[
                              "w-full",
                              btnBase,
                              "px-5 py-3",
                              l.variant === "primary" ? btnPrimary : btnGhost,
                            ].join(" ")}
                          >
                            {l.label}
                          </Link>
                        ))}
                      </div>

                      <div className="mt-3 text-center text-xs font-semibold text-black/45">
                        Taste. Tap. Order.
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        ) : null}
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-2 rounded-3xl border border-black/10 bg-white/90 backdrop-blur p-6 shadow-sm"
          style={{ boxShadow: "0 18px 60px rgba(2,6,23,0.08)" }}
        >
          <h1 className="text-xl font-extrabold tracking-tight">Check your queue status</h1>
          <p className="mt-2 text-sm text-black/60">
            Enter your email to receive a 6-digit code. After you paste the code, we’ll show your status automatically.
          </p>

          {showCooldownMsg && secondsLeft > 0 ? (
            <MotionDiv
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm text-black"
            >
              For security purposes, you can only request this after{" "}
              <span className="font-extrabold">{secondsLeft}</span> seconds.
            </MotionDiv>
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (step === "email") sendNewCode("primary");
                    }
                  }}
                />
              </div>

              {step === "email" ? (
                <button className={primaryBtn} onClick={() => sendNewCode("primary")} disabled={sending || !canSend}>
                  {sending ? "Sending…" : "Send code"}
                </button>
              ) : (
                <>
                  <div className="grid gap-2">
                    <label className="text-sm font-semibold">6-digit code</label>
                    <input
                      className={inputBase}
                      placeholder="123456"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      inputMode="numeric"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (canVerify) verifyCode();
                        }
                      }}
                    />
                    <div className="text-xs text-black/50">
                      Paste the code — your status will appear automatically once it’s valid.
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <button className={primaryBtn} onClick={verifyCode} disabled={loading || !canVerify}>
                      {loading ? "Verifying…" : "Verify"}
                    </button>

                    <button className={subtleBtn} onClick={() => sendNewCode("resend")} disabled={sending || !canSend}>
                      {sending ? "Sending…" : "Send another code"}
                    </button>
                  </div>

                  <button className={subtleBtn} onClick={reset} disabled={loading || sending}>
                    Use a different email
                  </button>
                </>
              )}

              {step === "email" ? (
                <div className="text-xs text-black/50">You’ll receive an email from PeerPlates with a one-time 6-digit code.</div>
              ) : null}
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

                  <div className="text-xs text-black/50">Joined: {new Date(result.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button className={primaryBtn} onClick={verifyCode} disabled={loading}>
                  {loading ? "Refreshing…" : "Refresh"}
                </button>

                <button className={subtleBtn} onClick={reset} disabled={loading}>
                  Check another email
                </button>
              </div>
            </MotionDiv>
          )}
        </MotionDiv>
      </div>
    </main>
  );
}
