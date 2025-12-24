-- supabase/schema.sql
-- PeerPlates Waitlist: TJ-001..TJ-005 + admin review + referrals + vendor override
-- + privacy/consent + basic spam protection fields
-- Idempotent where possible.

create extension if not exists pgcrypto;

-- 1) Main table
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),

  role text not null check (role in ('consumer','vendor')),
  full_name text not null,
  email text not null,
  phone text,

  is_student boolean,
  university text,

  answers jsonb not null default '{}'::jsonb,

  -- Referral identity
  referral_code text unique,
  referred_by text,

  -- Vendor-only score
  vendor_priority_score int not null default 0,
  certificate_url text,

  -- TJ-005: referral movement / stats
  referral_points int not null default 0,
  referrals_count int not null default 0,

  -- TJ-004: Admin review
  review_status text not null default 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by text,

  -- TJ-004: Manual vendor ordering (lower = earlier)
  vendor_queue_override integer,

  -- Privacy + consent
  accepted_privacy boolean not null default false,
  accepted_marketing boolean not null default false,
  privacy_version text,
  consented_at timestamptz,

  -- Tracking / spam protection (basic)
  signup_source text,
  captcha_verified boolean not null default false,
  request_ip text,
  user_agent text,
  flagged boolean not null default false,
  flagged_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Add missing columns (if table existed already)
alter table public.waitlist_entries add column if not exists referral_points int not null default 0;
alter table public.waitlist_entries add column if not exists referrals_count int not null default 0;

alter table public.waitlist_entries add column if not exists review_status text not null default 'pending';
alter table public.waitlist_entries add column if not exists admin_notes text;
alter table public.waitlist_entries add column if not exists reviewed_at timestamptz;
alter table public.waitlist_entries add column if not exists reviewed_by text;

alter table public.waitlist_entries add column if not exists vendor_queue_override integer;

alter table public.waitlist_entries add column if not exists accepted_privacy boolean not null default false;
alter table public.waitlist_entries add column if not exists accepted_marketing boolean not null default false;
alter table public.waitlist_entries add column if not exists privacy_version text;
alter table public.waitlist_entries add column if not exists consented_at timestamptz;

alter table public.waitlist_entries add column if not exists signup_source text;
alter table public.waitlist_entries add column if not exists captcha_verified boolean not null default false;
alter table public.waitlist_entries add column if not exists request_ip text;
alter table public.waitlist_entries add column if not exists user_agent text;
alter table public.waitlist_entries add column if not exists flagged boolean not null default false;
alter table public.waitlist_entries add column if not exists flagged_reason text;

alter table public.waitlist_entries add column if not exists updated_at timestamptz not null default now();

-- 3) Ensure review_status check constraint exists
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'waitlist_entries'
      and c.conname = 'waitlist_entries_review_status_chk'
  ) then
    alter table public.waitlist_entries
      add constraint waitlist_entries_review_status_chk
      check (review_status in ('pending','reviewed','approved','rejected'));
  end if;
end $$;

-- 4) updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_waitlist_set_updated_at on public.waitlist_entries;

create trigger trg_waitlist_set_updated_at
before update on public.waitlist_entries
for each row execute function public.set_updated_at();

-- 5) Helpful indexes
create index if not exists waitlist_entries_role_idx
  on public.waitlist_entries(role);

create index if not exists waitlist_entries_created_at_idx
  on public.waitlist_entries(created_at);

create index if not exists waitlist_entries_review_status_idx
  on public.waitlist_entries(review_status);

create index if not exists waitlist_entries_vendor_score_idx
  on public.waitlist_entries(vendor_priority_score);

create index if not exists waitlist_entries_vendor_queue_override_idx
  on public.waitlist_entries(vendor_queue_override);

create index if not exists waitlist_entries_referral_code_idx
  on public.waitlist_entries(referral_code);

create index if not exists waitlist_entries_consumer_sort_idx
  on public.waitlist_entries(role, referral_points, created_at);

-- 6) Unique email per role (basic anti-spam)
-- If this fails due to duplicates, you must remove duplicates first.
create unique index if not exists waitlist_entries_role_email_ux
  on public.waitlist_entries (role, lower(email));

-- 7) Referral RPC used by /api/signup
create or replace function public.increment_referral_stats(
  p_referrer_id uuid,
  p_points int
)
returns void
language plpgsql
security definer
as $$
begin
  update public.waitlist_entries
  set
    referral_points = referral_points + p_points,
    referrals_count = referrals_count + 1,
    updated_at = now()
  where id = p_referrer_id;
end;
$$;

-- 8) Force PostgREST to refresh schema cache
notify pgrst, 'reload schema';
