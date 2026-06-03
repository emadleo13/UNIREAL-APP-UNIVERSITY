-- UNIREAL phase: blog posts (AI-generated daily news). Apply after 0004.

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  summary     text,
  body        text not null,
  category    text,                 -- scholarship | admission | olympiad | news
  source_url  text,
  published   boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists posts_published_idx on public.posts (published, created_at desc);

alter table public.posts enable row level security;

-- Everyone reads published posts; admins manage everything.
create policy "posts read published" on public.posts
  for select using (published or public.is_admin());
create policy "posts admin write" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());
