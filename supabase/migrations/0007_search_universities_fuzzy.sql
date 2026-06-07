-- Fuzzy university search used by the EMi chat assistant.
-- Matches a transliterated Latin query against English names (and city) and
-- the raw query against localized fa/ro names, using pg_trgm word-similarity.
-- Returns each hit as jsonb plus its similarity score (0–1) so the chat layer
-- can answer a single confident match directly or list close matches.

create extension if not exists pg_trgm;

drop function if exists search_universities_fuzzy(text, text, real, int);

create function search_universities_fuzzy(
  q_latin text,
  q_orig text,
  match_threshold real default 0.4,
  match_limit int default 5
)
returns table (university jsonb, score real)
language sql
stable
as $$
  select to_jsonb(u) as university,
         greatest(
           word_similarity(q_latin, u.name),
           word_similarity(q_orig, coalesce(u.names_i18n->>'fa', '')),
           word_similarity(q_orig, coalesce(u.names_i18n->>'ro', '')),
           word_similarity(q_latin, coalesce(u.city, ''))
         ) as score
  from universities u
  where greatest(
          word_similarity(q_latin, u.name),
          word_similarity(q_orig, coalesce(u.names_i18n->>'fa', '')),
          word_similarity(q_orig, coalesce(u.names_i18n->>'ro', '')),
          word_similarity(q_latin, coalesce(u.city, ''))
        ) >= match_threshold
  order by score desc, u.research_score desc nulls last
  limit match_limit;
$$;

grant execute on function search_universities_fuzzy(text, text, real, int)
  to anon, authenticated, service_role;
