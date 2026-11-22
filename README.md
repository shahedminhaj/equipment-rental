# Fieldkit — Equipment Rental Platform

Fieldkit is a responsive Next.js App Router frontend for a local equipment
rental marketplace. It connects to the Fieldkit Express/MongoDB API for live
catalog data, accounts, favorites, bookings, Stripe Checkout, and role-based
dashboards.

## Features

- **Marketplace:** responsive home page with live featured approved equipment,
  live categories, completed-rental customer reviews, Framer Motion animations,
  and a shared shadcn-style design system. Catalog, category, review, rating,
  and savings figures are never replaced with demo records when the API is down.
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

Requirements: Node.js 20+, MongoDB, and a Stripe account for live payments.

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
NEXT_PUBLIC_IMGBB_API_KEY=your-imgbb-api-key
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is optional and only enables Google sign-in. Use
the same client ID in the backend `.env`. Keep database, JWT, admin, and Stripe
secrets in the backend `.env`; never expose them in a `NEXT_PUBLIC_` variable.

### Backend setup

The Express/MongoDB API is in `server/`. Copy `server/.env.example` to
`server/.env`, add a unique random `JWT_SECRET` (at least 32 characters), and set
the MongoDB URI, frontend origin, and administrator credentials. The server creates
the configured administrator account at startup. The file is ignored by Git.

In a second terminal, install and run the API from its own folder:

```bash
cd server
npm ci
npm run dev
```

The API listens on port 5000 by default. Its role middleware protects owner, customer,
and admin routes; public signup and Google sign-in always create customer
accounts. Admins can promote users to owners from the admin dashboard.

### Booking and Stripe payment

The booking dialog posts the rental details to `POST /api/bookings` with the
customer's JWT. The backend checks date and quantity availability, creates the
reservation and Stripe Checkout session, then returns `checkoutUrl`; the browser redirects to
`checkout.stripe.com`. `STRIPE_SECRET_KEY`, `STRIPE_CURRENCY`, and
`STRIPE_WEBHOOK_SECRET` belong only in `server/.env`, so the frontend does not
need a Stripe SDK or publishable key. Configure the Stripe webhook at
`/api/payments/webhook` for Checkout completion, expiration, and payment failure.
The webhook records the transaction and updates the booking payment status.
Stripe returns the customer to
`/payment/success` or `/payment/cancel`, which verify or release the temporary
booking through the API.

The API includes customer favorites and reviews, owner inventory and rental
management, admin user/listing/rental management, and MongoDB-backed admin and
owner analytics. A daily `node-cron` task completes ended confirmed rentals.
If SMTP settings are configured, it emails the renter and owner after completion.
The dashboard notification menu is intentionally static and shows platform
guidance rather than account-specific events.

Google sign-in also requires the page origin to be registered on **that exact
OAuth client** in Google Cloud Console → APIs & Services → Credentials → OAuth
2.0 Client IDs → **Authorized JavaScript origins**:

```
http://localhost:3000
http://localhost:3001
```

Add both if you switch between `next start` and `next dev`. `localhost` and
`127.0.0.1` are different origins, and a missing entry produces
`Error 400: origin_mismatch`. Authorized redirect URIs are not needed for the
Google Identity Services button.

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
| `/login`, `/signup` | Sign in and create account (User/Admin options) |
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
- `npm run dev:server` — start the Express API in watch mode
- `npm run start:server` — start the Express API
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
- Express, MongoDB Node driver, Stripe, bcryptjs, jsonwebtoken, and Google Auth
  Library for the API and authentication
- Helmet, CORS, and express-rate-limit for API protections
- node-cron and Nodemailer for rental completion and optional email notices

## Deployment

Live site: add your deployed frontend URL here before submission.

For deployment, set `NEXT_PUBLIC_API_URL` to the public backend `/api` origin and
configure the same Google client ID, imgbb key, and Stripe/backend settings used
by the API.

### Landing page data contract

The landing page reads `GET /reviews/featured`, which returns
`{ "items": [{ "id": "...", "name": "...", "role": "...", "quote": "...", "rating": 5 }] }`.
Reviews are submitted from completed rentals and only contain genuine customer
feedback. If no reviews exist, the page shows an empty state instead of sample
testimonials. The API enforces one review per completed booking.
