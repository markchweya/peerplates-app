// src/app/api/queue-status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type Role = "consumer" | "vendor";
type ReviewStatus = "pending" | "reviewed" | "approved" | "rejected";

type WaitlistEntry = {
  id: string;
  email: string;
  role: Role;
  review_status: ReviewStatus;
  created_at: string;
  referral_points: number | null;
  vendor_priority_score: number | null;
  vendor_queue_override: number | null;
};

function supabaseAnon() {
  if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

function getBearer(req: Request) {
  const h = (req.headers.get("authorization") || "").trim();
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim() || "";
}

export async function GET(req: NextRequest) {
  try {
    const token = getBearer(req);
    if (!token) return NextResponse.json({ error: "Missing Authorization token" }, { status: 401 });

    // 1) Validate token + read logged-in email
    const sbAnon = supabaseAnon();
    const { data: userData, error: userErr } = await sbAnon.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const email = String(userData.user.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "No email on session" }, { status: 401 });

    // 2) Find this person in waitlist table
    const sb = supabaseAdmin();
    const { data: entry, error: eErr } = await sb
      .from("waitlist_entries")
      .select(
        [
          "id",
          "email",
          "role",
          "review_status",
          "created_at",
          "referral_points",
          "vendor_priority_score",
          "vendor_queue_override",
        ].join(",")
      )
      .eq("email", email)
      .maybeSingle<WaitlistEntry>();

    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });
    if (!entry) return NextResponse.json({ error: "Not found on waitlist" }, { status: 404 });

    // 3) Compute position within their role queue
    let position: number | null = null;

    if (entry.role === "consumer") {
      const { data: consumers, error: cErr } = await sb
        .from("waitlist_entries")
        .select("id, referral_points, created_at")
        .eq("role", "consumer");

      if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 });

      const list = (consumers || []).slice().sort((a: any, b: any) => {
        const ap = Number(a.referral_points ?? 0);
        const bp = Number(b.referral_points ?? 0);
        if (ap !== bp) return bp - ap;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const idx = list.findIndex((x: any) => x.id === entry.id);
      position = idx >= 0 ? idx + 1 : null;
    } else {
      const { data: vendors, error: vErr } = await sb
        .from("waitlist_entries")
        .select("id, vendor_queue_override, vendor_priority_score, created_at")
        .eq("role", "vendor");

      if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 });

      const list = (vendors || []).slice().sort((a: any, b: any) => {
        const ao = a.vendor_queue_override;
        const bo = b.vendor_queue_override;

        const aHas = typeof ao === "number";
        const bHas = typeof bo === "number";

        if (aHas && bHas && ao !== bo) return ao - bo;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;

        const as = Number(a.vendor_priority_score ?? 0);
        const bs = Number(b.vendor_priority_score ?? 0);
        if (as !== bs) return bs - as;

        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const idx = list.findIndex((x: any) => x.id === entry.id);
      position = idx >= 0 ? idx + 1 : null;
    }

    const score =
      entry.role === "vendor"
        ? Number(entry.vendor_priority_score ?? 0)
        : Number(entry.referral_points ?? 0);

    return NextResponse.json({
      email,
      role: entry.role,
      review_status: entry.review_status,
      position,
      score,
      created_at: entry.created_at,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected server error" }, { status: 500 });
  }
}
