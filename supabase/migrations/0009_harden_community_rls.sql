-- UNIREAL security hardening. Apply after 0008.
--
-- Server actions are not the only way into these tables: the anon key ships to
-- every browser, so any signed-in user can POST straight to the PostgREST API.
-- Whatever the server action refuses to accept, RLS has to refuse as well.

-- ── 1. `verified` must not be client-settable ────────────────────────────────
-- The insert policies only checked `auth.uid() = author_id`, leaving `verified`
-- wide open: a normal user could insert a review/answer with verified = true
-- and wear the "verified student" badge, or post under any author_name.
-- Recompute both fields in a trigger so the value in the INSERT is ignored.

create or replace function public.enforce_review_trust()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role writes (seed script, cron) have no JWT: leave them untouched.
  -- Anon cannot reach here at all — the insert policies are `to authenticated`.
  if auth.uid() is null then
    return new;
  end if;

  new.author_id := auth.uid();
  new.verified := public.is_verified_for_university(
    coalesce(auth.jwt() ->> 'email', ''),
    new.university_id
  );
  new.author_name := left(trim(coalesce(new.author_name, '')), 80);
  if new.author_name = '' then
    new.author_name := 'Anonymous';
  end if;
  new.body := left(new.body, 2000);
  return new;
end;
$$;

drop trigger if exists reviews_enforce_trust on public.reviews;
create trigger reviews_enforce_trust
  before insert on public.reviews
  for each row execute function public.enforce_review_trust();

create or replace function public.enforce_question_trust()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role writes (seed script, cron) have no JWT: leave them untouched.
  -- Anon cannot reach here at all — the insert policies are `to authenticated`.
  if auth.uid() is null then
    return new;
  end if;

  new.author_id := auth.uid();
  new.author_name := left(trim(coalesce(new.author_name, '')), 80);
  if new.author_name = '' then
    new.author_name := 'Anonymous';
  end if;
  new.body := left(new.body, 2000);
  return new;
end;
$$;

drop trigger if exists questions_enforce_trust on public.questions;
create trigger questions_enforce_trust
  before insert on public.questions
  for each row execute function public.enforce_question_trust();

-- Answers hang off a question, so the university comes from the parent row.
create or replace function public.enforce_answer_trust()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_university_id text;
begin
  -- Service-role writes (seed script, cron) have no JWT: leave them untouched.
  -- Anon cannot reach here at all — the insert policies are `to authenticated`.
  if auth.uid() is null then
    return new;
  end if;

  select q.university_id into v_university_id
  from public.questions q
  where q.id = new.question_id;

  new.author_id := auth.uid();
  new.verified := public.is_verified_for_university(
    coalesce(auth.jwt() ->> 'email', ''),
    v_university_id
  );
  new.author_name := left(trim(coalesce(new.author_name, '')), 80);
  if new.author_name = '' then
    new.author_name := 'Anonymous';
  end if;
  new.body := left(new.body, 2000);
  return new;
end;
$$;

drop trigger if exists answers_enforce_trust on public.answers;
create trigger answers_enforce_trust
  before insert on public.answers
  for each row execute function public.enforce_answer_trust();

-- ── 2. Users must not edit their own profile e-mail ──────────────────────────
-- "profiles update own" allowed updating every column, and the reminder cron
-- mails whatever sits in profiles.email — so a user could point it at someone
-- else's inbox and have our verified domain send them mail. RLS cannot express
-- "all columns but one", so use column-level privileges: `name` only.
revoke update on public.profiles from authenticated;
grant update (name) on public.profiles to authenticated;

-- ── 3. Indexes for the hot query paths ───────────────────────────────────────
-- The default university listing sorts by research_score on every page, and
-- the ranking / affordable pages sort by ranking and tuition. Without these
-- Postgres sorts the whole ~10k-row table for each request.
create index if not exists universities_research_score_idx
  on public.universities (research_score desc nulls last);
create index if not exists universities_ranking_idx
  on public.universities (ranking asc nulls last);
create index if not exists universities_tuition_idx
  on public.universities (tuition asc nulls last);
-- The reminder cron filters favorites by the deadline it last mailed about.
create index if not exists favorites_reminded_idx
  on public.favorites (reminded_deadline);
