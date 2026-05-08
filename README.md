# Pantry

A pantry tracker for the household — every jar, every bottle, every bag, kept in its room. Auth-gated, multi-user, with room-level sharing.

## Features

### Inventory
- **Rooms** — organize items by room (pantry, fridge, freezer, etc.). Drag-and-drop reorder, custom glyphs, grid / list / shelf view per room.
- **Items** — count, unit, expiry date, tags, photo, status (in-stock / low / out / expiring / expired). Mark-opened, debounced quantity stepper, edit / move / delete.
- **Add-item form** with live preview, photo upload, tag input.
- **Dashboard** — morning glance with low-stock list, expiring strip, recent activity, room glance, and an attention banner.

### Search & shopping
- **Full-text search** across all items with multi-room and status facets.
- **Shopping list** in receipt style, grouped by aisle. Add items from any item's stepper, mark trip complete, export as text, browser print.

### Sharing (multi-user)
- Rooms are owned by a user. Owners invite collaborators by email at **viewer** or **editor** role.
- Shared rooms appear in the invitee's sidebar with a `◇` glyph.
- Editors can mutate items; viewers are read-only. Manage from the per-room Members panel or `/settings → Sharing`.

### Activity log
- Every count change, restock, open, etc. is recorded as an event with the actor's user id.
- Dedicated `/activity` page shows the full log.

### Auth & accounts
- Email + password sign-in (NextAuth, scrypt hashing, JWT sessions).
- Sign-up flow, profile + password change in `/settings`.
- Session middleware gates every page.

### UX polish
- Command palette (⌘K / Ctrl+K) with platform-aware key hints.
- Toast notifications, confirm dialogs for destructive actions.
- Mobile drawer sidebar, custom Select / Checkbox / Modal components.
- Custom 404.

## Stack

- **Next.js 15** (App Router, Turbopack dev) + **React 19** + **TypeScript**
- **Tailwind CSS v4** with theme tokens via `@theme`
- **NextAuth v5** — Credentials provider, JWT sessions, scrypt password hashing
- **Drizzle ORM** + **libSQL/Turso** (also runs on local SQLite)
- **SWR** for client data fetching, **Zod** for validation, **react-hook-form** for forms
- **Vercel Blob** for item photo uploads
- **@dnd-kit** for drag-and-drop reorder
- **Vitest** integration tests (real SQLite, no mocks except `auth()`)

## Getting started

You'll need Node.js 20+ and npm.

```bash
git clone <this-repo>
cd pantry
npm install
cp .env.example .env       # set AUTH_SECRET to any 32+ char string
npm run db:push            # creates local.db with the schema
npm run db:seed            # 7 rooms, ~35 items, demo user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with **alex@pantry.local / password123**, or create your own account at `/welcome`.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `AUTH_SECRET` | yes | Any 32+ character string. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL` | no | Defaults to `file:local.db`. Set to a `libsql://...` URL for Turso. |
| `DATABASE_AUTH_TOKEN` | no | Required when `DATABASE_URL` points to Turso. |
| `BLOB_READ_WRITE_TOKEN` | no | Only needed if you use the photo upload feature in production. |

## Scripts

| | |
|---|---|
| `dev` | Start dev server (Turbopack) |
| `build` / `start` | Production build / serve |
| `test` / `test:watch` | Vitest integration suite |
| `lint` / `lint:fix` | ESLint |
| `format` / `format:check` | Prettier (sorts Tailwind classes) |
| `db:push` | Push Drizzle schema to the DB |
| `db:seed` | Seed demo user, rooms, items (idempotent on user) |
| `db:reset` | Wipe local SQLite, push schema, re-seed |
| `db:studio` | Open Drizzle Studio |

## Project structure

```
app/                            routes (App Router) + api/
  layout.tsx                    fonts + SessionProvider + ToastProvider
  page.tsx                      redirect → /dashboard or /welcome
  globals.css                   @theme tokens + base resets
  welcome/  signin/  signup/    auth pages
  dashboard/                    morning glance
  rooms/                        grid + per-room detail + members panel
  items/                        detail + new-item form
  search/  shopping/  activity/ feature pages
  settings/                     profile + password + sharing
  api/                          REST handlers

components/                     app shell, sidebar, topbar, command palette,
                                modals, toasts, forms, photo upload, stepper

icons/                          one per file, named XxxIcon

lib/                            cn, cva variants, access checks, format,
                                password (scrypt), drizzle queries

db/
  schema.ts                     users, rooms, room_members, items,
                                shopping_items, item_events
  index.ts                      drizzle client

scripts/                        seed, reset-db, check-db
tests/                          vitest integration tests
auth.ts / auth.config.ts        NextAuth setup
middleware.ts                   gates every page
```

## Testing

```bash
npm test              # run the integration suite once
npm run test:watch    # watch mode
```

Tests use a real SQLite database (no mocks except `auth()`).

## License

[MIT](LICENSE)
