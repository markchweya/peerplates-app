// src/app/api/admin/list/route.ts
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

function isAuthorized(req: Request) {
  // Dev-friendly: if ADMIN_SECRET is not set, allow access.
  // In prod, set ADMIN_SECRET to enforce.
  if (!ADMIN_SECRET) return true;
  const header = (req.headers.get("x-admin-secret") || "").trim();
  return header === ADMIN_SECRET;
}

function toBool(v: string | null): boolean | null {
  if (!v) return null;
  const s = v.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(s)) return true;
  if (["false", "0", "no", "off"].includes(s)) return false;
  return null;
}

export async function GET(req: Request) {
  try {
    if (!isAuthorized(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);

    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    const role = (searchParams.get("role") || "all").toLowerCase();
    const status = (searchParams.get("status") || "all").toLowerCase();
    const q = (searchParams.get("q") || "").trim();

    // Optional “review” filters (from clean columns)
    const city = (searchParams.get("city") || "").trim();
    const maxBusMinutesRaw = (searchParams.get("max_bus_minutes") || "").trim();
    const maxBusMinutes = maxBusMinutesRaw ? Number(maxBusMinutesRaw) : null;

    const hasInstagram = toBool(searchParams.get("has_instagram"));
    const compliance = (searchParams.get("compliance") || "").trim(); // matches inside compliance_readiness[]

    let query = sb
      .from("waitlist_entries")
      .select(
        [
          // core
          "id",
          "role",
          "full_name",
          "email",
          "phone",
          "is_student",
          "university",
          "answers",

          // referral identity + stats
          "referral_code",
          "referred_by",
          "referrals_count",
          "referral_points",

          // vendor scoring / queue
          "vendor_priority_score",
          "vendor_queue_override",
          "certificate_url",

          // admin review
          "review_status",
          "admin_notes",
          "reviewed_at",
          "reviewed_by",

          // clean review-friendly columns (that exist)
          "city",
          "instagram_handle",
          "bus_minutes",
          "compliance_readiness",
          "top_cuisines",

          // timestamps
          "created_at",
          "updated_at",
        ].join(","),
        { count: "exact" }
      );

    // Role filter
    if (role !== "all" && (role === "consumer" || role === "vendor")) {
      query = query.eq("role", role);
    }

    // Review status filter
    if (status !== "all") {
      query = query.eq("review_status", status);
    }

    // Search full_name OR email
    if (q) {
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    // City filter
    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    // Max bus minutes filter
    if (typeof maxBusMinutes === "number" && Number.isFinite(maxBusMinutes)) {
      query = query.lte("bus_minutes", maxBusMinutes);
    }

    // Has instagram filter
    if (hasInstagram === true) {
      query = query.not("instagram_handle", "is", null).neq("instagram_handle", "");
    } else if (hasInstagram === false) {
      // no instagram: NULL or empty string
      query = query.or("instagram_handle.is.null,instagram_handle.eq.");
    }

    // Compliance filter (array contains value)
    if (compliance) {
      query = query.contains("compliance_readiness", [compliance]);
    }

    // Sorting
    if (role === "vendor") {
      query = query
        .order("vendor_queue_override", { ascending: true, nullsFirst: false })
        .order("vendor_priority_score", { ascending: false })
        .order("created_at", { ascending: true });
    } else if (role === "consumer") {
      query = query
        .order("referral_points", { ascending: false })
        .order("created_at", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data || []).map((r: any) => ({
      ...r,
      // convenience score
      score: r.role === "vendor" ? r.vendor_priority_score ?? 0 : r.referral_points ?? 0,
    }));

    return NextResponse.json({
      rows,
      total: count ?? rows.length,
      limit,
      offset,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
