-- UNIREAL phase: lead generation + deadline reminders. Apply after 0007.

-- "Request info" leads collected on university pages. Service-role only:
-- inserted via server action with the admin client, read by the owner for
-- future B2B partnerships with universities.
create table if not exists public.leads (
  id                   uuid primary key default gen_random_uuid(),
  university_id        text not null references public.universities (id) on delete cascade,
  user_id              uuid references auth.users (id) on delete set null,
  name                 text not null,
  email                text not null,
  study_level          text,
  field_of_study       text,
  country_of_residence text,
  message              text,
  consent              boolean not null default false,
  locale               text,
  status               text not null default 'new',
  created_at           timestamptz not null default now(),
  unique (email, university_id)
);
create index if not exists leads_university_idx on public.leads (university_id);
create index if not exists leads_created_idx on public.leads (created_at desc);

-- RLS with no policies: only the service role can read/write.
alter table public.leads enable row level security;

-- Deadline reminders: remember which deadline we last emailed about per saved
-- university, so a user is reminded once per deadline (and again if it changes).
alter table public.favorites
  add column if not exists reminded_deadline text;
