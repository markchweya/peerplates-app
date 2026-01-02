// src/app/admin/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MotionDiv } from "@/app/ui/motion";

type RoleFilter = "all" | "consumer" | "vendor";
type StatusFilter = "all" | "pending" | "reviewed" | "approved" | "rejected";
type ReviewStatus = "pending" | "reviewed" | "approved" | "rejected";

type Entry = {
  id: string;
  role: "consumer" | "vendor";
  full_name: string;
  email: string;
  phone: string | null;
  is_student: boolean | null;
  university: string | null;

  // ✅ no any
  answers: Record<string, unknown>;

  referral_code: string | null;
  referred_by: string | null;

  vendor_priority_score: number;
  vendor_queue_override: number | null;

  referrals_count?: number | null;
  referral_points?: number | null;

  certificate_url: string | null;
  certificate_signed_url?: string | null;

  // vendor clean columns
  instagram_handle?: string | null;
  bus_minutes?: number | null;
  compliance_readiness?: string[] | null;
  top_cuisines?: string[] | null;
  delivery_area?: string | null;
  dietary_preferences?: string[] | null;

  created_at: string;

  review_status: ReviewStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;

  score?: number;
};

const BRAND = "#fcb040";
const SECRET_KEY = "peerplates_admin_secret";

function getErrorMessage(e: unknown, fallback = "Something went wrong") {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return fallback;
  }
}

function safeStr(v: unknown) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function joinArr(v: unknown): string {
  if (!v) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  return String(v);
}

