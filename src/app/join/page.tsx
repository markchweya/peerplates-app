// src/app/join/page.tsx
import Link from "next/link";
import { MotionDiv } from "@/app/ui/motion";

export const metadata = {
  title: "Join Waitlist | PeerPlates",
};

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
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-between gap-4"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl" style={{ background: "#fcb040" }} />
            <div className="text-lg font-semibold tracking-tight">PeerPlates</div>
          </Link>
          <div className="text-sm text-slate-900/60 whitespace-nowrap">Join waitlist</div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 sm:mt-10 rounded-3xl border border-[#fcb040] bg-white p-6 sm:p-7 shadow-sm"
        >
          <h1 className="font-extrabold tracking-tight leading-tight text-[clamp(2.2rem,4vw,3rem)]">
            Choose your role
          </h1>
          <p className="mt-2 text-slate-900/70">
            Consumers move up by referrals. Vendors are reviewed via questionnaire.
          </p>

          {ref ? (
            <div className="mt-4 rounded-2xl border border-[#fcb040] bg-white p-4 text-sm">
              <span className="font-semibold">Referral detected:</span>{" "}
              <span className="font-mono">{ref}</span>
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href={consumerHref}
              className="rounded-2xl border border-[#fcb040] bg-white p-6 shadow-sm transition hover:-translate-y-[2px]"
            >
              <div className="text-xl font-extrabold">Consumer</div>
              <div className="mt-2 text-slate-900/70 font-semibold">
                Buy food • Refer friends • Move up the queue
              </div>
            </Link>

            <Link
              href={vendorHref}
              className="rounded-2xl border border-[#fcb040] bg-white p-6 shadow-sm transition hover:-translate-y-[2px]"
            >
              <div className="text-xl font-extrabold">Vendor</div>
              <div className="mt-2 text-slate-900/70 font-semibold">
                Sell food • Questionnaire review • Manual queue position
              </div>
            </Link>
          </div>

          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex rounded-2xl border border-[#fcb040] bg-white px-6 py-3 text-center font-extrabold text-slate-900 transition hover:-translate-y-[1px]"
            >
              Back
            </Link>
          </div>
        </MotionDiv>
      </div>
    </main>
  );
}
