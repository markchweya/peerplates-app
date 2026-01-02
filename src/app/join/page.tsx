// src/app/join/page.tsx
import Link from "next/link";
import LogoCinematic from "@/app/ui/LogoCinematic";
import { MotionDiv } from "@/app/ui/motion";

export const metadata = {
  title: "Join Waitlist | PeerPlates",
};

function ConsumerIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path d="M12 12.9c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Z" fill="currentColor" />
      <path
        d="M12 14.2c-4.2 0-7.6 2.6-7.6 5.9V21h15.2v-.9c0-3.3-3.4-5.9-7.6-5.9Z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}

function VendorIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M7.4 9.2C7 6.7 8.9 5 11.5 5c2.7 0 4.5 1.7 4.1 4.2.5-.1 1-.1 1.5.1 1.1.5 1.6 1.8 1.1 2.9-.4 1-1.4 1.6-2.5 1.4H7.3c-1.1.2-2.1-.4-2.5-1.4-.5-1.1 0-2.4 1.1-2.9.5-.2 1-.2 1.5-.1Z"
        fill="currentColor"
        opacity="0.95"
      />
      <path
        d="M12 14.1c-4.1 0-7.4 2.5-7.4 5.7V21h14.8v-1.2c0-3.2-3.3-5.7-7.4-5.7Z"
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

const ORANGE = "#fcb040";
const BROWN = "#8a6b43";

function FoodIcon({ className = "" }: { className?: string }) {
  // plate + fork/spoon vibe (same feel across pages)
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Plate */}
      <circle cx="13" cy="12" r="6.25" />
      {/* Table line */}
      <path d="M4 19h18" />
      {/* Spoon/fork stylised */}
      <path d="M6.5 4.5c1.7 0 3 1.4 3 3.1 0 1.1-.6 2.1-1.5 2.7v8.7" />
      <path d="M6.5 4.5c-1.7 0-3 1.4-3 3.1 0 1.1.6 2.1 1.5 2.7v8.7" />
    </svg>
  );
}

export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const sp = (await searchParams) || {};
  const ref = String(sp.ref || "").trim();

  const consumerHref = ref ? `/join/consumer?ref=${encodeURIComponent(ref)}` : "/join/consumer";
  const vendorHref = ref ? `/join/vendor?ref=${encodeURIComponent(ref)}` : "/join/vendor";

  const navLinks = [
    { href: "/", label: "Home", variant: "ghost" as const },
    { href: "/mission", label: "Mission", variant: "ghost" as const },
    { href: "/faq", label: "FAQ", variant: "ghost" as const },
    { href: "/privacy", label: "Privacy", variant: "ghost" as const },
    { href: "/queue", label: "Check queue", variant: "ghost" as const },
    { href: "/join", label: "Join waitlist", variant: "primary" as const },
  ];

  const btnBase =
    "inline-flex items-center justify-center rounded-2xl px-5 py-2.5 font-extrabold shadow-sm transition hover:-translate-y-[1px] whitespace-nowrap";
  const btnGhost = "border border-slate-200 bg-white/90 backdrop-blur text-slate-900 hover:bg-slate-50";
  const btnPrimary = "bg-[#fcb040] text-slate-900 hover:opacity-95";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* ✅ HARD GUARANTEE: correct visibility even if Tailwind breakpoints misbehave */}
      <style>{`
        @media (min-width: 768px) {
          .pp-mobile-menu { display: none !important; }
        }
        @media (max-width: 767px) {
          .pp-desktop-nav { display: none !important; }
        }
        summary::-webkit-details-marker { display: none; }
      `}</style>

      {/* Header */}
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
              <div className="pp-desktop-nav hidden md:flex items-center gap-3 ml-auto">
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

              {/* Mobile menu button: ICON ONLY (no visible “Menu” text) */}
              <div className="pp-mobile-menu md:hidden ml-auto shrink-0">
                <details className="relative">
                  <summary
                    aria-label="Open menu"
                    className={[
                      "list-none cursor-pointer select-none",
                      "inline-flex items-center justify-center",
                      "rounded-full border border-slate-200 bg-white/95 backdrop-blur",
                      "h-10 w-10 shadow-sm transition hover:-translate-y-[1px]",
                      "text-slate-900",
                    ].join(" ")}
                  >
                    <FoodIcon className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </summary>

                  <div className="absolute right-0 mt-3 w-[min(92vw,420px)] origin-top-right">
                    <div
                      className="rounded-[28px] border border-slate-200 bg-white/92 backdrop-blur p-4 shadow-sm"
                      style={{ boxShadow: "0 18px 60px rgba(2,6,23,0.10)" }}
                    >
                      <div className="grid gap-2">
                        {navLinks.map((l) => (
                          <Link
                            key={l.href}
                            href={l.href}
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
                </details>
              </div>
            </MotionDiv>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-[84px]" />

      {/* Content */}
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-2 sm:mt-4 rounded-3xl border border-[#fcb040] bg-white p-6 sm:p-8 shadow-sm"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#fcb040]" />
            Choose your role
          </div>

          <h1 className="mt-6 font-extrabold tracking-tight leading-[0.95] text-[clamp(2.4rem,5vw,4.2rem)]">
            Eat better.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: `linear-gradient(90deg, ${ORANGE}, ${BROWN})` }}
            >
              Join the waitlist.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl text-slate-900/70 font-semibold leading-relaxed">
            Consumers move up by referrals. Vendors are reviewed via questionnaire — built for safety, trust, and real
            home-cooked food.
          </p>

          {ref ? (
            <div className="mt-6 rounded-2xl border border-[#fcb040] bg-white p-4 text-sm">
              <span className="font-semibold">Referral detected:</span> <span className="font-mono">{ref}</span>
            </div>
          ) : null}

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Link
              href={consumerHref}
              className="group rounded-[34px] border border-[#fcb040]/55 bg-white p-7 shadow-sm transition hover:-translate-y-[2px]"
              style={{ boxShadow: "0 18px 50px rgba(2,6,23,0.08)" }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                  <ConsumerIcon className="h-7 w-7 text-slate-900" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-extrabold">Consumer</div>
                  <div className="mt-1 text-slate-900/70 font-semibold">Buy food • Refer friends • Move up</div>
                </div>
              </div>
              <div className="mt-6 h-[2px] w-36 bg-slate-200 group-hover:w-44 transition-all" />
            </Link>

            <Link
              href={vendorHref}
              className="group rounded-[34px] border border-[#fcb040]/55 bg-white p-7 shadow-sm transition hover:-translate-y-[2px]"
              style={{ boxShadow: "0 18px 50px rgba(2,6,23,0.08)" }}
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shadow-sm">
                  <VendorIcon className="h-7 w-7 text-slate-900" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-extrabold">Vendor</div>
                  <div className="mt-1 text-slate-900/70 font-semibold">Sell food • Review • Queue position</div>
                </div>
              </div>
              <div className="mt-6 h-[2px] w-36 bg-slate-200 group-hover:w-44 transition-all" />
            </Link>
          </div>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex rounded-2xl border border-[#fcb040] bg-white px-7 py-3 text-center font-extrabold text-slate-900 transition hover:-translate-y-[1px]"
            >
              Back
            </Link>
          </div>
        </MotionDiv>
      </div>
    </main>
  );
}
