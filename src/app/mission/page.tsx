// src/app/mission/page.tsx
"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, useMotionTemplate, AnimatePresence } from "framer-motion";

import LogoCinematic from "@/app/ui/LogoCinematic";
import { MotionDiv } from "@/app/ui/motion";

const BRAND_ORANGE = "#fcb040";
const BRAND_BROWN = "#8a6b43";

function cn(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

/* --------------------------- Header menu icons --------------------------- */

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

/* ------------------------------ Existing icons ------------------------------ */

function VendorIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7.6 9.2c-.4-2.6 1.6-4.6 4.4-4.6s4.8 2 4.4 4.6c.6-.2 1.2-.2 1.8.1 1.2.6 1.8 2.1 1.2 3.4-.5 1.2-1.7 1.9-3 1.6H7.6c-1.3.3-2.5-.4-3-1.6-.6-1.3 0-2.8 1.2-3.4.6-.3 1.2-.3 1.8-.1Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 13.9c-2.9 0-5.2 2.1-5.2 4.7V20h10.4v-1.4c0-2.6-2.3-4.7-5.2-4.7Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 13.4c1.8 0 3.2-1.4 3.2-3.1S13.8 7.2 12 7.2 8.8 8.6 8.8 10.3s1.4 3.1 3.2 3.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function CustomerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 13.7c-3.2 0-5.8 2.2-5.8 4.9V20h11.6v-1.4c0-2.7-2.6-4.9-5.8-4.9Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 13.2c2 0 3.6-1.6 3.6-3.5S14 6.2 12 6.2 8.4 7.8 8.4 9.7 10 13.2 12 13.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function GlowPill({ active, children }: { active?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs sm:px-5 sm:py-2.5 sm:text-sm font-extrabold shadow-sm backdrop-blur",
        active ? "border-slate-200 bg-white/85 text-slate-900" : "border-slate-200/70 bg-white/60 text-slate-600"
      )}
    >
      <span className="relative flex h-2.5 w-2.5 items-center justify-center">
        <span className={cn("absolute h-2.5 w-2.5 rounded-full", active ? "opacity-100" : "opacity-60")} style={{ background: BRAND_ORANGE }} />
        <span
          className={cn("absolute h-6 w-6 rounded-full blur-xl transition-opacity", active ? "opacity-70" : "opacity-0")}
          style={{ background: BRAND_ORANGE }}
        />
      </span>
      {children}
    </div>
  );
}

