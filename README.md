# Fieldkit — Equipment Rental Platform

Fieldkit is a frontend for a local equipment-rental marketplace. The first
milestones establish the public homepage and searchable equipment catalog,
setting up the visual foundation for the customer, owner, and admin experiences
described in the assignment.

## Completed milestones — 30%

Implemented:

- **10% — Marketplace foundation:** Responsive homepage, navigation, and footer
- Hero, equipment categories, six sample featured listings, benefits, “how it
  works,” and four sample customer stories
- Framer Motion reveal and stagger animations
- **20% — Equipment catalog:** `/equipment` route with responsive listing cards,
  name/location search, category, rental period, price, and availability filters,
  and price/recently-added sorting
- **30% — Equipment details:** Static detail pages for sample listings, owner
  and rental information, and a booking-estimate modal with date, quantity,
  contact, address, and notes fields
- Shared header, footer, listing data, and responsive design system

Listings, metrics, availability, ratings, and customer stories are illustrative
preview content. The catalog filters run in the browser over sample data and
are not connected to a backend. The booking modal only previews an estimated
total; it does not create a booking or process a payment. Authentication,
backend integration, favorites, real bookings, payments, and dashboards are
planned for later milestones.

## Getting started

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Scripts

- `npm run dev` — start the development server
- `npm run build` — create a production build
- `npm start` — serve the production build
- `npm run lint` — run ESLint

## Stack and packages

- Next.js App Router, React, and TypeScript
- Tailwind CSS 4 for the stylesheet pipeline
- Framer Motion for homepage section animations
- ESLint for linting

## Deployment

Live site: Not deployed yet.
