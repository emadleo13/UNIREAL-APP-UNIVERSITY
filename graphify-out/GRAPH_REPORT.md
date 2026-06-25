# Graph Report - .  (2026-06-24)

## Corpus Check
- Large corpus: 158 files · ~601,707 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 734 nodes · 1663 edges · 38 communities (28 shown, 10 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 51 edges (avg confidence: 0.82)
- Token cost: 128,000 input · 21,986 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Public Pages & Discovery Data|Public Pages & Discovery Data]]
- [[_COMMUNITY_Server Actions, Auth & Billing Infra|Server Actions, Auth & Billing Infra]]
- [[_COMMUNITY_Data Enrichment Pipeline Scripts|Data Enrichment Pipeline Scripts]]
- [[_COMMUNITY_UIUX Skill Internals (BM25 Search + Design System Gen)|UI/UX Skill Internals (BM25 Search + Design System Gen)]]
- [[_COMMUNITY_Data Repository & Types Layer|Data Repository & Types Layer]]
- [[_COMMUNITY_Chat Assistant (EMi) & Scoring|Chat Assistant (EMi) & Scoring]]
- [[_COMMUNITY_AI Enrichment Providers (ClaudeGemini)|AI Enrichment Providers (Claude/Gemini)]]
- [[_COMMUNITY_UI Primitives & ReviewLead Components|UI Primitives & Review/Lead Components]]
- [[_COMMUNITY_package.json Manifest|package.json Manifest]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_i18n Routing & Middleware|i18n Routing & Middleware]]
- [[_COMMUNITY_UIUX Pro Max Skill Rules|UI/UX Pro Max Skill Rules]]
- [[_COMMUNITY_Bottom Navigation UI|Bottom Navigation UI]]
- [[_COMMUNITY_README Architecture & Stack Overview|README: Architecture & Stack Overview]]
- [[_COMMUNITY_Favorites & Freemium Gating|Favorites & Freemium Gating]]
- [[_COMMUNITY_README Data Pipeline Steps|README: Data Pipeline Steps]]
- [[_COMMUNITY_University Compare Feature|University Compare Feature]]
- [[_COMMUNITY_Locale Layout & Service Worker|Locale Layout & Service Worker]]
- [[_COMMUNITY_DEPLOY Supabase Schema & Seed|DEPLOY: Supabase Schema & Seed]]
- [[_COMMUNITY_DEPLOY Going-Live Guide & Env Seams|DEPLOY: Going-Live Guide & Env Seams]]
- [[_COMMUNITY_DEPLOY Cron Jobs & Email Config|DEPLOY: Cron Jobs & Email Config]]
- [[_COMMUNITY_Brand Icon & Logo (Graduation Cap Motif)|Brand Icon & Logo (Graduation Cap Motif)]]
- [[_COMMUNITY_DEPLOY Stripe Billing Setup|DEPLOY: Stripe Billing Setup]]
- [[_COMMUNITY_Header & Theme Toggle|Header & Theme Toggle]]
- [[_COMMUNITY_Supabase Seed Script|Supabase Seed Script]]
- [[_COMMUNITY_Locale OpenGraph Image|Locale OpenGraph Image]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_CLI Search Script|CLI Search Script]]
- [[_COMMUNITY_UIUX Skill Persisted Design System|UI/UX Skill Persisted Design System]]
- [[_COMMUNITY_University Location Map|University Location Map]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Service Worker Precache List|Service Worker Precache List]]
- [[_COMMUNITY_Tailwind Config|Tailwind Config]]
- [[_COMMUNITY_Vercel Crons Config|Vercel Crons Config]]
- [[_COMMUNITY_Hero Image (Oxford Radcliffe Camera)|Hero Image (Oxford Radcliffe Camera)]]
- [[_COMMUNITY_Yandex Site Verification|Yandex Site Verification]]

