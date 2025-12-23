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

export async function PATCH(req: Request) {
  try {
    if (!requireAdmin(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const vendor_sort = body?.vendor_sort;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (vendor_sort !== null && vendor_sort !== undefined && Number.isNaN(Number(vendor_sort))) {
      return NextResponse.json({ error: "vendor_sort must be a number or null" }, { status: 400 });
    }

    const sb = supabaseAdmin();

    const { data, error } = await sb
      .from("waitlist_entries")
      .update({ vendor_sort: vendor_sort === null ? null : Number(vendor_sort) })
      .eq("id", id)
      .eq("role", "vendor")
      .select("id, vendor_sort")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
