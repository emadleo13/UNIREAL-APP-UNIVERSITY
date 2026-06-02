-- UNIREAL phase 2: editorial columns, profiles, subscriptions, admin + RLS.
-- Apply after 0001_init.sql via the Supabase SQL editor or `supabase db push`.

-- ── Editorial / curated columns on universities ──────────────────────────────
alter table public.universities
  add column if not exists description_i18n    jsonb,
  add column if not exists programs_count       int,
  add column if not exists admission             jsonb,   -- { period, deadline }
  add column if not exists international_url      text,
  add column if not exists international          jsonb,   -- { admissionPeriod, deadline, tuition, programsCount, languages }
  add column if not exists awards                 int,
  add column if not exists medals                 int,
  add column if not exists elite_students         int,
  add column if not exists updated_at             timestamptz;

-- Reviews: where an aggregated review came from.
alter table public.reviews
  add column if not exists source     text,
  add column if not exists source_url text;

-- Fast distinct-country list for the filter dropdown.
create or replace function public.distinct_countries()
returns table(country text)
language sql stable as $$
  select distinct country from public.universities order by country;
$$;

-- ── Admin allow-list ─────────────────────────────────────────────────────────
-- Emails that get admin access. Seed with the owner; edit here as needed.
create table if not exists public.admin_emails (
  email text primary key
);
insert into public.admin_emails (email) values ('emadcomircom@gmail.com')
  on conflict do nothing;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_emails a
    where lower(a.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ── Profiles (mirror of auth.users with app fields) ──────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null,
  name        text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'full_name')
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Subscriptions ────────────────────────────────────────────────────────────
-- status: 'free' | 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired'
create table if not exists public.subscriptions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users (id) on delete cascade,
  status                   text not null default 'free',
  plan                     text,
  stripe_customer_id       text,
  stripe_subscription_id   text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  -- set once we've emailed the user that their plan is about to expire,
  -- so the cron job never double-sends for the same period.
  expiry_notified_at       timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id)
);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_period_end_idx on public.subscriptions (current_period_end);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_emails  enable row level security;

-- Profiles: a user reads/updates their own; admins read all.
create policy "profiles read own or admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id);

-- Subscriptions: a user reads their own; admins read all. Writes happen via the
-- service role (Stripe webhook / cron), which bypasses RLS.
create policy "subscriptions read own or admin" on public.subscriptions
  for select using (auth.uid() = user_id or public.is_admin());

-- Admin list is readable only by admins.
create policy "admin_emails read admin" on public.admin_emails
  for select using (public.is_admin());

-- Admins may moderate community content.
create policy "reviews admin delete"   on public.reviews   for delete using (public.is_admin());
create policy "questions admin delete" on public.questions for delete using (public.is_admin());
create policy "answers admin delete"   on public.answers   for delete using (public.is_admin());