## God Nodes (most connected - your core abstractions)
1. `localeAlternates()` - 27 edges
2. `University` - 26 edges
3. `Card()` - 22 edges
4. `countryName()` - 20 edges
5. `createSupabaseAdminClient()` - 20 edges
6. `createSupabaseServerClient()` - 18 edges
7. `isSupabaseConfigured()` - 17 edges
8. `useAuth()` - 16 edges
9. `universityName()` - 16 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Public Icon (Graduation Cap Favicon)` --semantically_similar_to--> `App Favicon Icon (icon.svg)`  [INFERRED] [semantically similar]
  public/icon.svg → app/icon.svg
- `UNIREAL Logo (Graduation Cap + Globe Wordmark)` --semantically_similar_to--> `App Favicon Icon (icon.svg)`  [INFERRED] [semantically similar]
  public/logo-unireal.png → app/icon.svg
- `next-intl (i18n routing)` --semantically_similar_to--> `Layout & Responsive rule category (HIGH)`  [INFERRED] [semantically similar]
  README.md → .claude/skills/ui-ux-pro-max/SKILL.md
- `Vercel deploy` --semantically_similar_to--> `Vercel (hosting) + domain`  [INFERRED] [semantically similar]
  README.md → DEPLOY.md
- `generateMetadata()` --calls--> `localeAlternates()`  [INFERRED]
  app/[locale]/blog/[slug]/page.tsx → lib/seo.ts

## Import Cycles
- 1-file cycle: `middleware.ts -> middleware.ts`

## Hyperedges (group relationships)
- **Layered university data enrichment pipeline** — readme_data_hipolabs_step, readme_data_enrich_step, readme_data_scorecard_step, readme_data_wikidata_step, readme_data_merge_step, readme_universities_json [EXTRACTED 1.00]
- **Swappable data layer architecture pattern** — readme_data_repository_interface, readme_repo_index_ts, readme_mock_repository, readme_supabase_data_skeleton, readme_data_types_ts [EXTRACTED 1.00]
- **Going-live deployment checklist (Supabase, Stripe, Resend, Vercel)** — deploy_supabase, deploy_stripe_subscriptions, deploy_resend_emails, deploy_vercel_hosting_domain, deploy_smoke_test_live [EXTRACTED 1.00]

## Communities (38 total, 10 thin omitted)

### Community 0 - "Public Pages & Discovery Data"
Cohesion: 0.06
Nodes (65): AffordableUniversitiesPage(), generateMetadata(), load(), generateMetadata(), load(), generateMetadata(), load(), generateMetadata() (+57 more)

### Community 1 - "Server Actions, Auth & Billing Infra"
Cohesion: 0.06
Nodes (57): ACTIVE_STATUSES, AdminData, AdminMember, getAdminData(), AdminPage(), ActionResult, createCheckoutSession(), createPortalSession() (+49 more)

### Community 2 - "Data Enrichment Pipeline Scripts"
Cohesion: 0.08
Nodes (52): todayISO(), hostFromUrl(), normalizeDomain(), slugify(), uniqueSlug(), University, emailDomain(), isVerifiedForUniversity() (+44 more)

### Community 3 - "UI/UX Skill Internals (BM25 Search + Design System Gen)"
Cohesion: 0.06
Nodes (40): BM25, detect_domain(), _load_csv(), Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts, Core search function using BM25 (+32 more)

### Community 4 - "Data Repository & Types Layer"
Cohesion: 0.08
Nodes (32): Calendar(), GREGORY, isoDate(), fetchAggregatedReviews(), DataRepository, UniversityMatch, AdmissionEvent, AdmissionInfo (+24 more)

### Community 5 - "Chat Assistant (EMi) & Scoring"
Cohesion: 0.08
Nodes (36): askAssistant(), answerFromFaq(), asLocale(), buildUniversityAnswer(), buildUniversitySuggestions(), ChatMessage, ChatRole, FALLBACK (+28 more)

### Community 6 - "AI Enrichment Providers (Claude/Gemini)"
Cohesion: 0.10
Nodes (34): getAnthropic(), isAIConfigured(), researchWithWebSearch(), refreshUniversityIfStale(), CATEGORIES, generateLatestPost(), GenItem, slugify() (+26 more)

### Community 7 - "UI Primitives & Review/Lead Components"
Cohesion: 0.09
Nodes (32): addAnswer(), addQuestion(), addReview(), fetchMySubscription(), useAuth(), AuthPage(), ManageBillingButton(), SubscribeButton() (+24 more)

### Community 8 - "package.json Manifest"
Cohesion: 0.05
Nodes (41): dependencies, @anthropic-ai/sdk, leaflet, next, next-intl, react, react-dom, react-leaflet (+33 more)

### Community 9 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 10 - "i18n Routing & Middleware"
Cohesion: 0.19
Nodes (8): { Link, redirect, usePathname, useRouter, getPathname }, Locale, locales, routing, rtlLocales, labels, LocaleSwitcher(), config

### Community 11 - "UI/UX Pro Max Skill Rules"
Cohesion: 0.14
Nodes (15): next-intl (i18n routing), Accessibility rule category (CRITICAL), Animation rule category (MEDIUM), Charts & Data rule category (LOW), --design-system flag, html-tailwind stack (default), Layout & Responsive rule category (HIGH), Performance rule category (HIGH) (+7 more)

### Community 12 - "Bottom Navigation UI"
Cohesion: 0.16
Nodes (5): BottomNav(), defaultNavItems, LimelightNav(), LimelightNavProps, NavItem

### Community 13 - "README: Architecture & Stack Overview"
Cohesion: 0.15
Nodes (14): lib/auth/AuthContext.tsx (mock auth), DataRepository interface, lib/data/types.ts (canonical models), lib/supabase.ts (to implement), lib/data/mock/ (mock repository implementation), Next.js 15 (App Router), React 19, lib/data/index.ts (repo entrypoint) (+6 more)

### Community 14 - "Favorites & Freemium Gating"
Cohesion: 0.22
Nodes (7): FavoriteGate, FavoritesContext, FavoritesProvider(), FavoritesState, useFavorites(), FavoriteButton(), FavoriteGateModal()

### Community 15 - "README: Data Pipeline Steps"
Cohesion: 0.21
Nodes (13): npm run data:build (quick build), npm run data:enrich (OpenAlex source), npm run data:hipolabs (Hipolabs source), npm run data:merge (dedupe/sort/validate), data/raw/ (cached API responses), npm run data:scorecard (College Scorecard source), npm run data:wikidata (Wikidata source), Why multiple data sources (+5 more)

### Community 16 - "University Compare Feature"
Cohesion: 0.24
Nodes (7): EMPTY, getSnapshot(), listeners, readRaw(), useCompare(), CompareBar(), CompareButton()

### Community 17 - "Locale Layout & Service Worker"
Cohesion: 0.31
Nodes (4): ServiceWorkerRegister(), dirForLocale(), Footer(), LocaleLayout()

### Community 18 - "DEPLOY: Supabase Schema & Seed"
Cohesion: 0.22
Nodes (9): supabase/migrations/0001_init.sql, supabase/migrations/0002_profiles_subscriptions.sql, ADMIN_EMAILS env var, admin_emails table, npm run data:seed, NEXT_PUBLIC_DATA_SOURCE env var, Supabase (database + auth), supabase/migrations/0001_init.sql (schema + RLS + verified-badge function) (+1 more)

### Community 19 - "DEPLOY: Going-Live Guide & Env Seams"
Cohesion: 0.28
Nodes (9): lib/data/ai-provider.ts (fresh-data provider seam), lib/chat/assistant.ts (chat assistant seam), Claude API integration (placeholder, not yet plugged in), .env.example, NEXT_PUBLIC_SITE_URL env var, UNIREAL Going Live guide, Vercel (hosting) + domain, .env.example (+1 more)

### Community 20 - "DEPLOY: Cron Jobs & Email Config"
Cohesion: 0.29
Nodes (8): /admin route, CRON_SECRET env var, EMAIL_FROM env var, /api/cron/expiring-subscriptions endpoint, RESEND_API_KEY env var, Resend (emails) + expiry cron, Smoke test (live), vercel.json

### Community 21 - "Brand Icon & Logo (Graduation Cap Motif)"
Cohesion: 0.33
Nodes (7): Blue Rounded Square Background (#1a4ff5, rx=14), App Favicon Icon (icon.svg), White Graduation Cap / Mortarboard Shape, Next.js app/icon.svg Convention, UNIREAL University App Branding (education theme), Public Icon (Graduation Cap Favicon), UNIREAL Logo (Graduation Cap + Globe Wordmark)

### Community 22 - "DEPLOY: Stripe Billing Setup"
Cohesion: 0.33
Nodes (7): Stripe CLI (stripe listen), Stripe Customer Portal, STRIPE_PRICE_ID env var, STRIPE_SECRET_KEY env var, Stripe (subscriptions), /api/stripe/webhook endpoint, STRIPE_WEBHOOK_SECRET env var

### Community 23 - "Header & Theme Toggle"
Cohesion: 0.47
Nodes (4): Header(), ThemeToggle(), getAdminEmails(), isAdminEmail()

### Community 24 - "Supabase Seed Script"
Cohesion: 0.33
Nodes (3): overlay, Row, supabase

### Community 28 - "UI/UX Skill Persisted Design System"
Cohesion: 1.00
Nodes (3): design-system/MASTER.md, design-system/pages/ overrides, --persist flag (Master + Overrides pattern)

## Knowledge Gaps
- **206 isolated node(s):** `ALL_COUNTRY_VALUES`, `ALL_COUNTRY_VALUES`, `size`, `size`, `SCORE_LABEL_KEY` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `University` connect `Data Enrichment Pipeline Scripts` to `Public Pages & Discovery Data`, `Server Actions, Auth & Billing Infra`, `Data Repository & Types Layer`, `Chat Assistant (EMi) & Scoring`, `AI Enrichment Providers (Claude/Gemini)`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `createSupabaseAdminClient()` connect `Server Actions, Auth & Billing Infra` to `AI Enrichment Providers (Claude/Gemini)`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `Card()` connect `Public Pages & Discovery Data` to `Server Actions, Auth & Billing Infra`, `Data Repository & Types Layer`, `Chat Assistant (EMi) & Scoring`, `UI Primitives & Review/Lead Components`, `Favorites & Freemium Gating`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `localeAlternates()` (e.g. with `generateMetadata()` and `generateMetadata()`) actually correct?**
  _`localeAlternates()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 7 inferred relationships involving `countryName()` (e.g. with `generateMetadata()` and `generateMetadata()`) actually correct?**
  _`countryName()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `BM25 ranking algorithm for text search`, `Lowercase, split, remove punctuation, filter short words`, `Build BM25 index from documents` to the rest of the system?**
  _233 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Public Pages & Discovery Data` be split into smaller, more focused modules?**
  _Cohesion score 0.060396039603960394 - nodes in this community are weakly interconnected._