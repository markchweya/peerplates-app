"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

import LogoCinematic from "@/app/ui/LogoCinematic";
import ScrollShowcase from "@/app/ui/ScrollShowcase";
import { MotionDiv, MotionP, MotionH1 } from "@/app/ui/motion";

export default function Home() {
  // Global page scroll
  const { scrollY } = useScroll();

  // Fade hero immediately as user scrolls down; fade back in when scrolling up
  // Tune these numbers if you want faster/slower fading
  const heroOpacity = useTransform(scrollY, [0, 180, 420], [1, 0.55, 0]);
  const heroY = useTransform(scrollY, [0, 420], [0, -28]);
  const heroBlur = useTransform(scrollY, [0, 420], ["blur(0px)", "blur(8px)"]);

  // Bring the showcase in as hero leaves (subtle)
  const showcaseOpacity = useTransform(scrollY, [80, 260], [0.92, 1]);
  const showcaseY = useTransform(scrollY, [80, 260], [10, 0]);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* HERO AREA: fades out/in based on global scroll */}
      <motion.div style={{ opacity: heroOpacity, y: heroY, filter: heroBlur }}>
        <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          {/* Top bar */}
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center justify-between gap-4"
          >
            <Link href="/" className="flex items-center">
              <LogoCinematic size={64} wordScale={1} />
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
          </MotionDiv>

          {/* Hero */}
          <div className="mt-10 sm:mt-14 grid gap-10 lg:grid-cols-2 lg:items-start">
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
      </motion.div>

      {/* SHOWCASE: gently fades in */}
      <motion.div style={{ opacity: showcaseOpacity, y: showcaseY }}>
        <ScrollShowcase
          heading="Product previews"
          subheading="Scroll down — the gallery slides right → left."
          direction="rtl"
          snap
          tilt
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
      </motion.div>

      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-10 sm:mt-12 border-t border-slate-200 pt-6 pb-10 text-sm text-slate-500">
          © {new Date().getFullYear()} PeerPlates
        </div>
      </div>
    </main>
  );
}
