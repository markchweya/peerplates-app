import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { vendorPriorityScoreFromAnswers } from "../../../lib/vendorPriorityScore";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

type Role = "consumer" | "vendor";

const REFERRAL_POINTS_PER_SIGNUP = 10;

// Basic spam protection:
// - Honeypot field (hp) must be empty
// - Duplicate protection is handled by DB unique index (role, lower(email))

function supabaseAdmin() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function randomCode(len = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function generateUniqueReferralCode(sb: ReturnType<typeof supabaseAdmin>) {
  for (let i = 0; i < 8; i++) {
    const code = randomCode(8);
    const { data, error } = await sb
      .from("waitlist_entries")
      .select("id")
      .eq("referral_code", code)
      .maybeSingle();

    if (error) break;
    if (!data) return code;
  }

  return `${randomCode(6)}${Date.now().toString().slice(-2)}`;
}

function normalizeStudent(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "yes" || s === "true") return true;
    if (s === "no" || s === "false") return false;
  }
  return null;
}

function pickUniversity(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim();
  return u ? u : null;
}

function normalizeBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes" || s === "on";
  }
  return false;
}

// Optional: enforce “max 3 cuisines” for common keys (safe even if you rename later)
function enforceMax3Cuisines(answers: any) {
  const keys = ["top_cuisines", "cuisines", "sell_categories"];
  for (const k of keys) {
    const v = answers?.[k];
    if (Array.isArray(v) && v.length > 3) {
      throw new Error("Please select up to 3 cuisines.");
    }
  }
}

function getClientIp(req: Request): string | null {
  // Works behind proxies/CDN sometimes
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return null;
}

