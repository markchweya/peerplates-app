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

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get("role") || "").trim(); // consumer|vendor|"" all

    let query = sb
      .from("waitlist_entries")
      .select("id, role, created_at, full_name, email, phone, referral_code, vendor_sort, review_status, admin_notes, answers")
      .order("created_at", { ascending: false });

    if (role === "consumer" || role === "vendor") query = query.eq("role", role);

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
      "vendor_sort",
      "review_status",
      "admin_notes",
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
          r.vendor_sort ?? "",
          r.review_status ?? "",
          r.admin_notes ?? "",
          JSON.stringify(r.answers ?? {}),
        ].map(csvEscape).join(",")
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
