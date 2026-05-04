# BookEasy — Appointment Booking System

A full-stack appointment scheduling application built with **Next.js 15**, **TypeScript**, **Prisma**, and **PostgreSQL**. Admins create and manage time slots; users browse and book them. Features real-time availability, double-booking prevention, and automatic email confirmations.

## Live Demo

> **Admin account:** `admin@demo.com` / `admin123`  
> **User account:** `user@demo.com` / `user123`

---

## Features

**For Admins**
- Create single time slots or bulk-generate a full week in one click
- View all bookings in a dedicated table with user details and timestamps
- Cancel bookings and delete slots
- Live stats: total slots, confirmed bookings, available slots, today's count

**For Users**
- Browse available slots grouped by date with a date filter
- Book any slot with optional notes in one click
- Receive automatic email confirmation (Nodemailer)
- Cancel bookings from "My Bookings" tab

**Security & Reliability**
- Passwords hashed with bcrypt (cost factor 12)
- JWT auth stored in `httpOnly`, `secure`, `sameSite=lax` cookies
- Role-based access enforced in Next.js Middleware (Edge Runtime) and on every API route
- Double-booking prevented at app level AND database level (`@unique` on `Booking.slotId`)
- Public registration creates `USER` accounts only — admins cannot be self-promoted

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 |
| ORM | Prisma 5 |
| Database | PostgreSQL (Neon / Railway / Supabase) |
| Auth | jose (JWT) + bcryptjs |
| Email | Nodemailer v8 |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database — free tier options: [Neon](https://neon.tech), [Railway](https://railway.app), [Supabase](https://supabase.com)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/booking-system.git
cd booking-system
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
- Set `DATABASE_URL` to your PostgreSQL connection string
- Generate a strong `JWT_SECRET`:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- (Optional) Add email credentials for confirmation emails

### 3. Set up the database

```bash
npx prisma db push      # Creates tables from schema
npm run db:seed         # Seeds demo admin + user + 35 sample slots
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment (Vercel)

1. Push the repo to GitHub
2. Import on [Vercel](https://vercel.com) — it auto-detects Next.js
3. Add environment variables in the Vercel dashboard (same keys as `.env`)
4. Deploy — Vercel runs `next build` automatically

After first deploy, run the seed against your production DB:
```bash
DATABASE_URL="your-prod-url" npm run db:seed
```

---

## Project Structure

```
booking-system/
├── app/
│   ├── page.tsx              # Landing page
│   ├── not-found.tsx         # 404 page
│   ├── layout.tsx
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── admin/page.tsx        # Admin dashboard (slots + bookings)
│   ├── dashboard/page.tsx    # User dashboard (browse + my bookings)
│   └── api/
│       ├── auth/             # login, register, logout, me
│       ├── slots/            # GET list, POST create, DELETE [id]
│       └── bookings/         # GET mine, POST create, DELETE [id]
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── auth.ts               # JWT helpers (jose — Edge Runtime compatible)
│   ├── email.ts              # Nodemailer helpers (lazy init)
│   └── prisma.ts             # Prisma client singleton
├── middleware.ts              # Route protection (Edge Runtime)
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

---

## Database Schema

```
User     — id, name, email (unique), password (bcrypt), role, createdAt
Slot     — id, date, startTime, endTime, title, adminId → User, createdAt
Booking  — id, userId → User, slotId (unique) → Slot, notes, status, createdAt
```

The `@unique` on `Booking.slotId` is the hard database-level guarantee against double-booking, regardless of concurrent requests or race conditions.

---

## Available Scripts

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:push      # Push schema changes to the database
npm run db:generate  # Regenerate Prisma client types
npm run db:seed      # Seed demo accounts and sample slots
npm run db:studio    # Open Prisma Studio (visual database browser)
```
