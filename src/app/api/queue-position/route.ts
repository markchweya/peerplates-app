// src/app/api/queue-position/route.ts
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

    // Confirm entry exists + role
    const { data: entry, error: entryErr } = await sb
      .from("waitlist_entries")
      .select("id, role")
      .eq("id", id)
      .single();

    if (entryErr || !entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ✅ Vendors: no public queue position in TJ-005
    if (entry.role === "vendor") {
      return NextResponse.json({
        id: entry.id,
        role: entry.role,
        position: null,
      });
    }

    // ✅ Consumers: order by referral_points DESC, then created_at ASC
    const { data: consumers, error: cErr } = await sb
      .from("waitlist_entries")
      .select("id, referral_points, created_at")
      .eq("role", "consumer");

    if (cErr) {
      return NextResponse.json({ error: cErr.message }, { status: 500 });
    }

    const list = (consumers || []).slice().sort((a: any, b: any) => {
      const ap = Number(a.referral_points ?? 0);
      const bp = Number(b.referral_points ?? 0);
      if (ap !== bp) return bp - ap; // higher points first
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ); // earlier signup first
    });

    const idx = list.findIndex((x: any) => x.id === id);

    return NextResponse.json({
      id: entry.id,
      role: "consumer",
      position: idx >= 0 ? idx + 1 : null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
