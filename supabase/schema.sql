-- supabase/schema.sql
-- PeerPlates (Waitlist + TJ-004 Admin Review + Manual Vendor Queue Override)
-- FULL SCHEMA (idempotent / safe to run multiple times)

-- ------------------------------------------------------------
-- Extensions
-- ------------------------------------------------------------
create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Table: waitlist_entries
-- ------------------------------------------------------------
create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),

  -- Core identity
  role text not null,
  full_name text not null,
  email text not null,
  phone text,

  -- Consumer extras
  is_student boolean,
  university text,

  -- Dynamic questionnaire answers
  answers jsonb not null default '{}'::jsonb,

  -- Referrals
  referral_code text unique,
  referred_by text,

  -- Vendor scoring
  vendor_priority_score int not null default 0,
  certificate_url text,

  -- TJ-004: Admin review fields
  review_status text not null default 'pending',
  admin_notes text,
  reviewed_at timestamptz,
  reviewed_by text,

  -- TJ-004: Manual vendor queue override (lower number = earlier)
  vendor_queue_override integer,

  -- Timestamps
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Ensure columns exist (safe upgrades for existing deployments)
-- ------------------------------------------------------------
alter table public.waitlist_entries add column if not exists role text;
alter table public.waitlist_entries add column if not exists full_name text;
alter table public.waitlist_entries add column if not exists email text;
alter table public.waitlist_entries add column if not exists phone text;

alter table public.waitlist_entries add column if not exists is_student boolean;
alter table public.waitlist_entries add column if not exists university text;

alter table public.waitlist_entries add column if not exists answers jsonb;
alter table public.waitlist_entries add column if not exists referral_code text;
alter table public.waitlist_entries add column if not exists referred_by text;

alter table public.waitlist_entries add column if not exists vendor_priority_score int;
alter table public.waitlist_entries add column if not exists certificate_url text;

alter table public.waitlist_entries add column if not exists review_status text;
alter table public.waitlist_entries add column if not exists admin_notes text;
alter table public.waitlist_entries add column if not exists reviewed_at timestamptz;
alter table public.waitlist_entries add column if not exists reviewed_by text;

alter table public.waitlist_entries add column if not exists vendor_queue_override integer;

alter table public.waitlist_entries add column if not exists created_at timestamptz;
alter table public.waitlist_entries add column if not exists updated_at timestamptz;

-- ------------------------------------------------------------
-- Defaults (safe to re-run)
-- ------------------------------------------------------------
alter table public.waitlist_entries
  alter column answers set default '{}'::jsonb;

alter table public.waitlist_entries
  alter column vendor_priority_score set default 0;

alter table public.waitlist_entries
  alter column review_status set default 'pending';

alter table public.waitlist_entries
  alter column created_at set default now();

alter table public.waitlist_entries
  alter column updated_at set default now();

-- ------------------------------------------------------------
-- Constraints (idempotent)
-- ------------------------------------------------------------

-- role enum constraint
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'waitlist_entries'
      and c.conname = 'waitlist_entries_role_chk'
  ) then
    alter table public.waitlist_entries
      add constraint waitlist_entries_role_chk
      check (role in ('consumer','vendor'));
  end if;
end $$;

-- review_status enum constraint
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

-- ------------------------------------------------------------
-- Uniqueness + indexes
-- ------------------------------------------------------------

-- Prevent duplicate signups per role/email (same email can be both vendor and consumer)
create unique index if not exists waitlist_entries_role_email_ux
  on public.waitlist_entries (role, lower(email));

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

-- Helpful composite for vendor sorting
create index if not exists waitlist_entries_vendor_sorting_idx
  on public.waitlist_entries(role, vendor_queue_override, vendor_priority_score, created_at);

-- ------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- PostgREST schema reload (helps after ALTER TABLE)
-- ------------------------------------------------------------
notify pgrst, 'reload schema';
