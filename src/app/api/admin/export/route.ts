// src/app/api/admin/export/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_SECRET = process.env.ADMIN_SECRET || "";

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function requireAdmin(req: Request) {
  // If ADMIN_SECRET isn't set, allow (dev-friendly)
  if (!ADMIN_SECRET) return true;

  const provided = (req.headers.get("x-admin-secret") || "").trim();
  return provided === ADMIN_SECRET;
}

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function joinArray(v: any): string {
  if (!v) return "";
  if (Array.isArray(v)) return v.join(" | ");
  return String(v);
}

export async function GET(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);

    // consumer|vendor|"" (all)
    const role = (searchParams.get("role") || "").trim().toLowerCase();

    let query = sb
      .from("waitlist_entries")
      .select(
        [
          "id",
          "role",
          "created_at",
          "full_name",
          "email",
          "phone",

          // referral stuff
          "referral_code",
          "referred_by",
          "referrals_count",
          "referral_points",

          // vendor sorting / review
          "vendor_priority_score",
          "vendor_queue_override",
          "review_status",
          "admin_notes",
          "certificate_url",

          // ✅ clean review columns (NEW)
          "city",
          "neighborhood",
          "cuisines",
          "instagram_handle",
          "bus_minutes",
          "compliance_readiness",

          // keep JSON too (optional but useful as fallback)
          "answers",
        ].join(",")
      )
      .order("created_at", { ascending: false });

    if (role === "consumer" || role === "vendor") {
      query = query.eq("role", role);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = data || [];

    const headers = [
      "id",
      "role",
      "created_at",
      "full_name",
      "email",
      "phone",

      "referral_code",
      "referred_by",
      "referrals_count",
      "referral_points",

      "vendor_priority_score",
      "vendor_queue_override",
      "review_status",
      "admin_notes",
      "certificate_url",

      // ✅ clean fields (no cleanup needed)
      "city",
      "neighborhood",
      "cuisines",
      "instagram_handle",
      "bus_minutes",
      "compliance_readiness",

      // optional (still here if you want deeper inspection)
      "answers_json",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((r: any) =>
        [
          r.id,
          r.role,
          r.created_at,
          r.full_name ?? "",
          r.email ?? "",
          r.phone ?? "",

          r.referral_code ?? "",
          r.referred_by ?? "",
          r.referrals_count ?? 0,
          r.referral_points ?? 0,

          r.vendor_priority_score ?? 0,
          r.vendor_queue_override ?? "",
          r.review_status ?? "",
          r.admin_notes ?? "",
          r.certificate_url ?? "",

          r.city ?? "",
          r.neighborhood ?? "",
          joinArray(r.cuisines),
          r.instagram_handle ?? "",
          r.bus_minutes ?? "",
          joinArray(r.compliance_readiness),

          JSON.stringify(r.answers ?? {}),
        ]
          .map(csvEscape)
          .join(",")
      ),
    ];

    const csv = lines.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="peerplates_waitlist_${role || "all"}.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
