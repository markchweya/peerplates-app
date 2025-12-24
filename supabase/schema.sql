-- supabase/schema.sql
-- PeerPlates: waitlist + admin review (TJ-004) + referrals (TJ-005) + manual vendor queue override
-- Safe to run multiple times (idempotent)

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

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

  -- TJ-005: Consumer referral movement
  referral_points int not null default 0,
  referrals_count int not null default 0,

  -- TJ-004: Admin review
  review_status text not null default 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by text,

  -- TJ-004: Manual vendor ordering (lower = earlier)
  vendor_queue_override integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Add missing columns if the table already existed (idempotent)
alter table public.waitlist_entries add column if not exists referral_points int not null default 0;
alter table public.waitlist_entries add column if not exists referrals_count int not null default 0;

alter table public.waitlist_entries add column if not exists review_status text not null default 'pending';
alter table public.waitlist_entries add column if not exists admin_notes text;
alter table public.waitlist_entries add column if not exists reviewed_at timestamptz;
alter table public.waitlist_entries add column if not exists reviewed_by text;

alter table public.waitlist_entries add column if not exists vendor_queue_override integer;
alter table public.waitlist_entries add column if not exists updated_at timestamptz not null default now();

-- Ensure review_status check constraint exists
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

-- Prevent duplicate signups per role/email (same email can join as consumer + vendor)
create unique index if not exists waitlist_entries_role_email_ux
  on public.waitlist_entries (role, lower(email));

-- Helpful indexes
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

-- Auto-update updated_at
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

-- Atomic referral increment for consumer referrers (TJ-005)
create or replace function public.increment_consumer_referrals(p_referral_code text)
returns uuid
language plpgsql
as $$
declare
  ref_id uuid;
  ref_role text;
begin
  select id, role
    into ref_id, ref_role
  from public.waitlist_entries
  where referral_code = p_referral_code
  limit 1;

  if ref_id is null then
    return null;
  end if;

  -- Only consumers get points that move the queue
  if ref_role = 'consumer' then
    update public.waitlist_entries
    set referral_points = coalesce(referral_points, 0) + 1,
        referrals_count = coalesce(referrals_count, 0) + 1
    where id = ref_id;
  end if;

  return ref_id;
end;
$$;

-- Force PostgREST to refresh schema
notify pgrst, 'reload schema';
