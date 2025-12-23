import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

function deny(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

function checkAdmin(req: Request) {
  const incoming = req.headers.get("x-admin-secret") || "";
  if (!ADMIN_SECRET) return deny("Missing ADMIN_SECRET in server env", 500);
  if (incoming !== ADMIN_SECRET) return deny("Unauthorized", 401);
  return null;
}

function buildQuery(
  sb: ReturnType<typeof supabaseAdmin>,
  params: {
    selectCols: string;
    role: string;
    status: string;
    q: string;
    limit: number;
    offset: number;
    canUseOverride: boolean;
  }
) {
  const { selectCols, role, status, q, limit, offset, canUseOverride } = params;

  let query = sb.from("waitlist_entries").select(selectCols, { count: "exact" });

  if (role === "consumer" || role === "vendor") query = query.eq("role", role);
  if (status) query = query.eq("review_status", status);

  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);

  if (role === "vendor") {
    if (canUseOverride) {
      query = query
        .order("vendor_queue_override", { ascending: true, nullsFirst: false })
        .order("vendor_priority_score", { ascending: false })
        .order("created_at", { ascending: true });
    } else {
      query = query
        .order("vendor_priority_score", { ascending: false })
        .order("created_at", { ascending: true });
    }
  } else {
    query = query.order("created_at", { ascending: false });
  }

  return query.range(offset, offset + limit - 1);
}

export async function GET(req: Request) {
  const authErr = checkAdmin(req);
  if (authErr) return authErr;

  try {
    const sb = supabaseAdmin();
    const url = new URL(req.url);

    const role = (url.searchParams.get("role") || "").trim().toLowerCase();
    const status = (url.searchParams.get("status") || "").trim().toLowerCase();
    const q = (url.searchParams.get("q") || "").trim();
    const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") || 50)));
    const offset = Math.max(0, Number(url.searchParams.get("offset") || 0));

    const selectWithOverride =
      "id, role, full_name, email, phone, is_student, university, answers, referral_code, referred_by, vendor_priority_score, vendor_queue_override, certificate_url, created_at, review_status, admin_notes, reviewed_at, reviewed_by";

    const selectWithoutOverride =
      "id, role, full_name, email, phone, is_student, university, answers, referral_code, referred_by, vendor_priority_score, certificate_url, created_at, review_status, admin_notes, reviewed_at, reviewed_by";

    // Attempt 1: include vendor_queue_override
    const a1 = await buildQuery(sb, {
      selectCols: selectWithOverride,
      role,
      status,
      q,
      limit,
      offset,
      canUseOverride: true,
    });

    if (!a1.error) {
      return NextResponse.json({
        rows: a1.data ?? [],
        total: a1.count ?? (a1.data?.length || 0),
        limit,
        offset,
        overrideAvailable: true,
      });
    }

    const msg = (a1.error.message || "").toLowerCase();

    // If PostgREST schema cache is lagging, retry without the column
    if (msg.includes("vendor_queue_override") && msg.includes("does not exist")) {
      const a2 = await buildQuery(sb, {
        selectCols: selectWithoutOverride,
        role,
        status,
        q,
        limit,
        offset,
        canUseOverride: false,
      });

      if (a2.error) return deny(a2.error.message, 500);

      return NextResponse.json({
        rows: a2.data ?? [],
        total: a2.count ?? (a2.data?.length || 0),
        limit,
        offset,
        overrideAvailable: false,
        warning:
          "vendor_queue_override not visible to PostgREST yet. Dashboard is using auto vendor sorting for now.",
      });
    }

    return deny(a1.error.message, 500);
  } catch (e: any) {
    return deny(e?.message || "Server error", 500);
  }
}
