-- supabase/schema.sql
-- PeerPlates Waitlist schema (idempotent; safe to paste into Supabase SQL Editor too)

-- 1) Extensions
create extension if not exists pgcrypto;

-- 2) Base table (created only if missing)
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),

  -- Identity / contact
  role text not null check (role in ('consumer','vendor')),
  full_name text not null,
  email text not null,
  phone text,

  -- Student fields (derived from answers)
  is_student boolean,
  university text,

  -- Raw form answers JSON
  answers jsonb not null default '{}'::jsonb,

  -- Referral system
  referral_code text unique,
  referred_by text,
  referrals_count integer not null default 0,
  referral_points integer not null default 0,

  -- Vendor priority / ordering
  vendor_priority_score integer not null default 0 check (vendor_priority_score between 0 and 10),
  vendor_queue_override integer,
  certificate_url text,

  -- Review workflow
  review_status text not null default 'pending' check (review_status in ('pending','reviewed','approved','rejected')),
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by text,

  -- Consent
  accepted_privacy boolean not null default false,
  consented_at timestamptz,
  accepted_marketing boolean not null default false,
  marketing_consent boolean not null default false,

  -- Existing extra fields (optional but harmless)
  captcha_verified boolean,
  flagged boolean,
  flagged_reason text,
  privacy_version text,
  request_ip text,
  signup_source text,
  user_agent text,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Ensure columns exist even if table already existed (THIS is what fixes your error)
alter table public.waitlist_entries
  -- consent (safe)
  add column if not exists accepted_marketing boolean not null default false,
  add column if not exists marketing_consent boolean not null default false,

  -- extra fields you already have (safe)
  add column if not exists captcha_verified boolean,
  add column if not exists flagged boolean,
  add column if not exists flagged_reason text,
  add column if not exists privacy_version text,
  add column if not exists request_ip text,
  add column if not exists signup_source text,
  add column if not exists user_agent text,

  -- extracted “no more CSV cleaning” columns (missing right now in your table)
  add column if not exists compliance_readiness text[] not null default '{}'::text[],
  add column if not exists instagram_handle text,
  add column if not exists bus_minutes integer,
  add column if not exists city text,

  -- optional consumer convenience columns
  add column if not exists top_cuisines text[] not null default '{}'::text[],
  add column if not exists delivery_area text,
  add column if not exists dietary_preferences text[] not null default '{}'::text[];

-- 4) Indexes
create index if not exists waitlist_entries_role_created_at_idx
  on public.waitlist_entries (role, created_at);

create index if not exists waitlist_entries_review_status_idx
  on public.waitlist_entries (review_status);

create index if not exists waitlist_entries_referral_code_idx
  on public.waitlist_entries (referral_code);

create index if not exists waitlist_entries_city_idx
  on public.waitlist_entries (city);

create index if not exists waitlist_entries_vendor_order_idx
  on public.waitlist_entries (vendor_queue_override, vendor_priority_score desc, created_at asc)
  where role = 'vendor';

create index if not exists waitlist_entries_consumer_order_idx
  on public.waitlist_entries (referral_points desc, created_at asc)
  where role = 'consumer';

-- Optional: case-insensitive unique email (comment out if you have duplicates)
create unique index if not exists waitlist_entries_email_lower_uniq
  on public.waitlist_entries (lower(email));

-- 5) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_waitlist_set_updated_at on public.waitlist_entries;
create trigger trg_waitlist_set_updated_at
before update on public.waitlist_entries
for each row execute function public.set_updated_at();

-- 6) Sync extracted columns from answers JSON -> real columns
create or replace function public.sync_waitlist_extracted_columns()
returns trigger
language plpgsql
as $$
declare
  v jsonb;
begin
  v := coalesce(new.answers, '{}'::jsonb);

  -- City (tries multiple keys)
  new.city :=
    nullif(
      trim(
        coalesce(
          v->>'city',
          v->>'location_city',
          v->>'vendor_city',
          v->>'consumer_city',
          ''
        )
      ),
      ''
    );

  -- compliance_readiness
  if jsonb_typeof(v->'compliance_readiness') = 'array' then
    new.compliance_readiness :=
      array(select jsonb_array_elements_text(v->'compliance_readiness'));
  else
    new.compliance_readiness := '{}'::text[];
  end if;

  -- instagram_handle
  new.instagram_handle := nullif(trim(coalesce(v->>'instagram_handle','')), '');

  -- bus_minutes
  begin
    new.bus_minutes := nullif(trim(coalesce(v->>'bus_minutes','')), '')::int;
  exception when others then
    new.bus_minutes := null;
  end;

  -- top_cuisines (try two keys)
  if jsonb_typeof(v->'top_cuisines') = 'array' then
    new.top_cuisines := array(select jsonb_array_elements_text(v->'top_cuisines'));
  elsif jsonb_typeof(v->'cuisines') = 'array' then
    new.top_cuisines := array(select jsonb_array_elements_text(v->'cuisines'));
  else
    new.top_cuisines := '{}'::text[];
  end if;

  -- delivery_area
  new.delivery_area := nullif(trim(coalesce(v->>'delivery_area','')), '');

  -- dietary_preferences
  if jsonb_typeof(v->'dietary_preferences') = 'array' then
    new.dietary_preferences := array(select jsonb_array_elements_text(v->'dietary_preferences'));
  else
    new.dietary_preferences := '{}'::text[];
  end if;

  return new;
end;
$$;

drop trigger if exists sync_waitlist_extracted_columns on public.waitlist_entries;
create trigger sync_waitlist_extracted_columns
before insert or update of answers on public.waitlist_entries
for each row execute function public.sync_waitlist_extracted_columns();

-- 7) Referral RPC used by your API
create or replace function public.increment_referral_stats(
  p_referrer_id uuid,
  p_points integer
)
returns void
language plpgsql
security definer
as $$
begin
  update public.waitlist_entries
  set
    referrals_count = coalesce(referrals_count, 0) + 1,
    referral_points = coalesce(referral_points, 0) + greatest(coalesce(p_points,0), 0)
  where id = p_referrer_id
    and role = 'consumer';
end;
$$;

-- 8) Backfill extracted columns for existing rows (forces trigger to populate)
update public.waitlist_entries
set answers = coalesce(answers, '{}'::jsonb)
where answers is not null;

update public.waitlist_entries
set answers = answers
where true;

-- 9) Optional RLS (leave off unless you’re ready to write policies)
-- alter table public.waitlist_entries enable row level security;
