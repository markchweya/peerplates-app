"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

import LogoCinematic from "@/app/ui/LogoCinematic";
import ScrollShowcase from "@/app/ui/ScrollShowcase";
import HeroFade from "@/app/ui/HeroFade";
import { MotionDiv, MotionP, MotionH1 } from "@/app/ui/motion";

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

/**
 * Cinematic section fade that:
 * - fades IN quickly as the section enters
 * - holds while you're "in" the section
 * - fades OUT only when the section is actually leaving the viewport
 *
 * Works even if scroll happens inside a nested scroll container,
 * because we listen on document scroll in capture mode and use DOM rects.
 */
function useCinematicSection(
  ref: React.RefObject<HTMLElement | null>,
  opts?: {
    // enter: section top crosses these viewport fractions (from below)
    enterStart?: number; // 0..1 (e.g. 0.95)
    enterEnd?: number; // 0..1 (e.g. 0.72)
    // exit: section bottom crosses these viewport fractions (moving up)
    exitStart?: number; // 0..1 (e.g. 0.72)
    exitEnd?: number; // 0..1 (e.g. 0.22)

    yEnter?: number; // px
    yExit?: number; // px (usually negative)
    blurEnter?: number; // px
    blurExit?: number; // px

    // spring feel
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

      // ENTER (top coming up from below)
      // 0 when top is below enterStart*vh, 1 when top reaches enterEnd*vh
      const enterDen = Math.max(0.0001, (enterStart - enterEnd) * vh);
      const enterT = clamp01((enterStart * vh - rect.top) / enterDen);

      // EXIT (bottom moving up past the view)
      // 0 when bottom is below exitStart*vh, 1 when bottom reaches exitEnd*vh
      const exitDen = Math.max(0.0001, (exitStart - exitEnd) * vh);
      const exitT = clamp01((exitStart * vh - rect.bottom) / exitDen);

      // Combine:
      // - fully visible while in middle
      // - fade in quickly on enter
      // - fade out only as it leaves
      const opacity = enterT * (1 - exitT);

      // Y & blur: subtle, and only really kicks in on enter/exit
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

    // Capture catches nested scrollers too
    document.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });

    // init
    schedule();

    return () => {
      document.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      if (raf != null) window.cancelAnimationFrame(raf);
    };
  }, [
    ref,
    enterStart,
    enterEnd,
    exitStart,
    exitEnd,
    yEnter,
    yExit,
    blurEnter,
    blurExit,
    oRaw,
    yRaw,
    bRaw,
  ]);

  return {
    opacity: o,
    y,
    filter,
  };
}

export default function Home() {
  const heroRef = useRef<HTMLElement | null>(null);
  const showcaseRef = useRef<HTMLElement | null>(null);

  // HERO: hold longer, fade only when it's truly leaving.
  const heroFx = useCinematicSection(heroRef, {
    enterStart: 1.02,
    enterEnd: 0.88,
    exitStart: 0.74, // starts fading when hero bottom reaches ~74% of viewport
    exitEnd: 0.22,   // fully faded near top
    yEnter: 10,
    yExit: -24,
    blurEnter: 0,
    blurExit: 7,
    stiffness: 280,
    damping: 32,
    mass: 0.6,
  });

  // SHOWCASE: snaps in quickly; fades out ONLY after you've actually left the 10/10 sticky section.
  const showcaseFx = useCinematicSection(showcaseRef, {
    enterStart: 0.98,
    enterEnd: 0.80,
    exitStart: 0.70,
    exitEnd: 0.20,
    yEnter: 14,
    yExit: -18,
    blurEnter: 2,
    blurExit: 6,
    stiffness: 300,
    damping: 34,
    mass: 0.58,
  });

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Header hides/shows based on scroll direction (snappy, cinematic) */}
      <HeroFade directionDelta={7} className="fixed top-0 left-0 right-0 z-[100]">
        <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center">
                <LogoCinematic size={56} wordScale={1} />
              </Link>

              <div className="flex items-center gap-3">
                <Link
                  href="/queue"
                  className="rounded-2xl border border-slate-200 px-5 py-2.5 font-semibold hover:bg-slate-50 transition whitespace-nowrap shadow-sm"
                >
                  Check queue
                </Link>

                <Link
                  href="/join"
                  className="rounded-2xl bg-[#fcb040] px-5 py-2.5 font-extrabold text-slate-900 shadow-sm transition hover:opacity-95 hover:-translate-y-[1px] whitespace-nowrap"
                >
                  Join waitlist
                </Link>
              </div>
            </div>
          </div>
        </div>
      </HeroFade>

      {/* Spacer so content doesn't go under fixed header */}
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
                Skip the takeaway. Get warm, home-cooked food from trusted local cooks — while helping
                small vendors grow.
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
          subheading="Scroll down — the gallery slides right → left."
          direction="rtl"
          snap={false}
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
