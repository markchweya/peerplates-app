"use client";

import { useEffect, useMemo, useState } from "react";
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
  answers: Record<string, any>;
  referral_code: string | null;
  referred_by: string | null;
  vendor_priority_score: number;
  vendor_queue_override: number | null;
  certificate_url: string | null;
  certificate_signed_url?: string | null;

  created_at: string;

  review_status: ReviewStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

const BRAND = "#fcb040";
const SECRET_KEY = "peerplates_admin_secret";

function pillClass(status: ReviewStatus) {
  if (status === "approved")
    return "bg-green-50 text-green-700 border border-green-200";
  if (status === "rejected")
    return "bg-red-50 text-red-700 border border-red-200";
  if (status === "reviewed")
    return "bg-slate-100 text-slate-700 border border-slate-200";
  return "bg-amber-50 text-amber-800 border border-amber-200";
}

function safeStr(v: any) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function csvEscape(v: any) {
  const s = safeStr(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function AdminPage() {
  // Auth (shared secret)
  const [adminSecret, setAdminSecret] = useState("");
  const [secretReady, setSecretReady] = useState(false);

  // Filters
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [q, setQ] = useState("");

  // Data
  const [rows, setRows] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);

  // UI state
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Drawer
  const [selected, setSelected] = useState<Entry | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<ReviewStatus>("pending");
  const [vendorOverrideDraft, setVendorOverrideDraft] = useState<string>("");

  // Load secret from sessionStorage
  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY) || "";
    if (saved) {
      setAdminSecret(saved);
      setSecretReady(true);
    }
  }, []);

  const queryString = useMemo(() => {
    const sp = new URLSearchParams();
    if (role !== "all") sp.set("role", role);
    if (status !== "all") sp.set("status", status);
    if (q.trim()) sp.set("q", q.trim());
    sp.set("limit", String(limit));
    sp.set("offset", String(offset));
    return sp.toString();
  }, [role, status, q, limit, offset]);

  const fetchRows = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/list?${queryString}`, {
        headers: { "x-admin-secret": adminSecret },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Failed (${res.status})`);

      setRows(Array.isArray(data?.rows) ? data.rows : []);
      setTotal(Number(data?.total || 0));
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
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
      r.vendor_queue_override === null || r.vendor_queue_override === undefined
        ? ""
        : String(r.vendor_queue_override)
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

  const callUpdate = async (payload: Record<string, any>) => {
    const res = await fetch("/api/admin/update", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": adminSecret,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error || `Update failed (${res.status})`);
    return data?.row as Entry;
  };

  const saveReview = async (forceStatus?: ReviewStatus) => {
    if (!selected) return;

    setErr("");
    const nextStatus = forceStatus || statusDraft;

    // vendor override parsing
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
    } catch (e: any) {
      setErr(e?.message || "Update failed");
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
    } catch (e: any) {
      setErr(e?.message || "Failed to clear override");
    }
  };

  const exportCsv = () => {
    const headers = [
      "id",
      "role",
      "full_name",
      "email",
      "phone",
      "is_student",
      "university",
      "review_status",
      "admin_notes",
      "reviewed_at",
      "reviewed_by",
      "vendor_priority_score",
      "vendor_queue_override",
      "referral_code",
      "referred_by",
      "created_at",
      "answers_json",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.id,
          r.role,
          r.full_name,
          r.email,
          r.phone ?? "",
          r.is_student ?? "",
          r.university ?? "",
          r.review_status ?? "",
          r.admin_notes ?? "",
          r.reviewed_at ?? "",
          r.reviewed_by ?? "",
          r.vendor_priority_score ?? "",
          r.vendor_queue_override ?? "",
          r.referral_code ?? "",
          r.referred_by ?? "",
          r.created_at ?? "",
          JSON.stringify(r.answers ?? {}),
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peerplates_waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
      <main className="min-h-screen bg-white text-slate-900">
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
            <div className="text-sm text-slate-500 whitespace-nowrap">Admin</div>
          </MotionDiv>

          <MotionDiv
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h1 className="text-xl font-extrabold tracking-tight">Admin access</h1>
            <p className="mt-2 text-sm text-slate-600">
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
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {err}
              </div>
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
              className="mt-5 w-full rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px]"
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
    <main className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto w-full max-w-6xl 2xl:max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
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
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50 transition"
            >
              Export CSV
            </button>
            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold hover:bg-slate-50 transition"
            >
              Log out
            </button>
          </div>
        </MotionDiv>

        {/* Controls + table */}
        <MotionDiv
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-lg font-extrabold tracking-tight">Waitlist Admin</div>
              <div className="text-sm text-slate-600 mt-1">
                {loading ? "Loading…" : `${total} total`}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 w-full md:max-w-3xl">
              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Role</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setOffset(0);
                    setRole(e.target.value as RoleFilter);
                  }}
                  className="h-11 rounded-2xl border border-[#fcb040] bg-white px-3 font-semibold outline-none"
                >
                  <option value="all">All</option>
                  <option value="consumer">Consumer</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>

              <div className="grid gap-1">
                <label className="text-xs font-semibold text-slate-600">Status</label>
                <select
                  value={status}
                  onChange={(e) => {
                    setOffset(0);
                    setStatus(e.target.value as StatusFilter);
                  }}
                  className="h-11 rounded-2xl border border-[#fcb040] bg-white px-3 font-semibold outline-none"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="grid gap-1 sm:col-span-2">
                <label className="text-xs font-semibold text-slate-600">Search</label>
                <input
                  value={q}
                  onChange={(e) => {
                    setOffset(0);
                    setQ(e.target.value);
                  }}
                  placeholder="Name or email…"
                  className="h-11 rounded-2xl border border-[#fcb040] bg-white px-4 font-semibold outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]"
                />
              </div>
            </div>
          </div>

          {err ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {err}
            </div>
          ) : null}

          <div className="mt-5 overflow-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Override</th>
                  <th className="p-3 text-left">Score</th>
                  <th className="p-3 text-left">Created</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-200">
                    <td className="p-3 font-semibold">{r.role}</td>
                    <td className="p-3 font-semibold">{r.full_name}</td>
                    <td className="p-3 text-slate-700">{r.email}</td>
                    <td className="p-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ${pillClass(r.review_status)}`}>
                        {r.review_status}
                      </span>
                    </td>
                    <td className="p-3">
                      {r.role === "vendor" ? (r.vendor_queue_override ?? "—") : "—"}
                    </td>
                    <td className="p-3">{r.role === "vendor" ? r.vendor_priority_score : "—"}</td>
                    <td className="p-3 text-slate-600">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openRow(r)}
                        className="rounded-xl bg-[#fcb040] px-4 py-2 font-extrabold text-slate-900 transition hover:opacity-95"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}

                {!loading && rows.length === 0 ? (
                  <tr>
                    <td className="p-6 text-slate-500" colSpan={8}>
                      No rows found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              {total === 0
                ? "—"
                : `Showing ${Math.min(total, offset + 1)}–${Math.min(
                    total,
                    offset + rows.length
                  )} of ${total}`}
            </div>
            <div className="flex gap-2">
              <button
                disabled={offset === 0}
                onClick={() => setOffset((x) => Math.max(0, x - limit))}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Prev
              </button>
              <button
                disabled={offset + limit >= total}
                onClick={() => setOffset((x) => x + limit)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-semibold disabled:opacity-50 hover:bg-slate-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </MotionDiv>
      </div>

      {/* Drawer */}
      {selected ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white shadow-xl">
            <div className="h-full overflow-auto p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xl font-extrabold tracking-tight">{selected.full_name}</div>
                  <div className="mt-1 text-sm text-slate-600">{selected.email}</div>
                  <div className="mt-2 text-xs text-slate-500">
                    <span className="font-mono break-all">{selected.id}</span>
                  </div>
                </div>

                <button
                  onClick={closeDrawer}
                  className="rounded-xl border border-slate-200 px-3 py-2 font-semibold hover:bg-slate-50 transition"
                >
                  Close
                </button>
              </div>

              {/* Quick actions */}
              <div className="mt-5 grid gap-3 rounded-3xl border border-[#fcb040] bg-white p-4">
                <div className="text-sm font-extrabold">Quick actions</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => saveReview("reviewed")}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 font-extrabold hover:bg-slate-50 transition"
                  >
                    Mark reviewed
                  </button>
                  <button
                    onClick={() => saveReview("approved")}
                    className="rounded-2xl bg-green-600 px-4 py-2 font-extrabold text-white hover:opacity-95 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => saveReview("rejected")}
                    className="rounded-2xl bg-red-600 px-4 py-2 font-extrabold text-white hover:opacity-95 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

              {/* Manual vendor queue override */}
              {selected.role === "vendor" ? (
                <div className="mt-5 grid gap-2 rounded-3xl border border-[#fcb040] bg-white p-4">
                  <div className="text-sm font-extrabold">Manual vendor queue override</div>
                  <div className="text-xs text-slate-600">
                    Lower number = earlier in queue. Leave blank to fall back to auto ordering
                    (score + time).
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
                      className="rounded-2xl bg-[#fcb040] px-5 py-2.5 font-extrabold text-slate-900 transition hover:opacity-95"
                    >
                      Save
                    </button>

                    <button
                      onClick={clearVendorOverride}
                      className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 font-extrabold hover:bg-slate-50 transition"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Status + notes */}
              <div className="mt-5 grid gap-3">
                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Status</label>
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as ReviewStatus)}
                    className="h-11 rounded-2xl border border-[#fcb040] bg-white px-3 font-semibold outline-none"
                  >
                    <option value="pending">pending</option>
                    <option value="reviewed">reviewed</option>
                    <option value="approved">approved</option>
                    <option value="rejected">rejected</option>
                  </select>
                </div>

                <div className="grid gap-1">
                  <label className="text-xs font-semibold text-slate-600">Admin notes</label>
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    className="min-h-[120px] w-full rounded-2xl border border-[#fcb040] bg-white px-4 py-3 font-semibold outline-none focus:ring-4 focus:ring-[rgba(252,176,64,0.30)]"
                    placeholder="Add notes…"
                  />
                </div>

                <button
                  onClick={() => saveReview()}
                  className="rounded-2xl bg-[#fcb040] px-6 py-3 text-center font-extrabold text-slate-900 transition hover:opacity-95 hover:-translate-y-[1px]"
                >
                  Save status + notes
                </button>

                {selected.role === "vendor" && selected.certificate_signed_url ? (
                  <a
                    href={selected.certificate_signed_url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-center font-extrabold hover:bg-slate-50 transition"
                  >
                    View certificate
                  </a>
                ) : null}

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-extrabold">Answers</div>
                  <div className="mt-3 grid gap-2">
                    {Object.entries(selected.answers || {}).map(([k, v]) => (
                      <div key={k} className="rounded-2xl bg-white p-3 border border-slate-200">
                        <div className="text-xs font-extrabold text-slate-600">{k}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
                          {Array.isArray(v) ? v.join(", ") : safeStr(v)}
                        </div>
                      </div>
                    ))}
                    {Object.keys(selected.answers || {}).length === 0 ? (
                      <div className="text-sm text-slate-600">No answers stored.</div>
                    ) : null}
                  </div>
                </div>

                <div className="text-xs text-slate-500">
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
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {err}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
