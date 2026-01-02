// src/app/thanks/page.tsx
"use client";

import Link from "next/link";
import LogoCinematic from "@/app/ui/LogoCinematic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MotionDiv } from "@/app/ui/motion";
import { AnimatePresence, motion } from "framer-motion";

const BRAND_ORANGE = "#fcb040";
const BRAND_BROWN = "#8a6b43";

export default function ThanksPage() {
  return (
    <Suspense fallback={<ThanksFallback />}>
      <ThanksInner />
    </Suspense>
  );
}

function ThanksFallback() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="rounded-3xl border border-[#fcb040] bg-white p-5 sm:p-7 shadow-sm">
          <div className="text-lg font-extrabold">Loading…</div>
          <div className="mt-2 text-sm text-slate-600">Preparing your referral link.</div>
        </div>
      </div>
    </main>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  // modern checkmark (NOT emoji)
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M20 6.8 9.6 17.2 4 11.6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Spoon + plate icon (food brand) */
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
      <circle cx="13" cy="12" r="6.25" />
      <path d="M4 19h18" />
      <path d="M6.5 4.5c1.7 0 3 1.4 3 3.1 0 1.1-.6 2.1-1.5 2.7v8.7" />
      <path d="M6.5 4.5c-1.7 0-3 1.4-3 3.1 0 1.1.6 2.1 1.5 2.7v8.7" />
    </svg>
  );
}

/** Close icon */
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

function StatusPill() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-extrabold text-slate-900 shadow-sm backdrop-blur">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND_ORANGE }} />
      <span>You’re on the waitlist</span>
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full"
        style={{
          background: "rgba(252,176,64,0.18)",
          boxShadow: "0 0 0 1px rgba(252,176,64,0.35), 0 12px 30px rgba(252,176,64,0.22)",
          color: "#0f172a",
        }}
        aria-hidden="true"
      >
        <CheckIcon className="h-4 w-4" />
      </span>
    </div>
  );
}

