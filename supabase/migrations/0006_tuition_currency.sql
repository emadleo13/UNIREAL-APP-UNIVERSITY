-- Track the currency of `tuition`. AI enrichment now stores tuition in EUR;
-- pre-existing tuition came from US College Scorecard data (USD).
alter table public.universities
  add column if not exists tuition_currency text;

-- Backfill legacy values: any tuition already present was USD scorecard data.
update public.universities
  set tuition_currency = 'USD'
  where tuition is not null and tuition_currency is null;
