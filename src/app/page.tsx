import Link from "next/link";
import { MotionDiv, MotionP, MotionH1 } from "@/app/ui/motion";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* Top bar */}
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#fcb040]" />
            <div className="text-lg font-semibold tracking-tight">PeerPlates</div>
          </div>

          <Link
            href="/join"
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50 transition whitespace-nowrap"
          >
            Join waitlist
          </Link>
        </MotionDiv>

        {/* Hero */}
        <div className="mt-10 sm:mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <MotionDiv
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <span className="h-2 w-2 rounded-full bg-[#fcb040]" />
              A peer-to-peer food platform
            </MotionDiv>

            <MotionH1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.12 }}
              className="mt-5 font-extrabold tracking-tight leading-[1.05] text-[clamp(2.1rem,4.8vw,3.6rem)]"
            >
              Discover great food from local vendors — and get early access.
            </MotionH1>

            <MotionP
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="mt-4 max-w-xl text-base sm:text-lg text-slate-600"
            >
              Join the waitlist as a consumer or a vendor. Consumers can move up
              the queue by referring friends.
            </MotionP>

            <MotionDiv
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.28 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
            >
              <Link
                href="/join/consumer"
                className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 shadow-sm transition hover:opacity-95 hover:-translate-y-[1px]"
              >
                I’m a Consumer
              </Link>

              <Link
                href="/join/vendor"
                className="rounded-2xl border border-slate-200 px-6 py-3 text-center font-extrabold transition hover:bg-slate-50 hover:-translate-y-[1px]"
              >
                I’m a Vendor
              </Link>
            </MotionDiv>
          </div>

          {/* Right card (updated) */}
          <MotionDiv
            initial={{ opacity: 0, x: 22 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.18 }}
            className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-[#fcb040]/10 p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-700">
                  How it works
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  Join in under a minute. Get a spot. Share your link.
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#fcb040]" />
                Nottingham launch
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-5 grid gap-3">
              {[
                {
                  n: "1",
                  t: "Choose your path",
                  d: "Join as a consumer or a vendor.",
                },
                {
                  n: "2",
                  t: "Answer required questions",
                  d: "No partial sign-ups — only complete entries count.",
                },
                {
                  n: "3",
                  t: "Get your referral link",
                  d: "Share it on WhatsApp, iMessage, TikTok, IG DMs.",
                },
                {
                  n: "4",
                  t: "Move up the queue",
                  d: "Consumers climb via referrals. Vendors are reviewed for readiness.",
                },
              ].map((s, i) => (
                <MotionDiv
                  key={s.n}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.22 + i * 0.06 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#fcb040] text-slate-900 font-extrabold">
                      {s.n}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">{s.t}</div>
                      <div className="mt-0.5 text-sm text-slate-600">{s.d}</div>
                    </div>
                  </div>
                </MotionDiv>
              ))}
            </div>

            {/* Queue preview (replaces the Consumer/Vendor + privacy blocks) */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500">
                    Queue preview
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    Share your link to climb faster
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Consumers get referral boosts. Vendors are reviewed for launch
                    readiness.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Consumer boosts
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    Vendor review
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Join</span>
                  <span>Invite friends</span>
                  <span>Early access</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full w-[56%] rounded-full bg-[#fcb040]" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {["+1", "+3", "+5", "+10"].map((x) => (
                    <span
                      key={x}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      {x}
                    </span>
                  ))}
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    boosts (consumer)
                  </span>
                </div>
              </div>

              <div className="mt-4 text-xs text-slate-500 leading-relaxed">
                By joining, you agree to our{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/terms"
                  className="font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
                >
                  Terms
                </Link>
                . Marketing consent is optional during signup.
              </div>
            </div>
          </MotionDiv>
        </div>

        <div className="mt-14 sm:mt-16 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} PeerPlates
        </div>
      </div>
    </main>
  );
}
