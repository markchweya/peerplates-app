"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Role = "consumer" | "vendor";

export default function JoinPage() {
  const sp = useSearchParams();
  const roleFromUrl = (sp.get("role") || "") as Role;

  const defaultRole: Role = useMemo(() => {
    return roleFromUrl === "vendor" ? "vendor" : "consumer";
  }, [roleFromUrl]);

  const [role, setRole] = useState<Role>(defaultRole);

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#fcb040]" />
            <div className="font-semibold">PeerPlates</div>
          </Link>
          <div className="text-sm text-slate-500">Join waitlist</div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-extrabold tracking-tight">Choose your role</h1>
          <p className="mt-2 text-slate-600">
            Consumers can move up by referrals. Vendors are reviewed via questionnaire.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setRole("consumer")}
              className={`rounded-2xl border p-4 text-left font-extrabold ${
                role === "consumer"
                  ? "border-[#fcb040] bg-[#fff7ed]"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              Consumer
              <div className="mt-1 text-sm font-semibold text-slate-600">
                Buy food • Refer friends • Move up the queue
              </div>
            </button>

            <button
              onClick={() => setRole("vendor")}
              className={`rounded-2xl border p-4 text-left font-extrabold ${
                role === "vendor"
                  ? "border-[#fcb040] bg-[#fff7ed]"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              Vendor
              <div className="mt-1 text-sm font-semibold text-slate-600">
                Sell food • Questionnaire review • Manual queue position
              </div>
            </button>
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href={`/join/${role}`}
              className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 hover:opacity-95"
            >
              Continue
            </Link>
            <Link
              href="/"
              className="rounded-2xl border border-slate-200 px-6 py-3 text-center font-extrabold hover:bg-slate-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
