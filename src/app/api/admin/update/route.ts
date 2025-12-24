// src/app/api/admin/update/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function requireAdmin(req: Request) {
  if (!ADMIN_SECRET) throw new Error("Missing ADMIN_SECRET in .env.local");
  const incoming = (req.headers.get("x-admin-secret") || "").trim();
  if (incoming !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

const ALLOWED = new Set(["pending", "reviewed", "approved", "rejected"]);

export async function PATCH(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  const sb = supabaseAdmin();

  try {
    const body = await req.json().catch(() => ({}));

    const id = String(body?.id || "").trim();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const review_status =
      body?.review_status != null
        ? String(body.review_status).trim().toLowerCase()
        : null;

    const admin_notes =
      typeof body?.admin_notes === "string" ? body.admin_notes : null;

    const reviewed_by =
      typeof body?.reviewed_by === "string" && body.reviewed_by.trim()
        ? body.reviewed_by.trim()
        : "admin";

    // Vendor override (optional)
    const vendor_queue_override_raw = body?.vendor_queue_override;
    const vendor_queue_override =
      vendor_queue_override_raw === null ||
      vendor_queue_override_raw === undefined ||
      vendor_queue_override_raw === ""
        ? null
        : Number(vendor_queue_override_raw);

    if (review_status !== null && !ALLOWED.has(review_status)) {
      return NextResponse.json(
        { error: "Invalid review_status. Use pending|reviewed|approved|rejected" },
        { status: 400 }
      );
    }

    if (
      vendor_queue_override_raw !== undefined &&
      vendor_queue_override !== null &&
      Number.isNaN(vendor_queue_override)
    ) {
      return NextResponse.json(
        { error: "vendor_queue_override must be a number or null" },
        { status: 400 }
      );
    }

    // Check role first (so consumers can't accidentally get vendor override)
    const { data: existing, error: existingErr } = await sb
      .from("waitlist_entries")
      .select("id, role")
      .eq("id", id)
      .maybeSingle();

    if (existingErr) {
      return NextResponse.json({ error: existingErr.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const patch: Record<string, any> = {};

    // Always allow notes to be updated (null clears)
    if (body?.admin_notes !== undefined) {
      patch.admin_notes = admin_notes;
    }

    if (review_status !== null) {
      patch.review_status = review_status;
      patch.reviewed_by = reviewed_by;
      patch.reviewed_at = review_status !== "pending" ? new Date().toISOString() : null;
    }

    // Apply override only if caller provided it AND entry is vendor
    if (vendor_queue_override_raw !== undefined && existing.role === "vendor") {
      patch.vendor_queue_override = vendor_queue_override;
    }

    const { data, error } = await sb
      .from("waitlist_entries")
      .update(patch)
      .eq("id", id)
      .select(
        [
          "id",
          "role",
          "full_name",
          "email",
          "phone",
          "is_student",
          "university",
          "answers",

          "referral_code",
          "referred_by",
          "referrals_count",
          "referral_points",

          "vendor_priority_score",
          "vendor_queue_override",
          "certificate_url",

          "created_at",
          "updated_at",

          "review_status",
          "admin_notes",
          "reviewed_at",
          "reviewed_by",
        ].join(",")
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, row: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
