# UNIREAL — University reviews & answers (mobile-first, multilingual)

A Next.js 15 web app for discovering universities worldwide, reading real
reviews and asking questions. Mobile-first, SEO-friendly (SSR + JSON-LD),
trilingual (English / Română / فارسی with RTL).

## Stack
- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS** (mobile-first)
- **next-intl** — i18n routing for `en` / `ro` / `fa` (+ RTL)
- **Supabase** — wired behind a swappable data layer (currently off; mock mode)

## Getting started
```bash
npm install
cp .env.example .env        # defaults to NEXT_PUBLIC_DATA_SOURCE=mock
npm run dev                 # http://localhost:3000  → redirects to /en
```
Visit `/en`, `/ro`, `/fa`. The `/fa` routes render right-to-left.

## Data pipeline (university database)
A layered enrichment pipeline merges several free, legally-licensed sources.
Output is written to `data/universities.json` (the mock seed; later loaded into
Supabase). Raw API responses are cached under `data/raw/`.

| Step | Command | Source | Adds |
|------|---------|--------|------|
| 1 | `npm run data:hipolabs` | Hipolabs (MIT) | name, country, **domains**, website, slug |
| 2 | `npm run data:enrich`   | OpenAlex (CC0) | ROR/Wikidata ids, geo, logo, **multilingual names**, research score |
| 3 | `npm run data:scorecard`| College Scorecard | US tuition, admission rate, size *(needs `SCORECARD_API_KEY`)* |
| 4 | `npm run data:wikidata` | Wikidata (CC0) | logo, founding year, students, fa/ro labels |
| — | `npm run data:merge`    | — | dedupe, sort, validate, print stats |

Quick build (steps 1, 2, merge):
```bash
npm run data:build
# bound OpenAlex paging while testing:
npm run data:enrich -- --max-pages=20
```

### Why multiple sources?
No single source has everything. Hipolabs gives breadth + the **email domains**
that power the Verified badge. OpenAlex (built on ROR) adds canonical ids, geo,
logos and — crucially for this trilingual app — **localized university names**
(`fa`/`ro`), all under CC0. Scorecard enriches US tuition/outcomes. Official
QS/THE rankings are proprietary, so we derive a CC0 `researchScore` from
OpenAlex works/citations instead.

## Architecture: swappable data layer
The UI only talks to `repo` (`lib/data/index.ts`), an implementation of
`DataRepository`. Today it resolves to the in-memory **mock** repository; set
`NEXT_PUBLIC_DATA_SOURCE=supabase` to switch to Supabase — **no UI changes**.

- `lib/data/types.ts` — canonical models
- `lib/data/repository.ts` — the interface
- `lib/data/mock/` — current implementation (reads `data/universities.json`)
- `lib/data/supabase/` — skeleton + `// TODO(supabase)` markers
- `supabase/migrations/0001_init.sql` — schema + RLS + verified-badge function

## Verified badge
A reviewer/answerer is **Verified** when their email domain matches a
university's registered domain (`lib/data/verify.ts`; SQL mirror in the
migration). In mock mode auth is simulated (`lib/auth/AuthContext.tsx`) and
writes are in-memory (reset on reload).

## Enabling Supabase later
1. `npm install @supabase/supabase-js`
2. Create a Supabase project; run `supabase/migrations/0001_init.sql`.
3. Seed `universities` from `data/universities.json`.
4. Implement `lib/data/supabase/index.ts` and `lib/supabase.ts`.
5. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `NEXT_PUBLIC_DATA_SOURCE=supabase`.

## Deploy
Deploy to Vercel; set the env vars from `.env.example`.
```
