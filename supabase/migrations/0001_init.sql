-- UNIREAL initial schema. Aligned with lib/data/types.ts.
-- Apply via the Supabase SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";

-- ── Universities ─────────────────────────────────────────────────────────────
create table if not exists public.universities (
  id              text primary key,        -- == slug
  slug            text unique not null,
  name            text not null,
  names_i18n      jsonb default '{}'::jsonb,
  country         text not null,
  country_code    text not null,
  city            text,
  region          text,
  website         text,
  domains         text[] not null default '{}',
  geo             jsonb,                    -- { "lat": .., "lng": .. }
  logo_url        text,
  established_year int,
  ror_id          text,
  wikidata_id     text,
  openalex_id     text,
  ranking         int,
  research_score  int,
  tuition         numeric,
  admission_rate  numeric,
  size            int,
  source          text[] not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists universities_country_idx on public.universities (country);
create index if not exists universities_name_trgm_idx on public.universities using gin (name gin_trgm_ops);
-- (requires: create extension if not exists pg_trgm;)
create extension if not exists pg_trgm;

-- ── Reviews ──────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  university_id text not null references public.universities (id) on delete cascade,
  author_id     uuid references auth.users (id) on delete set null,
  author_name   text not null,
  rating        int not null check (rating between 1 and 5),
  body          text not null,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists reviews_university_idx on public.reviews (university_id);

-- ── Questions & Answers ──────────────────────────────────────────────────────
create table if not exists public.questions (
  id            uuid primary key default gen_random_uuid(),
  university_id text not null references public.universities (id) on delete cascade,
  author_id     uuid references auth.users (id) on delete set null,
  author_name   text not null,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index if not exists questions_university_idx on public.questions (university_id);

create table if not exists public.answers (
  id            uuid primary key default gen_random_uuid(),
  question_id   uuid not null references public.questions (id) on delete cascade,
  author_id     uuid references auth.users (id) on delete set null,
  author_name   text not null,
  body          text not null,
  verified      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists answers_question_idx on public.answers (question_id);

-- ── Verified badge helper ────────────────────────────────────────────────────
-- Returns true when an email's domain matches (or is a subdomain of) any of the
-- university's registered domains. Use from an insert trigger or RPC.
create or replace function public.is_verified_for_university(
  p_email text,
  p_university_id text
) returns boolean
language sql stable as $$
  select exists (
    select 1
    from public.universities u, unnest(u.domains) as d
    where u.id = p_university_id
      and (
        lower(split_part(p_email, '@', 2)) = lower(d)
        or lower(split_part(p_email, '@', 2)) like '%.' || lower(d)
      )
  );
$$;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.universities enable row level security;
alter table public.reviews      enable row level security;
alter table public.questions    enable row level security;
alter table public.answers      enable row level security;

-- Public read access for everyone.
create policy "universities read" on public.universities for select using (true);
create policy "reviews read"      on public.reviews      for select using (true);
create policy "questions read"    on public.questions    for select using (true);
create policy "answers read"      on public.answers      for select using (true);

-- Authenticated users can contribute.
create policy "reviews insert"   on public.reviews
  for insert to authenticated with check (auth.uid() = author_id);
create policy "questions insert" on public.questions
  for insert to authenticated with check (auth.uid() = author_id);
create policy "answers insert"   on public.answers
  for insert to authenticated with check (auth.uid() = author_id);