function ThanksInner() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";
  const code = sp.get("code") || "";
  const role = (sp.get("role") as "consumer" | "vendor" | null) || "consumer";

  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Only used for consumers
  const [position, setPosition] = useState<number | null>(null);
  const [posLoading, setPosLoading] = useState(false);

  // ---------- Responsive menu (hard guarantee: menu button never shows on desktop) ----------
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)"); // md
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

  // lock scroll when mobile menu open
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

  // ✅ Added Mission
  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home", variant: "ghost" as const },
      { href: "/mission", label: "Mission", variant: "ghost" as const },
      { href: "/faq", label: "FAQ", variant: "ghost" as const },
      { href: "/privacy", label: "Privacy", variant: "ghost" as const },
      { href: "/queue", label: "Check queue", variant: "ghost" as const },
      { href: "/join", label: "Join waitlist", variant: "primary" as const },
    ],
    []
  );

  const btnBase =
    "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-extrabold shadow-sm transition hover:-translate-y-[1px] whitespace-nowrap";
  const btnGhost = "border border-slate-200 bg-white/90 backdrop-blur text-slate-900 hover:bg-slate-50";
  const btnPrimary = "bg-[#fcb040] text-slate-900 hover:opacity-95";

  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  // ✅ Always share the chooser page, not consumer/vendor directly
  const referralLink = useMemo(() => {
    if (!code || !baseUrl) return "";
    return `${baseUrl}/join?ref=${encodeURIComponent(code)}`;
  }, [code, baseUrl]);

  useEffect(() => {
    if (!id) return;
    if (role !== "consumer") return;

    setPosLoading(true);
    fetch(`/api/queue-position?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.position === "number") setPosition(d.position);
        else setPosition(null);
      })
      .finally(() => setPosLoading(false));
  }, [id, role]);

  const copy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isConsumer = role === "consumer";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* soft cinematic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/70 to-white" />
        <div
          className="absolute -top-28 -left-28 h-[520px] w-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(252,176,64,0.35)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[640px] w-[640px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(138,107,67,0.22)" }}
        />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-[60] border-b border-slate-200/70 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-5 sm:px-6 lg:px-8 py-4">
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-3 min-w-0"
          >
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

            {/* Status pill (hide on tiny screens to avoid crowding) */}
            <div className="hidden sm:block md:hidden ml-auto">
              <StatusPill />
            </div>

            {/* Mobile icon button (plate/spoon) */}
            {!isDesktop ? (
              <div className="ml-auto shrink-0 relative md:hidden">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-label={menuOpen ? "Close menu" : "Open menu"}
                  aria-expanded={menuOpen}
                  className={[
                    "inline-flex items-center justify-center",
                    "rounded-full border border-slate-200 bg-white/95 backdrop-blur",
                    "h-10 w-10 shadow-sm transition hover:-translate-y-[1px]",
                    "text-slate-900",
                  ].join(" ")}
                >
                  {menuOpen ? <CloseIcon /> : <FoodIcon />}
                </button>
              </div>
            ) : null}
          </MotionDiv>
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
                      className="rounded-[28px] border border-slate-200 bg-white/92 backdrop-blur p-4 shadow-sm"
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

                      <div className="mt-3 text-center text-xs font-semibold text-slate-500">Taste. Tap. Order.</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        ) : null}
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* On desktop, show status pill neatly under header line */}
        <div className="md:flex md:justify-end hidden">
          <StatusPill />
        </div>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-6 rounded-[36px] border border-[#fcb040]/60 bg-white/85 backdrop-blur p-6 sm:p-8 shadow-sm"
          style={{ boxShadow: "0 22px 70px rgba(2,6,23,0.10)" }}
        >
          <h1 className="text-[clamp(2.0rem,4vw,2.8rem)] font-extrabold tracking-tight leading-[0.95]">
            Thanks for joining{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${BRAND_ORANGE}, ${BRAND_BROWN})` }}
            >
              PeerPlates.
            </span>
          </h1>

          <p className="mt-3 text-slate-900/70 text-sm sm:text-base font-semibold">
            We’ll email you with updates and early access.
          </p>

          {isConsumer ? (
            <div className="mt-6 rounded-3xl border border-[#fcb040]/55 bg-white p-5">
              <div className="text-sm font-extrabold">Your queue position</div>
              <div className="mt-1 text-3xl font-extrabold tracking-tight">
                {id ? (posLoading ? "Loading…" : position ? `#${position}` : "—") : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-900/60">MVP estimate based on signup time and role.</div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-[#fcb040]/55 bg-white p-5">
              <div className="text-sm font-extrabold">Vendor review</div>
              <div className="mt-2 text-sm text-slate-900/70 font-semibold leading-relaxed">
                We’ll review your application and email you as soon as you’re approved for early access.
              </div>
            </div>
          )}

          {code ? (
            <div className="mt-7 grid gap-3 rounded-3xl border border-[#fcb040]/55 bg-white p-5">
              <div className="text-sm font-extrabold">Your referral link</div>

              <div className="rounded-2xl border border-[#fcb040]/60 bg-white px-4 py-3 font-mono text-sm break-all">
                {referralLink || "Generating link…"}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={copy}
                  disabled={!referralLink}
                  className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>

                <Link
                  href="/"
                  className="rounded-2xl border border-[#fcb040]/60 bg-white px-6 py-3 text-center font-extrabold text-slate-900 transition hover:-translate-y-[1px]"
                >
                  Back to home
                </Link>
              </div>

              <div className="text-xs text-slate-900/60">
                Share your link with friends. Referrals help consumers move up the queue.
              </div>
            </div>
          ) : (
            <div className="mt-7 rounded-3xl border border-[#fcb040]/55 bg-white p-5">
              <div className="text-sm font-semibold">Your signup is saved.</div>
              <div className="mt-1 text-sm text-slate-900/70">
                (Referral code missing from the URL — that’s okay. We can still look you up by email.)
              </div>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px]"
                >
                  Back to home
                </Link>
              </div>
            </div>
          )}

          {id ? (
            <div className="mt-6 text-xs text-slate-900/50">
              Reference ID: <span className="font-mono">{id}</span>
            </div>
          ) : null}
        </MotionDiv>
      </div>
    </main>
  );
}
