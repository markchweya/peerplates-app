import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#fcb040]" />
            <div className="font-semibold">PeerPlates</div>
          </div>

          <Link
            href="/join"
            className="rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50"
          >
            Join waitlist
          </Link>
        </div>

        {/* Hero */}
        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-[#fcb040]" />
              A peer-to-peer food platform
            </div>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Discover great food from local vendors — and get early access.
            </h1>

            <p className="mt-4 max-w-xl text-lg text-slate-600">
              Join the waitlist as a consumer or a vendor. Consumers can move up the
              queue by referring friends.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/join?role=consumer"
                className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 shadow-sm hover:opacity-95"
              >
                I’m a Consumer
              </Link>

              <Link
                href="/join?role=vendor"
                className="rounded-2xl border border-slate-200 px-6 py-3 text-center font-extrabold hover:bg-slate-50"
              >
                I’m a Vendor
              </Link>
            </div>

            <div className="mt-6 text-sm text-slate-500">
              Orange: <span className="font-semibold">#fcb040</span> • Clean white UI
            </div>
          </div>

          {/* Right card */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-sm font-semibold text-slate-700">What you get</div>

            <div className="mt-4 grid gap-3">
              {[
                "Early access to the app",
                "A transparent queue position",
                "Consumer referrals move you up",
                "Vendors reviewed using questionnaire",
              ].map((x) => (
                <div
                  key={x}
                  className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
                >
                  <div className="mt-1 h-3 w-3 rounded-full bg-[#fcb040]" />
                  <div className="font-semibold text-slate-800">{x}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-700">Next</div>
              <div className="mt-1 text-slate-600">
                We’ll build the join page + questionnaire next.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-slate-200 pt-6 text-sm text-slate-500">
          © {new Date().getFullYear()} PeerPlates
        </div>
      </div>
    </main>
  );
}
