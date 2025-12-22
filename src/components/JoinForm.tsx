"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MotionDiv } from "@/app/ui/motion";
import SelectField from "@/components/fields/SelectField";

type Question = {
  key: string;
  label: string;
  required?: boolean;
  type?: "text" | "email" | "tel" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
};

type Props = {
  role: "consumer" | "vendor";
  title: string;
  subtitle: string;
  questions: Question[];
};

export default function JoinForm({ role, title, subtitle, questions }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const ref = (sp.get("ref") || "").trim();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const initialAnswers = useMemo(() => {
    const obj: Record<string, string> = {};
    for (const q of questions) obj[q.key] = "";
    return obj;
  }, [questions]);

  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const onChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const validate = () => {
    if (!fullName.trim()) return "Please enter your full name.";
    if (!email.trim()) return "Please enter your email.";

    for (const q of questions) {
      if (q.required && !String(answers[q.key] ?? "").trim()) {
        return `Please answer: ${q.label}`;
      }
    }
    return "";
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          ref: ref || null,
          answers,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Signup failed. Try again.");

      const qp = new URLSearchParams();
      if (data?.id) qp.set("id", data.id);
      if (data?.referral_code) qp.set("code", data.referral_code);
      router.push(`/thanks?${qp.toString()}`);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "h-12 w-full rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)] placeholder:text-slate-500";
  const textareaBase =
    "w-full rounded-2xl border border-[#fcb040] bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)] placeholder:text-slate-500 min-h-[110px]";

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
          <div className="text-sm text-slate-900 font-semibold whitespace-nowrap">
            {role === "consumer" ? "Consumer" : "Vendor"} waitlist
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 sm:mt-10 rounded-3xl border border-[#fcb040] bg-white p-5 sm:p-7 shadow-sm"
        >
          <h1 className="font-extrabold tracking-tight leading-tight text-[clamp(1.8rem,3.5vw,2.2rem)]">
            {title}
          </h1>
          <p className="mt-2 text-slate-900/70 text-sm sm:text-base">{subtitle}</p>

          {ref ? (
            <div className="mt-4 rounded-2xl border border-[#fcb040] bg-white p-4 text-sm">
              <span className="font-semibold">Referral detected:</span>{" "}
              <span className="font-mono">{ref}</span>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 grid gap-4">
            {/* Basics */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Full name *</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputBase}
                  placeholder="e.g. Christine Gesare"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold">Email *</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputBase}
                  placeholder="you@email.com"
                  type="email"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputBase}
                placeholder="+254..."
                type="tel"
              />
            </div>

            {/* Questions */}
            <div className="mt-2 grid gap-4">
              {questions.map((q) => {
                const val = answers[q.key] ?? "";

                if (q.type === "select") {
                  return (
                    <SelectField
                      key={q.key}
                      label={q.label}
                      required={q.required}
                      value={val}
                      onChange={(v) => onChange(q.key, v)}
                      options={q.options || []}
                    />
                  );
                }

                return (
                  <div key={q.key} className="grid gap-2">
                    <label className="text-sm font-semibold">
                      {q.label} {q.required ? "*" : ""}
                    </label>

                    {q.type === "textarea" ? (
                      <textarea
                        value={val}
                        onChange={(e) => onChange(q.key, e.target.value)}
                        className={textareaBase}
                        placeholder={q.placeholder || ""}
                      />
                    ) : (
                      <input
                        value={val}
                        onChange={(e) => onChange(q.key, e.target.value)}
                        className={inputBase}
                        placeholder={q.placeholder || ""}
                        type={q.type || "text"}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {error ? (
              <div className="mt-2 rounded-2xl border border-[#fcb040] bg-white p-4 text-sm text-slate-900">
                {error}
              </div>
            ) : null}

            <div className="mt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px] disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {submitting ? "Submitting..." : "Join waitlist"}
              </button>

              <Link
                href="/"
                className="rounded-2xl border border-[#fcb040] bg-white px-6 py-3 text-center font-extrabold text-slate-900 transition hover:-translate-y-[1px]"
              >
                Back
              </Link>
            </div>

            <div className="text-xs text-slate-900/60">
              By submitting, you agree to receive updates about early access.
            </div>
          </form>
        </MotionDiv>
      </div>
    </main>
  );
}