function CinematicSection({
  label,
  title,
  highlight,
  body,
  children,
  accentFrom = BRAND_ORANGE,
  accentTo = BRAND_BROWN,
  onInView,
}: {
  label: string;
  title: string;
  highlight: string;
  body?: string;
  children?: ReactNode;
  accentFrom?: string;
  accentTo?: string;
  onInView?: () => void;
}) {
  const ref = useRef<HTMLElement | null>(null);

  const isInView = useInView(ref, { amount: 0.55, margin: "-10% 0px -35% 0px" });

  useEffect(() => {
    if (isInView) onInView?.();
  }, [isInView, onInView]);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const outOpacity = useTransform(scrollYProgress, [0, 0.72, 1], [1, 1, 0]);
  const outY = useTransform(scrollYProgress, [0, 0.72, 1], [0, -8, -46]);
  const blur = useTransform(scrollYProgress, [0, 0.85, 1], [0, 0, 12]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  const gradientStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(90deg, ${accentFrom}, ${accentTo})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }),
    [accentFrom, accentTo]
  );

  return (
    <section ref={ref} className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/60 to-white" />

        <motion.div
          className="absolute -left-40 top-10 h-[520px] w-[520px] rounded-full blur-3xl opacity-25"
          style={{ background: `rgba(252,176,64,0.35)` }}
          animate={{ x: [0, 60, 0], y: [0, 24, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -right-44 bottom-[-120px] h-[560px] w-[560px] rounded-full blur-3xl opacity-30"
          style={{ background: `rgba(138,107,67,0.22)` }}
          animate={{ x: [0, -64, 0], y: [0, -26, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          className="absolute left-1/2 top-[12%] h-[520px] w-[520px] -translate-x-1/2 rounded-full blur-2xl opacity-[0.08]"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, rgba(252,176,64,0.7), transparent 55%), radial-gradient(circle at 65% 70%, rgba(138,107,67,0.6), transparent 55%)",
          }}
          animate={{ rotate: [0, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center justify-center py-24">
          <motion.div
            style={{ opacity: outOpacity, y: outY, filter }}
            className="w-full"
            initial={{ opacity: 0, y: 26, scale: 0.985 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: false, amount: 0.5 }}
            transition={{ duration: 0.7, ease: [0.2, 0.9, 0.2, 1] }}
          >
            <div className="mb-8 flex justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/75 px-6 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full" style={{ background: BRAND_ORANGE }} />
                {label}
              </div>
            </div>

            <h1 className="text-center font-extrabold tracking-tight leading-[0.92] text-[clamp(3.2rem,6.6vw,6.3rem)] text-slate-900">
              {title} <span style={gradientStyle}>{highlight}</span>
            </h1>

            {body ? (
              <p className="mx-auto mt-7 max-w-3xl text-center text-base sm:text-lg leading-relaxed text-slate-600 font-semibold">
                {body}
              </p>
            ) : null}

            {children ? <div className="mt-10">{children}</div> : null}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SideFadeNav({
  active,
  onSelect,
}: {
  active: "mission" | "vision" | "safety";
  onSelect: (v: "mission" | "vision" | "safety") => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);

  const show = hovered || pinned;

  return (
    <motion.aside
      aria-label="Mission navigation"
      className={cn("fixed z-40", "right-3 bottom-24 md:right-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={false}
      animate={{
        opacity: show ? 1 : 0.18,
        scale: show ? 1 : 0.98,
        filter: show ? "blur(0px)" : "blur(0.2px)",
      }}
      transition={{ duration: 0.28, ease: [0.2, 0.9, 0.2, 1] }}
      style={{ willChange: "opacity, transform, filter" }}
    >
      <div className={cn("rounded-2xl border border-slate-200 bg-white/70 backdrop-blur shadow-sm", "px-2 py-2 md:px-3 md:py-3")}>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              setPinned((p) => !p);
              onSelect("mission");
            }}
            className="text-left"
          >
            <GlowPill active={active === "mission"}>Mission</GlowPill>
          </button>

          <button
            type="button"
            onClick={() => {
              setPinned((p) => !p);
              onSelect("vision");
            }}
            className="text-left"
          >
            <GlowPill active={active === "vision"}>Vision</GlowPill>
          </button>

          <button
            type="button"
            onClick={() => {
              setPinned((p) => !p);
              onSelect("safety");
            }}
            className="text-left"
          >
            <GlowPill active={active === "safety"}>Food safety</GlowPill>
          </button>

          <div className="mt-1 flex items-center justify-between px-1">
            <div className="text-[10px] font-extrabold text-slate-400">{pinned ? "Pinned" : "Hover / click"}</div>
            <button
              type="button"
              onClick={() => setPinned((p) => !p)}
              className="text-[10px] font-extrabold text-slate-500 hover:text-slate-800 transition"
            >
              {pinned ? "Unpin" : "Pin"}
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export default function MissionPage() {
  const [active, setActive] = useState<"mission" | "vision" | "safety">("mission");

  // ✅ unified responsive header menu (mobile-only icon, never shows on desktop)
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
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

  const navLinks = useMemo(
    () => [
      { href: "/", label: "Home", variant: "ghost" as const },
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

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ✅ Fixed header with responsive menu */}
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
                  <LogoCinematic size={64} wordScale={1} />
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
      </div>

      {/* Spacer so content doesn't go under fixed header */}
      <div className="h-[84px]" />

      {/* ✅ Side nav (fade unless hovered/pinned) */}
      <SideFadeNav active={active} onSelect={setActive} />

      {/* SECTION 1 */}
      <CinematicSection
        label="Mission"
        title="Why we started"
        highlight="PeerPlates."
        onInView={() => setActive("mission")}
        body="University life moves fast — and cooking proper meals consistently just wasn’t realistic. Takeaways were expensive, meal-prep often felt like poor value… and not the kind of food we actually craved."
        accentFrom={BRAND_ORANGE}
        accentTo={BRAND_BROWN}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.55 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mx-auto max-w-4xl"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/75 backdrop-blur p-6 sm:p-7 shadow-sm">
              <div className="text-sm font-extrabold text-slate-500">The moment it clicked</div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">
                The solution already existed — it just wasn’t easy to access.
              </div>
              <div className="mt-3 text-slate-600 font-semibold leading-relaxed">
                We ordered a big bowl of jollof rice from a local home cook — and realised: authentic, great-value food is
                nearby… but discovery + ordering needed to feel effortless.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white/75 backdrop-blur p-6 sm:p-7 shadow-sm">
              <div className="text-sm font-extrabold text-slate-500">What PeerPlates is</div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">
                A community-driven marketplace for home cooks & bakers.
              </div>
              <div className="mt-3 text-slate-600 font-semibold leading-relaxed">
                Independent vendors sell authentic, affordable meals to nearby customers — built for speed, clarity, and
                trust.
              </div>
            </div>
          </div>
        </motion.div>
      </CinematicSection>

      {/* SECTION 2 */}
      <CinematicSection
        label="Vision"
        title="Our mission is"
        highlight="two-sided."
        onInView={() => setActive("vision")}
        body="We’re building a platform that works for both sides of the marketplace — vendors and customers — with the same level of care."
        accentFrom={BRAND_BROWN}
        accentTo={BRAND_ORANGE}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.55 }}
          transition={{ duration: 0.75, delay: 0.05 }}
          className="mx-auto max-w-5xl"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white/75 backdrop-blur p-7 shadow-sm">
              <div className="absolute -top-14 -right-14 h-56 w-56 rounded-full blur-3xl opacity-25" style={{ background: BRAND_ORANGE }} />
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white/80 flex items-center justify-center shadow-sm">
                  <VendorIcon className="h-7 w-7 text-slate-900" />
                </div>
                <div className="text-lg font-extrabold">For vendors</div>
              </div>
              <div className="mt-4 text-slate-600 font-semibold leading-relaxed">
                To empower local food entrepreneurs with the tools, visibility, and support to grow — turning passion into
                meaningful income.
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white/75 backdrop-blur p-7 shadow-sm">
              <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full blur-3xl opacity-20" style={{ background: BRAND_BROWN }} />
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white/80 flex items-center justify-center shadow-sm">
                  <CustomerIcon className="h-7 w-7 text-slate-900" />
                </div>
                <div className="text-lg font-extrabold">For customers</div>
              </div>
              <div className="mt-4 text-slate-600 font-semibold leading-relaxed">
                To make it easy to find great-value, home-cooked meals that taste authentic — made with real warmth, not
                factory production.
              </div>
            </div>
          </div>
        </motion.div>
      </CinematicSection>

      {/* SECTION 3 */}
      <CinematicSection
        label="Food safety"
        title="Food safety comes"
        highlight="first."
        onInView={() => setActive("safety")}
        body="Food safety isn’t optional on PeerPlates — it’s the baseline. Customers can trust every order comes from a vendor who meets clear UK health & safety requirements."
        accentFrom={BRAND_ORANGE}
        accentTo={BRAND_BROWN}
      >
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.55 }}
          transition={{ duration: 0.75, delay: 0.05 }}
          className="mx-auto max-w-5xl"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[34px] border border-slate-200 bg-white/75 backdrop-blur p-7 shadow-sm">
              <div className="text-sm font-extrabold text-slate-500">Before selling on PeerPlates</div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">Every vendor must:</div>

              <ul className="mt-4 space-y-3 text-slate-600 font-semibold">
                {[
                  "Register their food business with their local council",
                  "Complete Level 2 Food Hygiene Certification",
                  "Have a Food Safety Management System in place (e.g., SFBB / HACCP-style plan)",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="mt-1.5 h-2.5 w-2.5 rounded-full shrink-0" style={{ background: BRAND_ORANGE }} />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[34px] border border-slate-200 bg-white/75 backdrop-blur p-7 shadow-sm">
              <div className="text-sm font-extrabold text-slate-500">Ongoing support & standards</div>
              <div className="mt-2 text-lg font-extrabold text-slate-900">Standards stay high as vendors scale.</div>
              <div className="mt-4 text-slate-600 font-semibold leading-relaxed">
                Our team works closely with vendors as they grow — with priority onboarding, practical guidance, and clear
                resources on best-practice food safety, so quality remains consistent as businesses expand.
              </div>

              <div className="mt-6 flex items-center gap-3 text-sm font-extrabold text-slate-700">
                <span className="h-2 w-2 rounded-full" style={{ background: BRAND_BROWN }} />
                Safety checks built into onboarding
              </div>
            </div>
          </div>
        </motion.div>
      </CinematicSection>

      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="border-t border-slate-200 py-10 text-sm text-slate-500">© {new Date().getFullYear()} PeerPlates</div>
      </div>
    </main>
  );
}
