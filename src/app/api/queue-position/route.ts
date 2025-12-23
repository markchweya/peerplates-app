import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  try {
    const sb = supabaseAdmin();

    const { searchParams } = new URL(req.url);
    const id = (searchParams.get("id") || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const { data: entry, error: entryErr } = await sb
      .from("waitlist_entries")
      .select("id, role, created_at, vendor_sort")
      .eq("id", id)
      .single();

    if (entryErr || !entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // For Vendors: use vendor_sort if set (lower = higher priority), then created_at
    if (entry.role === "vendor") {
      const { data: vendors, error: vErr } = await sb
        .from("waitlist_entries")
        .select("id, created_at, vendor_sort")
        .eq("role", "vendor");

      if (vErr) {
        return NextResponse.json({ error: vErr.message }, { status: 500 });
      }

      const list = (vendors || []).slice().sort((a: any, b: any) => {
        const as = a.vendor_sort ?? Number.MAX_SAFE_INTEGER;
        const bs = b.vendor_sort ?? Number.MAX_SAFE_INTEGER;
        if (as !== bs) return as - bs;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const idx = list.findIndex((x: any) => x.id === entry.id);
      return NextResponse.json({
        id: entry.id,
        role: entry.role,
        position: idx >= 0 ? idx + 1 : null,
      });
    }

    // Consumers: MVP ordering by created_at (referrals come in TJ-005)
    const { count, error: countErr } = await sb
      .from("waitlist_entries")
      .select("id", { count: "exact", head: true })
      .eq("role", entry.role)
      .lte("created_at", entry.created_at);

    if (countErr) {
      return NextResponse.json(
        { error: countErr.message || "Count failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: entry.id,
      role: entry.role,
      position: count ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
