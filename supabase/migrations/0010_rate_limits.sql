-- UNIREAL: rate limiting + AI budget, kept in Postgres. Apply after 0009.
--
-- These tables hold short-lived counters, not application data. They live here
-- rather than in a separate Redis so the project keeps one datastore; the
-- trade-off is that a request flood also writes here, which is fine at this
-- scale. Everything is service-role only (RLS on, no policies) — the counters
-- are written by server actions through the admin client, never by a browser.

-- ── Fixed-window request counters ───────────────────────────────────────────
-- One row per (bucket, caller, window). Old rows are deleted opportunistically
-- by the function below, so no cleanup cron is required.
create table if not exists public.rate_limits (
  bucket       text        not null,   -- 'lead' | 'chat' | 'community' | …
  caller       text        not null,   -- 'u:<uuid>' or 'ip:<addr>'
  window_start timestamptz not null,
  count        int         not null default 0,
  primary key (bucket, caller, window_start)
);
create index if not exists rate_limits_window_idx
  on public.rate_limits (window_start);

alter table public.rate_limits enable row level security;

-- ── Daily AI spend counter ──────────────────────────────────────────────────
create table if not exists public.ai_budget (
  day  date primary key,
  used int  not null default 0
);
alter table public.ai_budget enable row level security;

-- ── Per-slug enrichment locks ───────────────────────────────────────────────
create table if not exists public.ai_locks (
  slug       text        primary key,
  expires_at timestamptz not null
);
alter table public.ai_locks enable row level security;

-- ── consume_rate_limit ──────────────────────────────────────────────────────
-- Atomically claim one request in a fixed window. Returns true when allowed.
--
-- INSERT … ON CONFLICT DO UPDATE is a single statement, so concurrent callers
-- serialise on the row lock: each gets a distinct count and none can read a
-- stale value. This is the Postgres equivalent of Redis INCR — the property
-- that makes the limit (and the budget below) safe against a race.
create or replace function public.consume_rate_limit(
  p_bucket        text,
  p_caller        text,
  p_limit         int,
  p_window_secs   int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_window_start timestamptz;
  v_count        int;
begin
  -- Truncate now() to the start of the current fixed window.
  v_window_start := to_timestamp(
    floor(extract(epoch from now()) / p_window_secs) * p_window_secs
  );

  insert into public.rate_limits (bucket, caller, window_start, count)
  values (p_bucket, p_caller, v_window_start, 1)
  on conflict (bucket, caller, window_start)
    do update set count = public.rate_limits.count + 1
  returning count into v_count;

  -- Opportunistic cleanup: roughly 1 call in 100 clears expired rows, which
  -- keeps the table small without a scheduled job.
  if random() < 0.01 then
    delete from public.rate_limits
    where window_start < now() - interval '2 hours';
  end if;

  return v_count <= p_limit;
end;
$$;

-- ── claim_ai_budget ─────────────────────────────────────────────────────────
-- Atomically spend one unit of today's AI budget. False when exhausted.
create or replace function public.claim_ai_budget(p_budget int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
begin
  insert into public.ai_budget (day, used)
  values (current_date, 1)
  on conflict (day) do update set used = public.ai_budget.used + 1
  returning used into v_used;

  return v_used <= p_budget;
end;
$$;

-- ── acquire_ai_lock ─────────────────────────────────────────────────────────
-- Take a short-lived per-slug lock so two visitors landing on the same
-- un-enriched university page don't both pay for the same research call.
-- The DO UPDATE only fires on an *expired* row, so a live lock is never stolen:
-- when the row exists and is still live the WHERE fails, no row is returned,
-- and RETURNING leaves v_got NULL — which coalesces to false.
create or replace function public.acquire_ai_lock(
  p_slug text,
  p_ttl_secs int default 120
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_got boolean;
begin
  insert into public.ai_locks (slug, expires_at)
  values (p_slug, now() + make_interval(secs => p_ttl_secs))
  on conflict (slug) do update
    set expires_at = now() + make_interval(secs => p_ttl_secs)
    where public.ai_locks.expires_at < now()
  returning true into v_got;

  if random() < 0.01 then
    delete from public.ai_locks where expires_at < now() - interval '1 hour';
  end if;

  return coalesce(v_got, false);
end;
$$;

-- Only the service role may call these — server actions use the admin client.
-- Postgres grants EXECUTE to PUBLIC by default and anon/authenticated inherit
-- that, so revoking from those two roles alone would still leave the functions
-- callable with the public anon key: a visitor could burn the AI budget or
-- hold every enrichment lock. Revoke from PUBLIC, then grant back explicitly.
revoke execute on function public.consume_rate_limit(text, text, int, int) from public;
revoke execute on function public.claim_ai_budget(int) from public;
revoke execute on function public.acquire_ai_lock(text, int) from public;

grant execute on function public.consume_rate_limit(text, text, int, int) to service_role;
grant execute on function public.claim_ai_budget(int) to service_role;
grant execute on function public.acquire_ai_lock(text, int) to service_role;