export async function POST(req: Request) {
  const sb = supabaseAdmin();

  try {
    const ct = req.headers.get("content-type") || "";

    let roleRaw: unknown;
    let fullNameRaw: unknown;
    let emailRaw: unknown;
    let phoneRaw: unknown;
    let refRaw: unknown;

    let acceptedPrivacyRaw: unknown;
    // accept BOTH names (old + new) so you don’t break anything:
    let marketingConsentRaw: unknown; // marketing_consent (old)
    let acceptedMarketingRaw: unknown; // accepted_marketing (new)
    let hpRaw: unknown;

    let captchaVerifiedRaw: unknown;
    let signupSourceRaw: unknown;

    let answers: any = {};
    let certificateFile: File | null = null;

    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();

      roleRaw = fd.get("role");
      fullNameRaw = fd.get("fullName") ?? fd.get("full_name");
      emailRaw = fd.get("email");
      phoneRaw = fd.get("phone");
      refRaw = fd.get("ref") ?? fd.get("referred_by") ?? fd.get("referredBy");

      acceptedPrivacyRaw = fd.get("accepted_privacy");

      marketingConsentRaw = fd.get("marketing_consent");
      acceptedMarketingRaw = fd.get("accepted_marketing");

      hpRaw = fd.get("hp");

      captchaVerifiedRaw = fd.get("captcha_verified");
      signupSourceRaw = fd.get("signup_source");

      const answersRaw = String(fd.get("answers") || "{}");
      try {
        answers = JSON.parse(answersRaw);
      } catch {
        answers = {};
      }

      const maybeFile = fd.get("certificate_upload");
      certificateFile = maybeFile instanceof File ? maybeFile : null;
    } else {
      const body = await req.json();

      roleRaw = body?.role;
      fullNameRaw = body?.fullName ?? body?.full_name;
      emailRaw = body?.email;
      phoneRaw = body?.phone;
      refRaw = body?.ref ?? body?.referred_by ?? body?.referredBy;

      acceptedPrivacyRaw = body?.accepted_privacy;

      marketingConsentRaw = body?.marketing_consent;
      acceptedMarketingRaw = body?.accepted_marketing;

      hpRaw = body?.hp;

      captchaVerifiedRaw = body?.captcha_verified;
      signupSourceRaw = body?.signup_source;

      answers = body?.answers || {};
    }

    // bot honeypot
    const hp = String(hpRaw || "").trim();
    if (hp) return jsonError("Bot detected.", 400);

    const role = String(roleRaw || "").trim().toLowerCase() as Role;
    const fullName = String(fullNameRaw || "").trim();
    const email = String(emailRaw || "").trim().toLowerCase();
    const phone = phoneRaw ? String(phoneRaw).trim() : null;
    const ref = refRaw ? String(refRaw).trim() : null;

    const accepted_privacy = normalizeBool(acceptedPrivacyRaw);

    // ✅ FIX: DB expects accepted_marketing, but frontend might send marketing_consent
    const accepted_marketing =
      normalizeBool(acceptedMarketingRaw) || normalizeBool(marketingConsentRaw);

    const captcha_verified = normalizeBool(captchaVerifiedRaw);
    const signup_source =
      typeof signupSourceRaw === "string" ? signupSourceRaw.trim() || null : null;

    if (role !== "consumer" && role !== "vendor") return jsonError("Invalid role.");
    if (!fullName) return jsonError("Full name is required.");
    if (!email) return jsonError("Email is required.");

    // privacy required
    if (!accepted_privacy) return jsonError("Privacy/Terms acceptance is required.");

    enforceMax3Cuisines(answers);

    // Student/university consistency:
    const isStudent = normalizeStudent(answers?.is_student);
    let university = pickUniversity(answers?.university);
    if (isStudent === false) university = null;

    // Validate referral (if provided)
    let referred_by: string | null = null;
    let referrer_id: string | null = null;

    if (ref) {
      const { data: referrer, error: refErr } = await sb
        .from("waitlist_entries")
        .select("id, email")
        .eq("referral_code", ref)
        .maybeSingle();

      if (!refErr && referrer && String(referrer.email || "").toLowerCase() !== email) {
        referred_by = ref;
        referrer_id = referrer.id as string;
      }
    }

    const referral_code = await generateUniqueReferralCode(sb);

    const vendor_priority_score =
      role === "vendor" ? vendorPriorityScoreFromAnswers(answers) : 0;

    // Upload certificate (vendor only)
    let certificate_url: string | null = null;

    if (role === "vendor" && certificateFile) {
      const okTypes = ["application/pdf", "image/png", "image/jpeg"];
      if (!okTypes.includes(certificateFile.type)) {
        return jsonError("Certificate must be PDF, JPG, or PNG.");
      }

      const maxBytes = 5 * 1024 * 1024;
      if (certificateFile.size > maxBytes) {
        return jsonError("Certificate too large (max 5MB).");
      }

      const ext =
        certificateFile.type === "application/pdf"
          ? "pdf"
          : certificateFile.type === "image/png"
          ? "png"
          : "jpg";

      const path = `${email}/${Date.now()}-${randomCode(6)}.${ext}`;

      const arrayBuffer = await certificateFile.arrayBuffer();
      const up = await sb.storage
        .from("vendor-certificates")
        .upload(path, new Uint8Array(arrayBuffer), {
          contentType: certificateFile.type,
          upsert: false,
        });

      if (up.error) return jsonError(`Upload failed: ${up.error.message}`, 500);

      certificate_url = path;
    }

    const insertPayload = {
      role,
      full_name: fullName,
      email,
      phone: phone || null,

      is_student: isStudent,
      university,

      answers,

      referral_code,
      referred_by,

      vendor_priority_score,
      certificate_url,

      // ✅ columns that exist in YOUR DB:
      accepted_privacy,
      accepted_marketing,
      consented_at: new Date().toISOString(),

      // optional extras (also exist in your DB list)
      privacy_version: "v1",
      signup_source,
      captcha_verified,

      request_ip: getClientIp(req),
      user_agent: req.headers.get("user-agent") || null,
    };

    const { data, error } = await sb
      .from("waitlist_entries")
      .insert(insertPayload)
      .select("id, referral_code")
      .single();

    if (error) {
      const msg = String(error.message || "");
      if (msg.toLowerCase().includes("duplicate") || msg.includes("23505")) {
        return jsonError("This email is already on the waitlist.", 409);
      }
      return jsonError(msg || "Database insert failed.", 500);
    }

    // Award referral stats (do not block signup if this fails)
    if (referrer_id) {
      const { error: rpcErr } = await sb.rpc("increment_referral_stats", {
        p_referrer_id: referrer_id,
        p_points: REFERRAL_POINTS_PER_SIGNUP,
      });
      if (rpcErr) {
        // swallow to avoid breaking signup
      }
    }

    return NextResponse.json({
      id: data.id,
      referral_code: data.referral_code,
    });
  } catch (e: any) {
    return jsonError(e?.message || "Unexpected server error.", 500);
  }
}
