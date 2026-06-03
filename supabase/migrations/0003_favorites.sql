-- UNIREAL phase: saved universities (favorites). Apply after 0002.

create table if not exists public.favorites (
  user_id       uuid not null references auth.users (id) on delete cascade,
  university_id text not null references public.universities (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, university_id)
);
create index if not exists favorites_user_idx on public.favorites (user_id);

alter table public.favorites enable row level security;

-- Each user fully manages their own favorites. (drop-then-create = re-runnable)
drop policy if exists "favorites select own" on public.favorites;
create policy "favorites select own" on public.favorites
  for select using (auth.uid() = user_id);

drop policy if exists "favorites insert own" on public.favorites;
create policy "favorites insert own" on public.favorites
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "favorites delete own" on public.favorites;
create policy "favorites delete own" on public.favorites
  for delete using (auth.uid() = user_id);
