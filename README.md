# MiningGear — Phase 1 MVP

A runnable B2B marketplace for used Bitcoin mining hardware, power gear, and sites.
Next.js 14 (App Router) · TypeScript · Prisma · Auth.js · Tailwind. Ships with SQLite for zero-config local dev.

## Quick start

```bash
npm install          # also runs `prisma generate`
npm run setup        # creates the SQLite db + seeds users, listings, a review queue
npm run dev          # http://localhost:3000
```

`npm run setup` = `prisma generate && prisma db push && tsx prisma/seed.ts`.
Wipe and reseed any time with `npm run db:reset`.

> If a previous attempt left a partial `node_modules/`, delete it first, then `npm install`.

## Demo logins

| Role   | Email                   | Password   |
|--------|-------------------------|------------|
| Seller | `ops@westpower.mining`  | `demo1234`  |
| Admin  | `admin@mininggear.io`   | `admin1234` |

Other seeded sellers (`sales@apexrecyclers.io`, `desk@northgrid.supply`, `info@gridsalvage.co`) also use `demo1234`. Or register a fresh seller at `/register`.

## What works

- **Auth.js** — real email + password login (bcrypt), self-serve registration, sign out, and role-based access (`seller` / `admin`). Google OAuth turns on automatically when `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` are set; the button hides itself otherwise. Sessions are JWT; OAuth accounts persist via the Prisma adapter.
- **Browse / search / filters** — category, condition, location, price, shippable, sort — all from the DB, driven by URL params. Only `active` (approved) listings show publicly.
- **Listing detail** — spec table, image gallery, seller verification, save, and **Start a deal request** (the matchmaking core).
- **Sell** (`/sell`, auth required) — category-aware spec form. New listings are created with status `pending`.
  - **Image upload** — multiple photos saved via a storage abstraction (local disk in dev), shown on cards and the detail gallery.
  - **Document auto-fill** — upload a **PDF, Excel/CSV, or Word** datasheet/quote; the server parses it (`pdf-parse`, `xlsx`, `mammoth`), detects the category, and fills the title, brand, specs, and description. Everything stays editable before you submit.
- **Admin review queue** (`/admin`, admin only) — approve or reject pending submissions; approvals go live in Browse instantly.
- **Dashboard** — my listings (with review status), deal requests, saved items.
- **Email notifications** — when a buyer submits a deal request, the seller gets an alert email and the buyer gets a confirmation. Uses Resend in production (`RESEND_API_KEY`); with no key set, emails are printed to the server console so you can see them in dev. Sending never blocks the request flow.

## Configuration (`.env`)

```
DATABASE_URL="file:./dev.db"        # SQLite for dev (Postgres URL in prod)
AUTH_SECRET="…"                      # required (npx auth secret)
AUTH_GOOGLE_ID="" AUTH_GOOGLE_SECRET=""   # optional Google OAuth
STORAGE_DRIVER="local"              # "local" (public/uploads) or "r2"
RESEND_API_KEY=""                    # blank = emails printed to console (dev)
MAIL_FROM="MiningGear <onboarding@resend.dev>"
APP_URL="http://localhost:3000"      # used for links in emails
```

## Project layout

```
prisma/
  schema.prisma     # Auth.js models + Listing, ListingSpec, ListingImage, MatchRequest, Favorite
  seed.ts           # users (hashed pw), 16 live listings, 2 pending, demo deal requests
src/
  auth.ts           # NextAuth config (Credentials + Google, JWT, Prisma adapter)
  app/
    actions.ts        # createListing, createDealRequest, toggleFavorite, approve/rejectListing, extractDocument
    auth-actions.ts   # login, logout, register
    api/auth/[...nextauth]/route.ts
    login/ register/ admin/ sell/ browse/ dashboard/ listing/[id]/  page.tsx + home page.tsx
  lib/
    db.ts             # Prisma client singleton
    catalog.ts        # categories, conditions, per-category spec fields (shared)
    session.ts        # getSessionUser / requireUser / requireAdmin
    storage.ts        # saveUpload() — local disk now, R2/S3 swap-in
    extract.ts        # PDF/Excel/Word -> {category, title, brand, specs, description}
    mail.ts           # sendMail() — Resend in prod, console in dev
    emails.ts         # branded deal-request email templates
  components/         # Header, ListingCard, Filters, SortSelect, DealRequestModal, SellForm
prisma/
  schema.prisma       # dev (SQLite)
  schema.prod.prisma  # prod (Postgres) — keep models in sync
  migrations/         # Postgres migration history (prisma migrate deploy)
vercel.json           # build runs prisma migrate deploy + next build
docker-compose.yml    # optional local Postgres for testing the prod path
```

## How document extraction works

`src/lib/extract.ts` reads the file (SheetJS for spreadsheets, mammoth for `.docx`, pdf-parse for `.pdf`),
builds key/value pairs from `Key: Value` lines and 2-column spreadsheet rows, scores keywords to detect the
category, then fills each of that category's spec fields by matching pair keys or regex fallbacks
(hashrate, J/TH, kVA, kV, amps, MW, $/kWh, AWG/MCM, …). It is intentionally best-effort and heuristic —
the form is pre-filled but always editable.

## Production: Postgres + Vercel

Local dev stays on SQLite (`schema.prisma`). Production runs on Postgres via a parallel
`schema.prod.prisma` (identical models, Postgres datasource) plus a committed migration in
`prisma/migrations/`. Nothing in the app code changes between the two — only the datasource.

### Deploy to Vercel

1. Create a Postgres database (Neon or Supabase) and copy its pooled + direct connection strings.
2. Import the repo into Vercel. In **Settings → Environment Variables** set:
   - `DATABASE_URL` (pooled), `DIRECT_URL` (direct)
   - `AUTH_SECRET` (`npx auth secret`), optional `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`
   - `RESEND_API_KEY`, `MAIL_FROM`, `APP_URL` (your deployed URL)
   - `STORAGE_DRIVER=r2` (+ R2 keys) once you implement `saveR2()`
3. `vercel.json` already points the build at `npm run vercel-build`, which runs
   `prisma generate` + `prisma migrate deploy` (against `schema.prod.prisma`) + `next build`.
   Migrations apply automatically on every deploy.
4. Seed once (optional): run `npm run prod:seed` locally with the production `DATABASE_URL`.

### Test the Postgres path locally

```bash
docker compose up -d                       # starts Postgres on :5432
export DATABASE_URL="postgresql://mininggear:mininggear@localhost:5432/mininggear"
export DIRECT_URL="$DATABASE_URL"
npm run prod:deploy && npm run prod:seed    # apply migration + seed
npm run dev
```

> Note: the generated Prisma client is provider-specific. Locally you normally use the SQLite
> client; running `prod:generate`/`prod:deploy` regenerates it for Postgres. Switch back with
> `npm run setup`. On Vercel this is handled automatically by `vercel-build`.

### Cloud file storage

Set `STORAGE_DRIVER=r2` and implement `saveR2()` in `src/lib/storage.ts` — the rest of the app
only calls `saveUpload()`, so no other code changes.

## Phase 2 (next)

KYB business verification, Stripe Connect escrow on top of the deal-request workflow,
email notifications (Resend), inspection reports, and reviews — the data model and
deal-request state machine are already in place to build on.
