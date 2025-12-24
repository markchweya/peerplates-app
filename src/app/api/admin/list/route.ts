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
  // If you didn't set ADMIN_SECRET, allow access (dev-friendly).
  // In production, you SHOULD set ADMIN_SECRET so this becomes enforced.
  if (!ADMIN_SECRET) return true;

  const header = (req.headers.get("x-admin-secret") || "").trim();
  return header === ADMIN_SECRET;
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

    let query = sb
      .from("waitlist_entries")
      .select(
        [
          "id",
          "role",
          "full_name",
          "email",
          "phone",
          "is_student",
          "university",
          "answers",

          "referral_code",
          "referred_by",
          "referrals_count",
          "referral_points",

          "vendor_priority_score",
          "vendor_queue_override",
          "certificate_url",

          "review_status",
          "admin_notes",
          "reviewed_at",
          "reviewed_by",

          "created_at",
          "updated_at",
        ].join(","),
        { count: "exact" }
      );

    if (role !== "all" && (role === "consumer" || role === "vendor")) {
      query = query.eq("role", role);
    }

    if (status !== "all") {
      query = query.eq("review_status", status);
    }

    if (q) {
      // Search full_name OR email
      query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
    }

    // Sorting:
    // - vendors: override asc (nulls last) then vendor_priority_score desc then created_at asc
    // - consumers: referral_points desc then created_at asc
    // - all: newest first
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

    // Add a convenience "score" field:
    // - vendor score = vendor_priority_score
    // - consumer score = referral_points
    const rows = (data || []).map((r: any) => ({
      ...r,
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
