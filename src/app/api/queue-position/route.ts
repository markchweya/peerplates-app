import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing Supabase env vars. Check .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

type Entry = {
  id: string;
  role: "consumer" | "vendor";
  created_at: string;
  review_status: "pending" | "reviewed" | "approved" | "rejected";
  referral_points?: number | null;
  vendor_priority_score?: number | null;
  vendor_queue_override?: number | null;
};

export async function GET(req: Request) {
  try {
    const sb = supabaseAdmin();
    const { searchParams } = new URL(req.url);

    const code = (searchParams.get("code") || "").trim();
    const id = (searchParams.get("id") || "").trim();

    if (!code && !id) {
      return NextResponse.json({ error: "Missing code or id" }, { status: 400 });
    }

    // Lookup entry by code (preferred) or id (fallback)
    const baseQuery = sb.from("waitlist_entries").select(
      "id, role, created_at, review_status, referral_points, vendor_priority_score, vendor_queue_override, queue_code"
    );

    const { data: entry, error: entryErr } = code
      ? await baseQuery.eq("queue_code", code).maybeSingle()
      : await baseQuery.eq("id", id).maybeSingle();

    if (entryErr || !entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const e = entry as Entry & { queue_code?: string | null };

    // Pull the relevant queue list and compute position
    if (e.role === "consumer") {
      const { data: consumers, error: cErr } = await sb
        .from("waitlist_entries")
        .select("id, referral_points, created_at")
        .eq("role", "consumer");

      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

      const list = (consumers || []).slice().sort((a: any, b: any) => {
        const ap = Number(a.referral_points ?? 0);
        const bp = Number(b.referral_points ?? 0);
        if (ap !== bp) return bp - ap; // higher points first
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); // earlier signup first
      });

      const idx = list.findIndex((x: any) => x.id === e.id);

      return NextResponse.json({
        id: e.id,
        role: "consumer",
        status: e.review_status,
        position: idx >= 0 ? idx + 1 : null,
      });
    }

    // Vendors: order = override ASC (override first), then priority DESC, then created_at ASC
    const { data: vendors, error: vErr } = await sb
      .from("waitlist_entries")
      .select("id, vendor_queue_override, vendor_priority_score, created_at")
      .eq("role", "vendor");

    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

    const list = (vendors || []).slice().sort((a: any, b: any) => {
      const ao = a.vendor_queue_override;
      const bo = b.vendor_queue_override;

      const aHas = ao !== null && ao !== undefined;
      const bHas = bo !== null && bo !== undefined;

      // Overrides come first
      if (aHas && bHas) {
        if (ao !== bo) return Number(ao) - Number(bo);
      } else if (aHas && !bHas) return -1;
      else if (!aHas && bHas) return 1;

      // Then priority score
      const ap = Number(a.vendor_priority_score ?? 0);
      const bp = Number(b.vendor_priority_score ?? 0);
      if (ap !== bp) return bp - ap;

      // Then oldest first
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const idx = list.findIndex((x: any) => x.id === e.id);

    return NextResponse.json({
      id: e.id,
      role: "vendor",
      status: e.review_status,
      position: idx >= 0 ? idx + 1 : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected server error" }, { status: 500 });
  }
}
