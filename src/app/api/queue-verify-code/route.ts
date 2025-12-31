import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
  referral_code: string | null;
};

function supabasePublic() {
  if (!SUPABASE_URL || !ANON_KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
}

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

function cleanToken(v: string) {
  return String(v || "").trim().replace(/\s+/g, "");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const token = cleanToken(body?.token || "");

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!token) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    // 1) Verify OTP via Supabase Auth
    const sbPublic = supabasePublic();
    const { data: verified, error: vErr } = await sbPublic.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 400 });
    if (!verified?.user?.email) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

    // 2) Fetch waitlist entry via service role (by email)
    const sbAdmin = supabaseAdmin();
    const { data: entry, error: eErr } = await sbAdmin
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
          "referral_code",
        ].join(",")
      )
      .eq("email", email)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle<WaitlistEntry>();

    if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 3) Compute position (same logic as your queue-status route)
    let position: number | null = null;

    if (entry.role === "consumer") {
      const { data: consumers, error: cErr } = await sbAdmin
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
      const { data: vendors, error: vErr2 } = await sbAdmin
        .from("waitlist_entries")
        .select("id, vendor_queue_override, vendor_priority_score, created_at")
        .eq("role", "vendor");

      if (vErr2) return NextResponse.json({ error: vErr2.message }, { status: 500 });

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
      email: entry.email,
      role: entry.role,
      review_status: entry.review_status,
      position,
      score,
      created_at: entry.created_at,
      referral_code: entry.referral_code,
      // optional: if you still want referral link here, generate it in the client from origin
      referral_link: entry.referral_code ? `/join?ref=${encodeURIComponent(entry.referral_code)}` : null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected server error" }, { status: 500 });
  }
}
