// src/app/privacy/page.tsx
"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import { motion, useInView, useScroll, useTransform, useMotionTemplate } from "framer-motion";
import LogoCinematic from "@/app/ui/LogoCinematic";
import { MotionDiv } from "@/app/ui/motion";

const BRAND_ORANGE = "#fcb040";
const BRAND_BROWN = "#8a6b43";

function cn(...v: Array<string | false | undefined | null>) {
  return v.filter(Boolean).join(" ");
}

function Section({
  title,
  children,
  id,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.35, margin: "-10% 0px -20% 0px" });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.55, ease: [0.2, 0.9, 0.2, 1] }}
      className="scroll-mt-28"
    >
      <div className="rounded-[34px] border border-slate-200 bg-white/80 backdrop-blur p-6 sm:p-7 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND_ORANGE }} />
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">{title}</h2>
        </div>
        <div className="mt-4 text-slate-700 font-semibold leading-relaxed">{children}</div>
      </div>
    </motion.section>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3">
          <span
            className="mt-2 h-2 w-2 rounded-full shrink-0"
            style={{ background: BRAND_ORANGE }}
          />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.65, 1], [1, 1, 0.06]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -24]);
  const blur = useTransform(scrollYProgress, [0, 0.85, 1], [0, 0, 10]);
  const filter = useMotionTemplate`blur(${blur}px)`;

  const gradientStyle = useMemo(
    () => ({
      backgroundImage: `linear-gradient(90deg, ${BRAND_ORANGE}, ${BRAND_BROWN})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    }),
    []
  );

  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Cinematic background */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
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

      {/* Top bar */}
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-between gap-4"
        >
          <Link href="/" className="flex items-center">
            <LogoCinematic size={56} wordScale={1} />
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/join"
              className="rounded-2xl border border-slate-200 px-5 py-2.5 font-semibold hover:bg-slate-50 transition whitespace-nowrap shadow-sm"
            >
              Back to join
            </Link>
          </div>
        </MotionDiv>
      </div>

      {/* Hero */}
      <section ref={heroRef as any} className="relative">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pb-10">
          <motion.div
            style={{ opacity: heroOpacity, y: heroY, filter }}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.2, 0.9, 0.2, 1] }}
            className="rounded-[36px] border border-slate-200 bg-white/80 backdrop-blur p-7 sm:p-9 shadow-sm"
            >
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-extrabold text-slate-700 shadow-sm">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: BRAND_ORANGE }} />
              Privacy Notice
            </div>

            <h1 className="mt-6 font-extrabold tracking-tight leading-[0.95] text-[clamp(2.1rem,4.8vw,3.6rem)]">
              PeerPlates{" "}
              <span style={gradientStyle}>Privacy Notice</span>{" "}
              <span className="text-slate-900">for the Waitlist</span>
            </h1>

            <p className="mt-4 max-w-3xl text-slate-600 font-semibold leading-relaxed">
              Effective date: <span className="text-slate-900 font-extrabold">1 January 2026</span>. PeerPlates Ltd
              (“PeerPlates”, “we”, “us”) is committed to protecting your personal data. This notice explains what we
              collect, why we collect it, and your rights under UK data protection law.
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              {[
                ["who", "Who we are"],
                ["data", "What we collect"],
                ["use", "How we use it"],
                ["legal", "Legal bases"],
                ["share", "Sharing"],
                ["intl", "International transfers"],
                ["retain", "Retention"],
                ["rights", "Your rights"],
                ["cookies", "Cookies"],
                ["updates", "Updates"],
              ].map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={cn(
                    "rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs sm:text-sm font-extrabold text-slate-700 shadow-sm backdrop-blur",
                    "hover:bg-white transition"
                  )}
                >
                  {label}
                </a>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-6">
          <Section id="who" title="1) Who we are">
            <div className="space-y-3">
              <p>
                <span className="font-extrabold text-slate-900">Data controller:</span> PEERPLATES LTD, a company
                incorporated in England and Wales with company number 16603623, whose registered office is at 71 - 75
                Shelton Street, Covent Garden, London, United Kingdom, WC2H 9JQ (the “Company”).
              </p>
              <p>
                <span className="font-extrabold text-slate-900">Contact:</span> support@peerplates.co.uk
              </p>
            </div>
          </Section>

          <Section id="data" title="2) What data we collect">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-extrabold text-slate-500">Information you provide</div>
                <BulletList
                  items={[
                    "Name and email",
                    "Student status and (if applicable) university",
                    "Food preferences (e.g., top cuisines, dietary preferences, what you want from PeerPlates)",
                    "Vendor details (e.g., what you sell/would like to sell, closest student hub, travel time by bus, postcode area (optional), readiness/compliance tick-boxes, weekly portions, typical price range, and whether you currently sell)",
                  ]}
                />
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-500">Referral and waitlist data</div>
                <BulletList
                  items={[
                    "Your unique referral link/code",
                    "Who referred you (if you joined via a referral link)",
                    "Your waitlist position and referral count (to show you queue progress)",
                  ]}
                />
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-500">Technical data (website use)</div>
                <BulletList
                  items={[
                    "Device and browser information",
                    "Approximate location (based on IP address)",
                    "Pages visited and sign-up source tracking (e.g., QR codes, influencer links, social media)",
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section id="use" title="3) How we use your data (and why)">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-extrabold text-slate-500">Run the waitlist and referral system</div>
                <BulletList
                  items={[
                    "Register you on the correct waitlist (vendor or consumer)",
                    "Provide a referral link and credit referrals",
                    "Show your queue position and progress",
                    "Prevent spam and referral abuse",
                  ]}
                />
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-500">Plan and improve PeerPlates (strategy)</div>
                <BulletList
                  items={[
                    "Understand what cuisines/categories are in demand",
                    "Understand where vendors are located relative to Nottingham student hubs",
                    "Decide which vendor types to prioritise for launch",
                    "Shape product decisions, onboarding, and marketing",
                  ]}
                />
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-500">Communicate with you</div>
                <BulletList
                  items={[
                    "Send confirmation and service updates about the waitlist",
                    "Send marketing messages where you have opted in (or where permitted by law)",
                  ]}
                />
              </div>

              <div>
                <div className="text-sm font-extrabold text-slate-500">Keep things safe and lawful</div>
                <BulletList items={["Security, fraud prevention, and troubleshooting", "Comply with legal obligations"]} />
              </div>
            </div>
          </Section>

          <Section id="legal" title="4) Our legal bases (UK GDPR)">
            <BulletList
              items={[
                "Consent (e.g., marketing emails; some optional cookies/tracking)",
                "Legitimate interests (e.g., operating the waitlist/referrals, showing queue position, planning launch strategy, preventing fraud, improving the service)",
                "Legal obligation (where we must comply with the law)",
              ]}
            />
          </Section>

          <Section id="share" title="5) Who we share data with">
            <div className="space-y-3">
              <p>We may share your data with trusted service providers who help us operate the waitlist and website, such as:</p>
              <BulletList
                items={[
                  "Email and CRM providers",
                  "Website hosting providers",
                  "Analytics and performance tools",
                  "Fraud/spam prevention tools",
                ]}
              />
              <p className="mt-2">
                <span className="font-extrabold text-slate-900">We do not sell</span> your personal data.
              </p>
            </div>
          </Section>

          <Section id="intl" title="6) International transfers">
            <p>
              Some suppliers may store or process data outside the UK. Where this happens, we use appropriate safeguards
              to protect your data.
            </p>
          </Section>

          <Section id="retain" title="7) How long we keep your data">
            <div className="space-y-3">
              <p>We keep waitlist data only for as long as needed to:</p>
              <BulletList
                items={[
                  "run the waitlist and referral features",
                  "contact you about launch and updates",
                  "analyse waitlist demand for planning",
                ]}
              />
              <p>We may anonymise data (so it no longer identifies you) for longer-term reporting.</p>
            </div>
          </Section>

          <Section id="rights" title="8) Your rights">
            <div className="space-y-3">
              <p>You can request to:</p>
              <BulletList
                items={[
                  "access your data",
                  "correct it",
                  "delete it",
                  "object to certain processing",
                  "withdraw consent (for example, marketing)",
                ]}
              />
              <p>
                You can also complain to the UK Information Commissioner’s Office (ICO) if you believe we have handled
                your data improperly.
              </p>
            </div>
          </Section>

          <Section id="cookies" title="9) Cookies and tracking">
            <div className="space-y-3">
              <p>We use cookies and similar tools to:</p>
              <BulletList
                items={[
                  "make the site work",
                  "understand performance",
                  "measure where sign-ups come from (e.g., QR codes and influencer links)",
                ]}
              />
              <p>
                Where required, we will ask for consent for non-essential cookies, and you can change your preferences
                later.
              </p>
            </div>
          </Section>

          <Section id="updates" title="10) Updates to this notice">
            <p>
              We may update this notice as PeerPlates evolves. We’ll post the latest version on our website with a new
              effective date.
            </p>
          </Section>
        </div>

        {/* Footer */}
        <div className="mt-10 border-t border-slate-200 pt-8 text-sm text-slate-500">
          © {new Date().getFullYear()} PeerPlates
        </div>
      </div>
    </main>
  );
}
