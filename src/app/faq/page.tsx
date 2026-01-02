// src/app/faq/page.tsx
"use client";

// ✅ FAQ PAGE (client component)

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LogoCinematic from "@/app/ui/LogoCinematic";
import { MotionDiv } from "@/app/ui/motion";

const BRAND_ORANGE = "#fcb040";
const BRAND_BROWN = "#8a6b43";

function cn(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

type FAQItem = {
  q: string;
  a: ReactNode;
};

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

export default function FAQPage() {
  // ✅ same menu behavior as Home: never show mobile menu on desktop
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

  // ✅ Added Mission link
  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home", variant: "ghost" as const },
      { href: "/mission", label: "Mission", variant: "ghost" as const },
      { href: "/queue", label: "Check queue", variant: "ghost" as const },
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
      {/* Header with menu */}
      <div className="fixed top-0 left-0 right-0 z-[100] pointer-events-auto">
        <div className="border-b border-slate-200/60 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
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

              {/* Page label */}
              <div className="hidden sm:block md:hidden ml-auto text-sm text-slate-900/60 whitespace-nowrap">
                FAQ
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

                        <div className="mt-3 text-center text-xs font-semibold text-slate-500">
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
      </div>

      {/* Spacer so content doesn't go under fixed header */}
      <div className="h-[84px]" />

      <FAQSection />
    </main>
  );
}

export function FAQSection({
  label = "FAQ",
  title = "Frequently asked questions",
  subtitle = "Quick answers for vendors and home cooks.",
}: {
  label?: string;
  title?: string;
  subtitle?: string;
}) {
  const items = useMemo<FAQItem[]>(
    () => [
      {
        q: "What is PeerPlates?",
        a: (
          <>
            PeerPlates is a community-driven marketplace where independent home cooks and bakers sell authentic,
            affordable food to nearby customers. You list your menu on our platform, customers pre-order in advance, and
            you prepare, cool, and package each order for pickup.
            <br />
            <br />
            PeerPlates is a one-stop shop to help you manage and grow your food business — from marketing and menu/order
            management to payments, customer support, and more.
          </>
        ),
      },
      {
        q: "What is cooking and baking on PeerPlates like?",
        a: (
          <>
            Cooking and Baking on PeerPlates is simple. You set your availability, and customers order from your menu.
            We notify you of all orders in an easy-to-read list. Once you’ve finished preparing food, you safely cool
            your dishes and package them for pickup. After pickup, you’ll be able to see customer feedback and reviews.
          </>
        ),
      },
      {
        q: "How does pickup work?",
        a: (
          <>
            You set your pickup days, order cut-off time, pickup location, and time windows. Customers select and book a
            pickup slot when placing an order.
            <br />
            <br />
            We send reminders to you and the customer 24 hours, 12 hours, and 30 minutes before pickup, as well as at
            pickup time. The customer meets you at your chosen pickup spot and shows a unique QR code for that
            transaction. You scan the QR code, and if it matches, you hand over the order — completing the transaction.
          </>
        ),
      },
      {
        q: "How many days a week can I cook or bake?",
        a: (
          <>
            It’s completely up to you. You have full control over your availability and how many items you want to sell.
            No pressure — go at your own pace.
          </>
        ),
      },
      {
        q: "Once I start cooking or baking on PeerPlates, can I take a break?",
        a: (
          <>
            Yes — of course. You control your schedule. If you’d like to pause, that’s completely fine. We’ll be here to
            support you whenever you’re ready to come back.
          </>
        ),
      },
      {
        q: "How do I get paid?",
        a: (
          <>
            We use a secure online payment processing partner. After each completed order, your earnings are added to
            your PeerPlates wallet.
          </>
        ),
      },
    ],
    []
  );

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section className="relative py-16 sm:py-20">
      {/* cinematic bg (subtle) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/70 to-white" />
        <motion.div
          className="absolute -left-44 top-10 h-[520px] w-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(252,176,64,0.32)" }}
          animate={{ x: [0, 60, 0], y: [0, 22, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-52 bottom-[-140px] h-[560px] w-[560px] rounded-full blur-3xl opacity-25"
          style={{ background: "rgba(138,107,67,0.18)" }}
          animate={{ x: [0, -64, 0], y: [0, -24, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.45 }}
          transition={{ duration: 0.65, ease: [0.2, 0.9, 0.2, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-6 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full" style={{ background: BRAND_ORANGE }} />
            {label}
          </div>

          <h2 className="mt-6 font-extrabold tracking-tight leading-[0.95] text-[clamp(2.2rem,4.6vw,3.6rem)] text-slate-900">
            {title}{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${BRAND_ORANGE}, ${BRAND_BROWN})` }}
            >
              .
            </span>
          </h2>

          <p className="mt-4 text-slate-600 font-semibold leading-relaxed">{subtitle}</p>
        </motion.div>

        <div className="mx-auto mt-10 sm:mt-12 max-w-3xl grid gap-4">
          {items.map((it, i) => {
            const open = openIdx === i;
            return (
              <motion.div
                key={it.q}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.35 }}
                transition={{ duration: 0.55, delay: i * 0.03 }}
                className={cn(
                  "rounded-[28px] border border-slate-200 bg-white/85 backdrop-blur shadow-sm overflow-hidden"
                )}
                style={{ boxShadow: "0 18px 60px rgba(2,6,23,0.07)" }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(open ? null : i)}
                  className="w-full px-6 sm:px-7 py-5 flex items-start justify-between gap-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-extrabold text-slate-900">{it.q}</div>
                    <div className="mt-1 text-xs font-semibold text-slate-500">
                      {open ? "Tap to close" : "Tap to open"}
                    </div>
                  </div>

                  <div className="shrink-0 mt-1">
                    <div
                      className={cn("h-10 w-10 rounded-2xl border flex items-center justify-center transition")}
                      style={{
                        borderColor: open ? "rgba(252,176,64,0.45)" : "rgba(226,232,240,1)",
                        background: open ? "rgba(252,176,64,0.10)" : "rgba(255,255,255,0.8)",
                      }}
                    >
                      <motion.span
                        animate={{ rotate: open ? 45 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-2xl font-black leading-none text-slate-900"
                      >
                        +
                      </motion.span>
                    </div>
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
                    >
                      <div className="px-6 sm:px-7 pb-6 text-slate-700 font-semibold leading-relaxed">
                        <div className="h-px w-full bg-slate-200/70 mb-4" />
                        {it.a}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
