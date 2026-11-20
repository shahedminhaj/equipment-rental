# Fieldkit — Equipment Rental Platform

Fieldkit is a frontend for a local equipment-rental marketplace. The first
milestones establish the public homepage and searchable equipment catalog,
setting up the visual foundation for the customer, owner, and admin experiences
described in the assignment.

## Completed milestones — 70%

Implemented:

- **10% — Marketplace foundation:** Responsive homepage, navigation, and footer
- Hero, equipment categories, six sample featured listings, benefits, “how it
  works,” and four sample customer stories
- Framer Motion reveal and stagger animations
- **20% — Equipment catalog:** `/equipment` route with responsive listing cards,
  name/location search, category, rental period, price, and availability filters,
  and price/recently-added sorting
- **30% — Live equipment details:** Catalog and detail pages read listings from
  the backend API, with owner and rental information
- **40% — Real bookings and payments:** Customer sign-in at checkout, backend
  reservation validation, Stripe Checkout, and webhook-confirmed payment status
- **50% — Customer and management dashboards:** Account registration/sign-in,
  profile editing, booking history and receipts, owner listing/booking
  management, and admin listing review and user-role controls
- **60% — Admin analytics:** Live marketplace totals and 12-month booking and
  paid-revenue charts in the admin dashboard
- **70% — Admin bootstrap and role-aware experience:** One-time Admin setup
  using backend environment credentials, separate role dashboards, visible
  signed-in role/navigation, and shadcn/ui primitives for the account flows
- Shared header, footer, listing data, and responsive design system

Homepage stories and metrics remain illustrative preview content. Live catalog
results and account data require the backend and MongoDB to be running.

## Getting started

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.
The backend API should be running at `http://localhost:5000`. Configure
`.env.local` in the frontend root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` is optional and is only needed for Google
sign-in; use the same client ID in the backend `.env`. Keep database, JWT,
admin, and Stripe secrets in the backend `.env`.

The header's **Sign up** link is for customer accounts. **Get started** offers
customer and admin entry points. To create the first Admin, open `/dashboard`
and use **Set up the first admin** while setup is available. Enter the exact
`ADMIN_EMAIL` and `ADMIN_PASSWORD` configured in the backend `.env`; setup is
closed after the single Admin account is created. Admins can then sign in at
`/dashboard`. Public sign-up and Google sign-in create customer accounts only.
Authentication routes users to `/account` and administrators to `/dashboard`
based on their backend role.

The backend uses `MONGODB_DB` to select the application database. Set it to
`fieldkit` (as in the backend `.env.example`) to keep Fieldkit data separate from
other projects on the same MongoDB cluster.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm start` — serve the production build
- `npm run lint` — run ESLint

## Stack and packages

- Next.js App Router, React, and TypeScript
- Tailwind CSS 4 and shadcn/ui (Base UI primitives) for the UI
- Framer Motion for homepage section animations
- ESLint for linting

## Deployment

Live site: Not deployed yet.
