import Link from "next/link";
import LogoCinematic from "@/app/ui/LogoCinematic";
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
          <Link href="/" className="flex items-center">
            {/* Fix: logo is now properly anchored (no big white box offset) */}
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
              A community-driven marketplace for authentic home-cooked meals
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
              className="mt-6 max-w-xl text-base sm:text-lg text-slate-600 leading-relaxed"
            >
              University life moves fast — PeerPlates makes it easy to find real food with real warmth
              (not factory production) while helping local vendors grow.
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
                Join fast. Get a code. Share your link. Move up.
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              {[
                { n: "1", t: "Choose your role", d: "Join as a consumer or a vendor." },
                { n: "2", t: "Complete the questionnaire", d: "Only complete entries count." },
                { n: "3", t: "Get your referral link", d: "Share it to climb faster." },
                { n: "4", t: "Food safety first", d: "Vendors meet clear UK standards." },
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

        <div className="mt-14 sm:mt-16 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} PeerPlates
        </div>
      </div>
    </main>
  );
}