function normalizeAnswerValue(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function pillClass(status: ReviewStatus) {
  // orange + neutrals only
  if (status === "approved")
    return "bg-[rgba(252,176,64,0.18)] text-black border border-[rgba(252,176,64,0.55)]";
  if (status === "rejected") return "bg-black/5 text-black border border-black/10";
  if (status === "reviewed") return "bg-black/5 text-black/80 border border-black/10";
  return "bg-[rgba(252,176,64,0.12)] text-black border border-[rgba(252,176,64,0.45)]";
}

// Branded controls
const controlBase =
  "h-10 w-full rounded-2xl border border-[#fcb040] bg-white px-3 font-semibold text-black outline-none " +
  "focus:ring-4 focus:ring-[rgba(252,176,64,0.25)]";

/**
 * Custom dropdown (so we avoid the OS blue highlight from native <select>)
 */
function BrandSelect<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!open) return;
      const t = e.target as Node;
      if (btnRef.current?.parentElement && !btnRef.current.parentElement.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = options.find((o) => o.value === value)?.label ?? "";

  return (
    <div className={"relative " + className}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((x) => !x)}
        className={controlBase + " flex items-center justify-between gap-2 text-left pr-10"}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{current}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={
            "absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60 transition " +
            (open ? "rotate-180" : "")
          }
          fill="currentColor"
        >
          <path d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-[#fcb040] bg-white shadow-lg"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={
                  "w-full px-3 py-2 text-left text-sm font-semibold transition " +
                  (active
                    ? "bg-[rgba(252,176,64,0.18)] text-black"
                    : "bg-white text-black hover:bg-[rgba(252,176,64,0.12)]")
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export default function AdminPage() {
  const [adminSecret, setAdminSecret] = useState("");
  const [secretReady, setSecretReady] = useState(false);

  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");

  // Vendor-only filters
  const [maxBusMinutes, setMaxBusMinutes] = useState("");
  const [hasInstagram, setHasInstagram] = useState<"" | "true" | "false">("");
  const [compliance, setCompliance] = useState("");

  const [rows, setRows] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [selected, setSelected] = useState<Entry | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<ReviewStatus>("pending");
  const [vendorOverrideDraft, setVendorOverrideDraft] = useState<string>("");

  const showVendorFilters = role === "vendor";

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY) || "";
    if (saved) {
      setAdminSecret(saved);
      setSecretReady(true);
    }
  }, []);

  useEffect(() => {
    // if user leaves vendor, clear vendor-only filters
    if (role !== "vendor") {
      setMaxBusMinutes("");
      setHasInstagram("");
      setCompliance("");
    }
    setOffset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  // Build compliance options from the actual data (so filtering is usable)
  const complianceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      for (const item of r.compliance_readiness || []) {
        const s = String(item || "").trim();
        if (s) set.add(s);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  // ✅ Build dynamic answer columns from all rows (so Answers become table columns)
  const answerKeys = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const a = r.answers || {};
      for (const k of Object.keys(a)) {
        const key = String(k || "").trim();
        if (key) set.add(key);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const tableColCount = 10 /* fixed cols */ + answerKeys.length + 1 /* Action */;

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (role !== "all") sp.set("role", role);
    if (status !== "all") sp.set("status", status);
    if (q.trim()) sp.set("q", q.trim());

    if (showVendorFilters) {
      const mbm = maxBusMinutes.trim();
      if (mbm) sp.set("max_bus_minutes", mbm);
      if (hasInstagram) sp.set("has_instagram", hasInstagram);
      if (compliance.trim()) sp.set("compliance", compliance.trim());
    }

    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    return sp.toString();
  }, [role, status, q, showVendorFilters, maxBusMinutes, hasInstagram, compliance, limit, offset]);

  const fetchRows = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/list?${queryString}`, {
        headers: { "x-admin-secret": adminSecret },
      });

      const data = (await res.json().catch(() => ({}))) as unknown as {
        rows?: unknown;
        total?: unknown;
        error?: unknown;
      };

      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : `Failed (${res.status})`);

      setRows(Array.isArray(data?.rows) ? (data.rows as Entry[]) : []);
      setTotal(Number(data?.total || 0));
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Failed to load"));
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!secretReady) return;
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secretReady, queryString]);

  const openRow = (r: Entry) => {
    setSelected(r);
    setNotesDraft(r.admin_notes || "");
    setStatusDraft(r.review_status || "pending");
    setVendorOverrideDraft(
      r.vendor_queue_override === null || r.vendor_queue_override === undefined ? "" : String(r.vendor_queue_override)
    );
  };

  const closeDrawer = () => {
    setSelected(null);
    setNotesDraft("");
    setStatusDraft("pending");
    setVendorOverrideDraft("");
    setErr("");
  };

  const updateRowInState = (updated: Entry) => {
    setSelected(updated);
    setRows((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
  };

  const callUpdate = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/admin/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret,
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json().catch(() => ({}))) as unknown as { row?: unknown; error?: unknown };

    if (!res.ok) {
      const msg = typeof data?.error === "string" ? data.error : `Update failed (${res.status})`;
      throw new Error(msg);
    }

    return data?.row as Entry;
  };

  const saveReview = async (forceStatus?: ReviewStatus) => {
    if (!selected) return;

    setErr("");
    const nextStatus = forceStatus || statusDraft;

    let vendor_queue_override: number | null | undefined = undefined;
    if (selected.role === "vendor") {
      const t = vendorOverrideDraft.trim();
      if (!t) vendor_queue_override = null;
      else {
        const n = Number(t);
        if (Number.isNaN(n)) {
          setErr("Vendor override must be a number (e.g., 1) or blank to clear.");
          return;
        }
        vendor_queue_override = n;
      }
    }

    try {
      const updated = await callUpdate({
        id: selected.id,
        review_status: nextStatus,
        admin_notes: notesDraft,
        reviewed_by: "admin",
        ...(selected.role === "vendor" ? { vendor_queue_override } : {}),
      });

      updateRowInState(updated);
      setStatusDraft(updated.review_status);
      setNotesDraft(updated.admin_notes || "");
      setVendorOverrideDraft(
        updated.vendor_queue_override === null || updated.vendor_queue_override === undefined
          ? ""
          : String(updated.vendor_queue_override)
      );
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Update failed"));
    }
  };

  const clearVendorOverride = async () => {
    if (!selected || selected.role !== "vendor") return;

    setErr("");
    try {
      const updated = await callUpdate({
        id: selected.id,
        review_status: statusDraft,
        admin_notes: notesDraft,
        reviewed_by: "admin",
        vendor_queue_override: null,
      });
      updateRowInState(updated);
      setVendorOverrideDraft("");
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Failed to clear override"));
    }
  };

  const exportCsv = async () => {
    setErr("");
    try {
      const sp = new URLSearchParams();
      if (role !== "all") sp.set("role", role);

      const res = await fetch(`/api/admin/export?${sp.toString()}`, {
        headers: { "x-admin-secret": adminSecret },
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as unknown as { error?: unknown };
        const msg = typeof data?.error === "string" ? data.error : `Export failed (${res.status})`;
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `peerplates_waitlist_${role === "all" ? "all" : role}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setErr(getErrorMessage(e, "Export failed"));
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SECRET_KEY);
    setAdminSecret("");
    setSecretReady(false);
    setRows([]);
    setTotal(0);
    closeDrawer();
  };

  // --- Auth gate ---
  if (!secretReady) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto w-full max-w-xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <MotionDiv
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center justify-between gap-4"
          >
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl" style={{ background: BRAND }} />
              <div className="text-lg font-semibold tracking-tight">PeerPlates</div>
            </Link>
            <div className="text-sm text-black/60 whitespace-nowrap">Admin</div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
          >
            <h1 className="text-xl font-extrabold tracking-tight">Admin access</h1>
            <p className="mt-2 text-sm text-black/60">
              Paste <span className="font-semibold">ADMIN_SECRET</span> to open the dashboard.
            </p>

            <div className="mt-4 grid gap-2">
              <label className="text-sm font-semibold">Admin secret</label>
              <input
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="h-12 w-full rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]"
                placeholder="Paste ADMIN_SECRET"
                type="password"
              />
            </div>

            {err ? (
              <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm text-black">{err}</div>
            ) : null}

            <button
              type="button"
              onClick={() => {
                const s = adminSecret.trim();
                if (!s) {
                  setErr("Please paste ADMIN_SECRET.");
                  return;
                }
                sessionStorage.setItem(SECRET_KEY, s);
                setSecretReady(true);
              }}
              className="mt-5 w-full rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-black transition hover:opacity-95 hover:-translate-y-[1px]"
            >
              Open dashboard
            </button>
          </MotionDiv>
        </div>
      </main>
    );
  }

  // --- Dashboard ---
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top bar */}
        <MotionDiv
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center justify-between gap-4"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl" style={{ background: BRAND }} />
            <div className="text-lg font-semibold tracking-tight">PeerPlates</div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCsv}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold hover:bg-black/5 transition"
            >
              Export CSV
            </button>
            <button
              onClick={logout}
              className="rounded-xl border border-black/10 bg-white px-4 py-2 font-semibold hover:bg-black/5 transition"
            >
              Log out
            </button>
          </div>
        </MotionDiv>

        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-6 rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-lg font-extrabold tracking-tight">Waitlist Admin</div>
              <div className="text-sm text-black/60 mt-1">{loading ? "Loading…" : `${total} total`}</div>
            </div>

            {/* Filters */}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-7 w-full">
              <BrandSelect<RoleFilter>
                value={role}
                onChange={(v) => {
                  setRole(v);
                  setOffset(0);
                }}
                options={[
                  { value: "all", label: "Role: All" },
                  { value: "consumer", label: "Role: Consumer" },
                  { value: "vendor", label: "Role: Vendor" },
                ]}
              />

              <BrandSelect<StatusFilter>
                value={status}
                onChange={(v) => {
                  setStatus(v);
                  setOffset(0);
                }}
                options={[
                  { value: "all", label: "Status: All" },
                  { value: "pending", label: "Status: Pending" },
                  { value: "reviewed", label: "Status: Reviewed" },
                  { value: "approved", label: "Status: Approved" },
                  { value: "rejected", label: "Status: Rejected" },
                ]}
              />

              {showVendorFilters ? (
                <>
                  <input
                    value={maxBusMinutes}
                    onChange={(e) => {
                      setOffset(0);
                      setMaxBusMinutes(e.target.value);
                    }}
                    placeholder="Max bus min"
                    inputMode="numeric"
                    className={controlBase}
                  />

                  <BrandSelect<"" | "true" | "false">
                    value={hasInstagram}
                    onChange={(v) => {
                      setHasInstagram(v);
                      setOffset(0);
                    }}
                    options={[
                      { value: "", label: "Has IG: All" },
                      { value: "true", label: "Has IG: Yes" },
                      { value: "false", label: "Has IG: No" },
                    ]}
                  />

                  <BrandSelect<string>
                    value={compliance}
                    onChange={(v) => {
                      setCompliance(v);
                      setOffset(0);
                    }}
                    options={[
                      { value: "", label: "Compliance: All" },
                      ...complianceOptions.map((c) => ({ value: c, label: c })),
                    ]}
                  />
                </>
              ) : (
                <div className="hidden lg:block lg:col-span-3" />
              )}

              <input
                value={q}
                onChange={(e) => {
                  setOffset(0);
                  setQ(e.target.value);
                }}
                placeholder="Search name or email"
                className={controlBase + " lg:col-span-7"}
              />
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-black/10 bg-black/5 p-3 text-sm text-black">{err}</div>
          ) : null}

          {/* Table */}
          <div className="mt-4 overflow-auto rounded-2xl border border-black/10">
            <table className="w-full text-sm table-auto min-w-max">
              <thead className="bg-black/5 text-black/80 sticky top-0 z-10">
                <tr>
                  <th className="p-3 text-left whitespace-nowrap">Role</th>
                  <th className="p-3 text-left whitespace-nowrap">Name</th>
                  <th className="p-3 text-left whitespace-nowrap">Email</th>

                  <th className="p-3 text-left whitespace-nowrap">Bus</th>
                  <th className="p-3 text-left whitespace-nowrap">IG</th>

                  <th className="p-3 text-left whitespace-nowrap">Status</th>
                  <th className="p-3 text-left whitespace-nowrap">Override</th>
                  <th className="p-3 text-left whitespace-nowrap">Score</th>
                  <th className="p-3 text-left whitespace-nowrap">Referrals</th>
                  <th className="p-3 text-left whitespace-nowrap">Created</th>

                  {/* ✅ Every answer becomes its own column */}
                  {answerKeys.map((k) => (
                    <th key={k} className="p-3 text-left whitespace-nowrap">
                      {k}
                    </th>
                  ))}

                  <th className="p-3 text-right whitespace-nowrap">Action</th>
                </tr>
              </thead>

              <tbody className="[&>tr:nth-child(even)]:bg-black/[0.02]">
                {rows.map((r) => {
                  const points = r.referral_points ?? 0;
                  const count = r.referrals_count ?? 0;

                  const ig = safeStr(r.instagram_handle || "").trim();
                  const hasIgVal = ig.length > 0;

                  return (
                    <tr
                      key={r.id}
                      className="border-t border-black/10 hover:bg-[rgba(252,176,64,0.12)] transition"
                    >
                      <td className="p-3 font-semibold whitespace-nowrap">{r.role}</td>
                      <td className="p-3 font-semibold whitespace-nowrap" title={r.full_name}>
                        {r.full_name}
                      </td>
                      <td className="p-3 text-black/70 whitespace-nowrap" title={r.email}>
                        {r.email}
                      </td>

                      <td className="p-3 text-black/70 whitespace-nowrap">
                        {typeof r.bus_minutes === "number" ? `${r.bus_minutes} min` : "—"}
                      </td>

                      {/* Always Yes/No (never blank) */}
                      <td className="p-3 text-black/70 whitespace-nowrap">{hasIgVal ? "Yes" : "No"}</td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${pillClass(
                            r.review_status
                          )}`}
                        >
                          {r.review_status}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {r.role === "vendor" ? r.vendor_queue_override ?? "—" : "—"}
                      </td>
                      <td className="p-3 font-semibold whitespace-nowrap">
                        {r.role === "vendor" ? r.vendor_priority_score : points}
                      </td>

                      <td className="p-3 text-black/70 whitespace-nowrap">
                        {r.role === "consumer" ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="font-semibold text-black">{count}</span>
                            <span className="text-xs text-black/50">(signups)</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td className="p-3 text-black/60 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString()}
                      </td>

                      {/* ✅ Answer cells: show "No" instead of dashes when empty */}
                      {answerKeys.map((k) => {
                        const raw = r.answers ? r.answers[k] : undefined;
                        const val = normalizeAnswerValue(raw).trim();
                        return (
                          <td key={k} className="p-3 text-black/80 whitespace-nowrap" title={val || "No"}>
                            {val ? val : "No"}
                          </td>
                        );
                      })}

                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => openRow(r)}
                          className="rounded-xl bg-[#fcb040] px-4 py-2 font-extrabold text-black transition hover:opacity-95"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && rows.length === 0 ? (
                  <tr>
                    <td className="p-6 text-black/60" colSpan={tableColCount}>
                      No rows found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-black/50">
              {total === 0
                ? "—"
                : `Showing ${Math.min(total, offset + 1)}–${Math.min(total, offset + rows.length)} of ${total}`}
            </div>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset((x) => Math.max(0, x - limit))}
                className="rounded-xl border border-black/10 px-4 py-2 font-semibold disabled:opacity-50 hover:bg-black/5 transition"
              >
                Prev
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset((x) => x + limit)}
                className="rounded-xl border border-black/10 px-4 py-2 font-semibold disabled:opacity-50 hover:bg-black/5 transition"
              >
                Next
              </button>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* Drawer (answers removed already; table shows them) */}
      {selected ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
            <div className="h-full overflow-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-extrabold tracking-tight">{selected.full_name}</div>
                  <div className="mt-1 text-sm text-black/60">{selected.email}</div>
                  <div className="mt-2 text-xs text-black/50">
                    <span className="font-mono break-all">{selected.id}</span>
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="rounded-xl border border-black/10 px-3 py-2 font-semibold hover:bg-black/5 transition"
                >
                  Close
                </button>
              </div>

              {selected.role === "vendor" ? (
                <div className="mt-5 grid gap-2 rounded-3xl border border-[#fcb040] bg-white p-4">
                  <div className="text-sm font-extrabold">Vendor summary</div>
                  <div className="text-sm text-black/80">
                    <span className="font-semibold">Bus:</span>{" "}
                    {typeof selected.bus_minutes === "number" ? `${selected.bus_minutes} min` : "—"}{" "}
                    <span className="text-black/40">•</span> <span className="font-semibold">IG:</span>{" "}
                    {safeStr(selected.instagram_handle).trim() ? safeStr(selected.instagram_handle) : "No"}
                  </div>
                  <div className="text-sm text-black/80">
                    <span className="font-semibold">Compliance:</span> {joinArr(selected.compliance_readiness) || "—"}
                  </div>
                </div>
              ) : null}

              {selected.role === "consumer" ? (
                <div className="mt-5 grid gap-2 rounded-3xl border border-[#fcb040] bg-white p-4">
                  <div className="text-sm font-extrabold">Referrals</div>
                  <div className="text-sm text-black/80">
                    <span className="font-semibold">Points:</span> {selected.referral_points ?? 0}{" "}
                    <span className="text-black/40">•</span> <span className="font-semibold">Signups:</span>{" "}
                    {selected.referrals_count ?? 0}
                  </div>
                  {selected.referral_code ? (
                    <div className="text-xs text-black/50">
                      Referral code: <span className="font-mono">{selected.referral_code}</span>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-5 grid gap-3 rounded-3xl border border-[#fcb040] bg-white p-4">
                <div className="text-sm font-extrabold">Quick actions</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => saveReview("reviewed")}
                    className="rounded-2xl border border-black/10 bg-white px-4 py-2 font-extrabold hover:bg-black/5 transition"
                  >
                    Mark reviewed
                  </button>
                  <button
                    onClick={() => saveReview("approved")}
                    className="rounded-2xl bg-[#fcb040] px-4 py-2 font-extrabold text-black hover:opacity-95 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => saveReview("rejected")}
                    className="rounded-2xl border border-[#fcb040] bg-white px-4 py-2 font-extrabold text-black hover:bg-[rgba(252,176,64,0.12)] transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {selected.role === "vendor" ? (
                <div className="mt-5 grid gap-2 rounded-3xl border border-[#fcb040] bg-white p-4">
                  <div className="text-sm font-extrabold">Manual vendor queue override</div>
                  <div className="text-xs text-black/60">
                    Lower number = earlier in queue. Leave blank to fall back to auto ordering (score + time).
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                    <input
                      value={vendorOverrideDraft}
                      onChange={(e) => setVendorOverrideDraft(e.target.value)}
                      placeholder="e.g. 1"
                      inputMode="numeric"
                      className="h-11 rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]"
                    />

                    <button
                      onClick={() => saveReview()}
                      className="rounded-2xl bg-[#fcb040] px-5 py-2.5 font-extrabold text-black transition hover:opacity-95"
                    >
                      Save
                    </button>

                    <button
                      onClick={clearVendorOverride}
                      className="rounded-2xl border border-black/10 bg-white px-5 py-2.5 font-extrabold hover:bg-black/5 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-black/60">Status</label>
                  <BrandSelect<ReviewStatus>
                    value={statusDraft}
                    onChange={(v) => setStatusDraft(v)}
                    options={[
                      { value: "pending", label: "pending" },
                      { value: "reviewed", label: "reviewed" },
                      { value: "approved", label: "approved" },
                      { value: "rejected", label: "rejected" },
                    ]}
                  />
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-black/60">Admin notes</label>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-[#fcb040] bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]"
                    placeholder="Add notes…"
                  />
                </div>

                <button
                  onClick={() => saveReview()}
                  className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-black transition hover:opacity-95 hover:-translate-y-[1px]"
                >
                  Save status + notes
                </button>

                <div className="text-xs text-black/50">
                  Created: {new Date(selected.created_at).toLocaleString()}
                  {selected.reviewed_at ? (
                    <>
                      <br />
                      Reviewed: {new Date(selected.reviewed_at).toLocaleString()}{" "}
                      {selected.reviewed_by ? `(${selected.reviewed_by})` : ""}
                    </>
                  ) : null}
                </div>

                {err ? (
                  <div className="rounded-2xl border border-black/10 bg-black/5 p-3 text-sm text-black">{err}</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
