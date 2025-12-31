// src/app/join/page.tsx
import Link from "next/link";
import LogoCinematic from "@/app/ui/LogoCinematic";
import { MotionDiv } from "@/app/ui/motion";

export const metadata = {
  title: "Join Waitlist | PeerPlates",
};

function ConsumerIcon({ className = "" }: { className?: string }) {
  // simple “person” icon (no chef hat)
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
      <path
        d="M12 12.9c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4Z"
        fill="currentColor"
      />
      <path
        d="M12 14.2c-4.2 0-7.6 2.6-7.6 5.9V21h15.2v-.9c0-3.3-3.4-5.9-7.6-5.9Z"
        fill="currentColor"
        opacity="0.95"
      />
    </svg>
  );
}

function VendorIcon({ className = "" }: { className?: string }) {
  // simple “chef hat + person” icon
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

export default async function JoinPage({
  searchParams,
}: {
  searchParams?: Promise<{ ref?: string }>;
}) {
  const sp = (await searchParams) || {};
  const ref = String(sp.ref || "").trim();

  const consumerHref = ref ? `/join/consumer?ref=${encodeURIComponent(ref)}` : "/join/consumer";
  const vendorHref = ref ? `/join/vendor?ref=${encodeURIComponent(ref)}` : "/join/vendor";

  return (
    <main className="min-h-screen bg-white text-slate-900">
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

          <div className="text-sm text-slate-900/60 whitespace-nowrap">Join waitlist</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 sm:mt-10 rounded-3xl border border-[#fcb040] bg-white p-6 sm:p-8 shadow-sm"
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
              <span className="font-semibold">Referral detected:</span>{" "}
              <span className="font-mono">{ref}</span>
            </div>
          ) : null}

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {/* Consumer */}
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
                  <div className="mt-1 text-slate-900/70 font-semibold">
                    Buy food • Refer friends • Move up
                  </div>
                </div>
              </div>

              <div className="mt-6 h-[2px] w-36 bg-slate-200 group-hover:w-44 transition-all" />
            </Link>

            {/* Vendor */}
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
                  <div className="mt-1 text-slate-900/70 font-semibold">
                    Sell food • Review • Queue position
                  </div>
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
