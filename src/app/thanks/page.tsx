"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MotionDiv } from "@/app/ui/motion";

export default function ThanksPage() {
  return (
    <Suspense fallback={<ThanksFallback />}>
      <ThanksInner />
    </Suspense>
  );
}

function ThanksFallback() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="rounded-3xl border border-[#fcb040] bg-white p-5 sm:p-7 shadow-sm">
          <div className="text-lg font-extrabold">Loading…</div>
          <div className="mt-2 text-sm text-slate-600">Preparing your referral link.</div>
        </div>
      </div>
    </main>
  );
}

function ThanksInner() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";
  const code = sp.get("code") || "";
  const role = (sp.get("role") as "consumer" | "vendor" | null) || "consumer";

  const [baseUrl, setBaseUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Only used for consumers (Option A)
  const [position, setPosition] = useState<number | null>(null);
  const [posLoading, setPosLoading] = useState(false);

  // Client-only: safe place to access window
  useEffect(() => {
    setBaseUrl(window.location.origin);
  }, []);

  const referralLink = useMemo(() => {
    if (!code || !baseUrl) return "";
    const joinPath = role === "vendor" ? "/join/vendor" : "/join/consumer";
    return `${baseUrl}${joinPath}?ref=${encodeURIComponent(code)}`;
  }, [code, baseUrl, role]);

  // Option A: only fetch/display queue position for consumers
  useEffect(() => {
    if (!id) return;
    if (role !== "consumer") return;

    setPosLoading(true);
    fetch(`/api/queue-position?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.position === "number") setPosition(d.position);
        else setPosition(null);
      })
      .finally(() => setPosLoading(false));
  }, [id, role]);

  const copy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  const isConsumer = role === "consumer";

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
            <div className="h-10 w-10 rounded-xl bg-[#fcb040]" />
            <div className="text-lg font-semibold tracking-tight">PeerPlates</div>
          </Link>

          <div className="text-sm font-semibold text-slate-900 whitespace-nowrap">
            You’re on the waitlist ✅
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 sm:mt-10 rounded-3xl border border-[#fcb040] bg-white p-5 sm:p-7 shadow-sm"
        >
          <h1 className="text-[clamp(1.8rem,3.5vw,2.2rem)] font-extrabold tracking-tight leading-tight">
            Thanks for joining 🎉
          </h1>

          <p className="mt-2 text-slate-900/70 text-sm sm:text-base">
            We’ll email you with updates and early access.
          </p>

          {/* Consumers see queue position; vendors do not */}
          {isConsumer ? (
            <div className="mt-5 rounded-3xl border border-[#fcb040] bg-white p-4">
              <div className="text-sm font-extrabold">Your queue position</div>
              <div className="mt-1 text-2xl font-extrabold">
                {id ? (posLoading ? "Loading..." : position ? `#${position}` : "—") : "—"}
              </div>
              <div className="mt-1 text-xs text-slate-900/60">
                MVP estimate based on signup time and role.
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-[#fcb040] bg-white p-4">
              <div className="text-sm font-extrabold">Vendor review</div>
              <div className="mt-1 text-sm text-slate-900/70">
                We’ll review your application and email you as soon as you’re approved for early access.
              </div>
            </div>
          )}

          {/* Referral block */}
          {code ? (
            <div className="mt-6 grid gap-3 rounded-3xl border border-[#fcb040] bg-white p-4">
              <div className="text-sm font-extrabold">Your referral link</div>

              <div className="rounded-2xl border border-[#fcb040] bg-white px-4 py-3 font-mono text-sm break-all">
                {referralLink || "Generating link..."}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={copy}
                  disabled={!referralLink}
                  className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>

                <Link
                  href="/"
                  className="rounded-2xl border border-[#fcb040] bg-white px-6 py-3 text-center font-extrabold text-slate-900 transition hover:-translate-y-[1px]"
                >
                  Back to home
                </Link>
              </div>

              <div className="text-xs text-slate-900/60">
                Share your link with friends. Referrals will help consumers move up the queue.
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-3xl border border-[#fcb040] bg-white p-4">
              <div className="text-sm font-semibold">Your signup is saved.</div>
              <div className="mt-1 text-sm text-slate-900/70">
                (Referral code missing from the URL — that’s okay. We can still look you up by email.)
              </div>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px]"
                >
                  Back to home
                </Link>
              </div>
            </div>
          )}

          {id ? (
            <div className="mt-6 text-xs text-slate-900/50">
              Reference ID: <span className="font-mono">{id}</span>
            </div>
          ) : null}
        </MotionDiv>
      </div>
    </main>
  );
}
