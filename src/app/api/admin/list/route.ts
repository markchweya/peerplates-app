// src/app/api/admin/list/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_TOKEN = process.env.ADMIN_DASHBOARD_TOKEN || ""; // optional if you use it

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

// If your admin uses a token, keep this. If not, you can remove this block.
function isAuthorized(req: Request) {
  if (!ADMIN_TOKEN) return true; // no token set => skip auth
  const header = req.headers.get("x-admin-token") || "";
  return header === ADMIN_TOKEN;
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
          "created_at",
          "review_status",
          "vendor_queue_override",
          "vendor_priority_score",
          "referrals_count",
          "referral_points",
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
    if (role === "vendor") {
      // Supabase JS doesn't support NULLS LAST directly; we can still order override asc,
      // and treat nulls as last in UI sorting if needed. Usually this is fine.
      query = query
        .order("vendor_queue_override", { ascending: true })
        .order("vendor_priority_score", { ascending: false })
        .order("created_at", { ascending: true });
    } else if (role === "consumer") {
      query = query
        .order("referral_points", { ascending: false })
        .order("created_at", { ascending: true });
    } else {
      // all roles: newest first
      query = query.order("created_at", { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows =
      (data || []).map((r: any) => {
        const score =
          r.role === "vendor"
            ? (r.vendor_priority_score ?? 0)
            : (r.referral_points ?? 0); // 👈 consumer score shown in admin

        return { ...r, score };
      }) || [];

    return NextResponse.json({
      rows,
      total: count ?? rows.length,
      limit,
      offset,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected server error" }, { status: 500 });
  }
}
