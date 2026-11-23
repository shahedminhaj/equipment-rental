# Fieldkit — Equipment Rental Platform

A responsive equipment rental marketplace built with **Next.js, React, and TypeScript**. Users can browse equipment, make bookings, and manage rentals through customer, owner, and admin dashboards.

### Features
- Responsive homepage and equipment marketplace
- Equipment search, filters, sorting, and pagination
- User authentication with Email and Google
- Equipment details and favorites
- Booking and Stripe Checkout integration
- Customer dashboard and rental history
- Owner dashboard and listing management
- Admin dashboard and user management
- Reviews and notifications
- Analytics for owners and admins

### Tech Stack
- Next.js 16 & React 19
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Framer Motion
- Lucide React
- Express.js & MongoDB (Backend)
- Stripe & Google OAuth

### Getting Started

**Requirements:** Node.js 20+ and a running Fieldkit backend.

Install dependencies:

```bash
npm ci
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Backend Setup

The backend is maintained in a separate repository.

**Repository:** [Fieldkit Equipment Rental Backend](https://github.com/shahedminhaj/equipment-rental-backend)

Follow its README to configure MongoDB, JWT authentication, Google OAuth, and Stripe.

### Main Routes

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/equipment` | Equipment marketplace |
| `/equipment/:id` | Equipment details |
| `/login` | User login |
| `/signup` | User registration |
| `/account` | Customer dashboard |
| `/owner/dashboard` | Owner dashboard |
| `/admin/dashboard` | Admin dashboard |
| `/payment/success` | Successful payment |
| `/payment/cancel` | Cancelled payment |

### Available Scripts

```bash
npm run dev       # Development server
npm run build     # Production build
npm start         # Production server
npm run lint      # Run ESLint
npm run typecheck # TypeScript checking
```

### Deployment

Deploy the frontend to a Next.js-compatible hosting platform. Configure the required environment variables and set `NEXT_PUBLIC_API_URL` to the deployed backend API URL.

### Live Demo

**Live URL:** https://equipment-rental-self.vercel.app/