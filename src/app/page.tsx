// src/app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";

import LogoCinematic from "@/app/ui/LogoCinematic";
import ScrollShowcase from "@/app/ui/ScrollShowcase";
import HeroFade from "@/app/ui/HeroFade";
import { MotionDiv, MotionH1, MotionP } from "@/app/ui/motion";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * Cinematic section fade that:
 * - fades IN quickly as the section enters
 * - holds while you're "in" the section
 * - fades OUT only when the section is actually leaving the viewport
 */
function useCinematicSection(
  ref: React.RefObject<HTMLElement | null>,
  opts?: {
    enterStart?: number;
    enterEnd?: number;
    exitStart?: number;
    exitEnd?: number;

    yEnter?: number;
    yExit?: number;
    blurEnter?: number;
    blurExit?: number;

    stiffness?: number;
    damping?: number;
    mass?: number;
  }
) {
  const {
    enterStart = 0.96,
    enterEnd = 0.78,
    exitStart = 0.72,
    exitEnd = 0.24,
    yEnter = 16,
    yExit = -22,
    blurEnter = 3,
    blurExit = 8,
    stiffness = 260,
    damping = 30,
    mass = 0.6,
  } = opts || {};

  const oRaw = useMotionValue(1);
  const yRaw = useMotionValue(0);
  const bRaw = useMotionValue(0);

  const o = useSpring(oRaw, { stiffness, damping, mass });
  const y = useSpring(yRaw, { stiffness, damping, mass });
  const b = useSpring(bRaw, { stiffness, damping, mass });

  const filter = useMotionTemplate`blur(${b}px)`;

  useEffect(() => {
    let raf: number | null = null;

    const update = () => {
      raf = null;
      const el = ref.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = Math.max(1, window.innerHeight);

      const enterDen = Math.max(0.0001, (enterStart - enterEnd) * vh);
      const enterT = clamp01((enterStart * vh - rect.top) / enterDen);

      const exitDen = Math.max(0.0001, (exitStart - exitEnd) * vh);
      const exitT = clamp01((exitStart * vh - rect.bottom) / exitDen);

      const opacity = enterT * (1 - exitT);

      const yVal = (1 - enterT) * yEnter + exitT * yExit;
      const blurVal = (1 - enterT) * blurEnter + exitT * blurExit;

      oRaw.set(opacity);
      yRaw.set(yVal);
      bRaw.set(blurVal);
    };

    const schedule = () => {
      if (raf != null) return;
      raf = window.requestAnimationFrame(update);
    };

    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    schedule();

    return () => {
      document.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
  }, [ref, enterStart, enterEnd, exitStart, exitEnd, yEnter, yExit, blurEnter, blurExit, oRaw, yRaw, bRaw]);

  return { opacity: o, y, filter };
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

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);

  const heroFx = useCinematicSection(heroRef, {
    enterStart: 1.02,
    enterEnd: 0.88,
    exitStart: 0.74,
    exitEnd: 0.22,
    yEnter: 10,
    yExit: -24,
    blurEnter: 0,
    blurExit: 7,
    stiffness: 280,
    damping: 32,
    mass: 0.6,
  });

  const showcaseFx = useCinematicSection(showcaseRef, {
    enterStart: 0.98,
    enterEnd: 0.8,
    exitStart: 0.7,
    exitEnd: 0.2,
    yEnter: 14,
    yExit: -18,
    blurEnter: 2,
    blurExit: 6,
    stiffness: 300,
    damping: 34,
    mass: 0.58,
  });

  // ✅ Hard guarantee: mobile menu never shows on desktop
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

  // ✅ Added Mission here (desktop + mobile)
  const navLinks = useMemo(
    () => [
      { href: "/mission", label: "Mission", variant: "ghost" as const },
      { href: "/queue", label: "Check queue", variant: "ghost" as const },
      { href: "/faq", label: "FAQ", variant: "ghost" as const },
      { href: "/privacy", label: "Privacy", variant: "ghost" as const },
      { href: "/join", label: "Join waitlist", variant: "primary" as const },
    ],
    []
  );

  const btnBase =
    "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-extrabold shadow-sm transition hover:-translate-y-[1px] whitespace-nowrap";
  const btnGhost = "border border-slate-200 bg-white/90 backdrop-blur text-slate-900 hover:bg-slate-50";
  const btnPrimary = "bg-[#fcb040] text-slate-900 hover:opacity-95";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <HeroFade directionDelta={7} className="fixed top-0 left-0 right-0 z-[100] pointer-events-auto">
        <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          {/* ✅ more side padding on mobile */}
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

              {/* Mobile icon button */}
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
      </HeroFade>

      <div className="h-[84px]" />

      {/* HERO */}
      <motion.section
        ref={heroRef}
        style={{
          opacity: heroFx.opacity,
          y: heroFx.y,
          filter: heroFx.filter,
          willChange: "transform, opacity, filter",
        }}
      >
        <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="mt-6 sm:mt-10 grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="pt-2">
              <MotionDiv
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="inline-flex items-center gap-3 rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-700"
              >
                <span className="h-2 w-2 rounded-full bg-[#fcb040]" />
                Real home food • student-friendly prices
              </MotionDiv>

              <MotionH1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12 }}
                className="mt-6 font-extrabold tracking-tight leading-[0.98] text-[clamp(2.8rem,6vw,5.2rem)]"
              >
                Great-value,
                <br />
                authentic meals
                <br />
                from local home
                <br />
                cooks.
              </MotionH1>

              <MotionP
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-6 max-w-lg text-base sm:text-lg text-slate-600 leading-relaxed"
              >
                Skip the takeaway. Get warm, home-cooked food from trusted local cooks — while helping small vendors grow.
              </MotionP>

              <MotionDiv
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.28 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href="/join"
                  className="rounded-2xl bg-[#fcb040] px-7 py-3 text-center font-extrabold text-slate-900 shadow-sm transition hover:opacity-95 hover:-translate-y-[1px]"
                >
                  Join waitlist
                </Link>

                <Link
                  href="/queue"
                  className="rounded-2xl border border-slate-200 px-7 py-3 text-center font-extrabold transition hover:bg-slate-50 hover:-translate-y-[1px]"
                >
                  Check queue
                </Link>
              </MotionDiv>
            </div>

            {/* Right card */}
            <MotionDiv
              initial={{ opacity: 0, x: 22 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.65, delay: 0.18 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm"
            >
              <div>
                <div className="text-xl font-extrabold">How it works</div>
                <div className="mt-2 text-slate-600 font-semibold">
                  Join in minutes. Get a code. Share. Move up the waitlist.
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                {[
                  { n: "1", t: "Pick your role", d: "Consumer or vendor." },
                  { n: "2", t: "Answer a few questions", d: "Only complete entries count." },
                  { n: "3", t: "Get your link", d: "Share it to move up the waitlist." },
                  { n: "4", t: "Safety first", d: "Vendors follow UK hygiene rules." },
                ].map((s, i) => (
                  <MotionDiv
                    key={s.n}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.22 + i * 0.06 }}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#fcb040] text-slate-900 font-extrabold">
                        {s.n}
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-lg">{s.t}</div>
                        <div className="mt-1 text-slate-600 font-semibold">{s.d}</div>
                      </div>
                    </div>
                  </MotionDiv>
                ))}
              </div>
            </MotionDiv>
          </div>
        </div>
      </motion.section>

      {/* SHOWCASE */}
      <motion.section
        ref={showcaseRef}
        style={{
          opacity: showcaseFx.opacity,
          y: showcaseFx.y,
          filter: showcaseFx.filter,
          willChange: "transform, opacity, filter",
        }}
      >
        <ScrollShowcase
          heading="Product previews"
          subheading="See how PeerPlates makes ordering and managing home-cooked food effortless."
          direction="ltr"
          snap={true}
          tilt={true}
          nav={[
            { label: "Ordering", index: 0 },
            { label: "Storefront", index: 2 },
            { label: "Vendor", index: 3 },
            { label: "Analytics", index: 4 },
            { label: "Operations", index: 6 },
          ]}
          items={[
            {
              image: "/images/gallery/gallery1.jpeg",
              kicker: "Scroll-first menu",
              title: "TikTok-style scroll experience, built for ordering.",
              subtitle: "Scroll. Crave. Add to cart.",
              desc: 'Discover home-cooked meals in short, shoppable videos — tap “Add to cart” straight from the video.',
            },
            {
              image: "/images/gallery/gallery2.jpeg",
              kicker: "Quick picks",
              title: "Highlights that make choosing effortless.",
              subtitle: "See it. Want it. Order fast.",
              desc: "Short, snackable previews that help you decide in seconds — perfect for busy students.",
            },
            {
              image: "/images/gallery/gallery3.jpeg",
              kicker: "Storefront",
              title: "No back-and-forth. Just orders.",
              subtitle: "Browse. Prices upfront. Checkout in seconds.",
              desc: "A proper storefront for home-cooked meals: browse categories, see prices upfront, and checkout in seconds.",
            },
            {
              image: "/images/gallery/gallery4.jpeg",
              kicker: "Vendor profiles",
              title: "Grow your community.",
              subtitle: "Your profile. Your followers. Your drops.",
              desc: "Build a loyal following with your own vendor profile — customers can follow, view your posts, and stay updated on your collection days and latest drops.",
            },
            {
              image: "/images/gallery/gallery5.jpeg",
              kicker: "Analytics",
              title: "Eliminate the guesswork — PeerPlates tracks it for you.",
              subtitle: "Orders, earnings, and what’s trending.",
              desc: "Track orders and revenue in one dashboard, and instantly spot your best-selling items without manual tracking.",
            },
            {
              image: "/images/gallery/gallery6.png",
              kicker: "Insights",
              title: "Make smarter decisions with live performance stats.",
              subtitle: "See your top sellers — fast.",
              desc: "Get a clear snapshot of sales performance, customer activity, and your strongest items — all at a glance.",
            },
            {
              image: "/images/gallery/gallery7.jpeg",
              kicker: "Vendor control",
              title: "Vendor control, made effortless for customers.",
              subtitle: "You set the rules — customers just book.",
              desc: "Manage your order flow in one place: accept orders, set availability, and keep customers aligned without endless messages.",
            },
            {
              image: "/images/gallery/gallery8.png",
              kicker: "Prep time & capacity",
              title: "No confusion — every slot is intentional.",
              subtitle: "Minimum prep time, built in.",
              desc: "Set your minimum preparation window so customers only checkout when you can realistically deliver — smooth for you, simple for them.",
            },
            {
              image: "/images/gallery/gallery9.png",
              kicker: "Pickup scheduling",
              title: "Pickup times that feel like a storefront, not a chat.",
              subtitle: "Choose a slot. Checkout. Done.",
              desc: "Customers select a pickup time, see the location, and checkout cleanly — no back-and-forth, no coordination stress.",
            },
            {
              image: "/images/gallery/gallery10.jpeg",
              kicker: "Order management",
              title: "Stay organised. Avoid mix-ups.",
              subtitle: "Filter by pickup date — today, this week, or any day.",
              desc: "Filter orders by pickup date so you can track what’s due today, this week, or a specific day — and make sure each order goes to the right customer.",
            },
          ]}
        />
      </motion.section>

      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-10 sm:mt-12 border-t border-slate-200 pt-6 pb-10 text-sm text-slate-500">
          © {new Date().getFullYear()} PeerPlates
        </div>
      </div>
    </main>
  );
}
