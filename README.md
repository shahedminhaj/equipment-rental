# Fieldkit — Equipment Rental Platform

Fieldkit is a responsive Next.js App Router frontend for a local equipment
rental marketplace. It connects to the Fieldkit Express/MongoDB API for live
catalog data, accounts, favorites, bookings, Stripe Checkout, and role-based
dashboards.

## Features

- **Marketplace:** responsive home page with live featured approved equipment,
  live categories, customer stories, Framer Motion animations, and a shared
  shadcn-style design system.
- **Catalog:** `/equipment` with server-side search, category and rental-type
  filters, price/availability filters, sorting, and pagination through
  `GET /api/equipment`.
- **Listing details:** `/equipment/:id` with live owner data, database-backed
  favorites, and a booking modal that creates a Stripe Checkout session.
- **Customer account:** `/account` plus `/account/rentals`,
  `/account/favorites`, `/account/profile`, and `/customer/dashboard` for
  bookings, saved equipment, and profile edits.
- **Owner dashboard:** `/owner/dashboard` (also `/dashboard/owner`) for listing
  creation/editing/deletion, paid booking decisions, and live earnings analytics
  from `GET /api/analytics/owner`.
- **Admin dashboard:** `/admin/dashboard` (also `/dashboard/admin`) for listing
  approval, user role/status management, platform metrics, and 12-month
  booking/revenue charts.
- **Feedback and states:** toast notifications across auth, booking, and
  management actions, plus branded loading, error, and not-found pages.
- **Auth:** localStorage JWT sessions with backend-verified roles, role-aware
  navigation, Google Identity Services sign-in, and protected API requests.

## Getting started

Requirements: Node.js 20+ and the companion backend running with MongoDB.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API base URL defaults
to `http://localhost:5000/api`. To use another port, add `.env.local` in the
frontend root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is optional and only enables Google sign-in. Use
the same client ID in the backend `.env`. Keep database, JWT, admin, and Stripe
secrets in the backend `.env`; never expose them in a `NEXT_PUBLIC_` variable.

### Admin login

The backend creates or promotes the account configured by `ADMIN_EMAIL` and
`ADMIN_PASSWORD` at startup and syncs its password hash. Sign in with those
exact credentials at `/login` or `/dashboard`; no one-time setup click is
needed. If the password contains `#`, quote it in the backend `.env`, for
example `ADMIN_PASSWORD="your#password"`, then restart the API. Public sign-up
and Google sign-in create customer accounts only.

Administrators can promote a customer to an owner from the user table in
`/admin/dashboard`. Owners can then publish listings, which stay hidden from
renters until approved by an admin. The backend seeds a demo owner and twelve
approved listings when the equipment collection is empty.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Home, live featured equipment, categories, and community |
| `/equipment` | Searchable and filterable catalog |
| `/equipment/:id` | Listing details, favorites, and booking |
| `/login`, `/signup`, `/get-started` | Auth entry points |
| `/account` | Customer dashboard |
| `/account/rentals` | Rental history |
| `/account/favorites` | Saved equipment |
| `/account/profile` | Profile editing |
| `/customer/dashboard` | Customer dashboard alias |
| `/dashboard` | Role-aware management entry point |
| `/owner/dashboard`, `/dashboard/owner` | Owner dashboard |
| `/admin/dashboard`, `/dashboard/admin` | Admin dashboard |
| `/payment/success`, `/payment/cancel` | Stripe return pages |

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm start` — serve the production build
- `npm run lint` — run ESLint
- `npm run typecheck` — run TypeScript without dev-only generated route types

## Stack and packages

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4, `tw-animate-css`, and shadcn/ui Base UI primitives
- Framer Motion for section animations
- Lucide React icons and `class-variance-authority` for variant styling
- ESLint for linting

## Deployment

Live site: not deployed yet. For deployment, set `NEXT_PUBLIC_API_URL` to the
public backend `/api` origin and configure the same Google client ID and Stripe
keys used by the backend.
