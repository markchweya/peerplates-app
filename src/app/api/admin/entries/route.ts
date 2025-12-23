import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_SECRET = process.env.ADMIN_SECRET!;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function requireAdmin(req: Request) {
  const provided = req.headers.get("x-admin-secret") || "";
  if (!ADMIN_SECRET) throw new Error("ADMIN_SECRET not set");
  if (provided !== ADMIN_SECRET) return false;
  return true;
}

export async function GET(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);

    const role = (searchParams.get("role") || "").trim(); // consumer|vendor|"" (all)
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get("limit") || 200), 500);
    const offset = Math.max(Number(searchParams.get("offset") || 0), 0);

    // Select what the admin page needs. If your table uses different column names,
    // you can switch to `.select("*")` temporarily.
    let query = sb
      .from("waitlist_entries")
      .select(
        "id, role, created_at, full_name, email, phone, answers, referral_code, vendor_sort, review_status, admin_notes",
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (role === "consumer" || role === "vendor") query = query.eq("role", role);

    const { data, error, count } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Basic search (client-side) to avoid needing ilike across multiple columns
    const filtered = (data || []).filter((row: any) => {
      if (!q) return true;
      const name = String(row?.full_name || row?.fullName || "").toLowerCase();
      const email = String(row?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });

    return NextResponse.json({
      count: count ?? filtered.length,
      items: filtered,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
