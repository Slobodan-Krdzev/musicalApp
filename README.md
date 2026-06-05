# GigMatch – Musicians & Venues Platform

Production-ready web app connecting **Musicians / Artists / Bands** with **Venues** to arrange live events and gigs.

## Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT (Access + Refresh tokens)
- **Payments:** Stripe (Subscriptions + Free Trial)
- **File uploads:** Cloud-ready abstraction (local mock)
- **Email:** Abstracted service (mock)

## Quick start

### Prerequisites

- Node.js 18+
- MongoDB running locally (e.g. `mongod`)

### 1. Install dependencies

```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env (set JWT secrets, optional Stripe keys)
```

Frontend uses Next.js rewrites to proxy `/api/*` to the backend; no `.env.local` needed for local dev unless you run frontend and backend on different hosts.

### 3. Seed database (optional)

```bash
cd backend && npm run seed
```

Demo superadmin (password: `password123` unless `SEED_ADMIN_PASSWORD` is set in `.env`):

- **SuperAdmin:** connectiongig@gmail.com  

### 4. Run

**Terminal 1 – API**

```bash
cd backend && npm run dev
```

**Terminal 2 – Frontend**

```bash
cd frontend && npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:4000  

From the repo root you can also use:

```bash
npm run dev
```

(runs backend and frontend concurrently if `concurrently` is installed)

## Architecture

### Backend

- **Controllers** – HTTP handlers  
- **Services** – Business logic (auth, Stripe, notifications, event matching, email/upload mocks)  
- **Models** – Mongoose schemas (User, MusicianProfile, VenueProfile, Event, Advert, Application, Deal, Notification, Subscription)  
- **Middleware** – Auth (JWT), role checks, subscription gate, validation (Zod), error handler, rate limit on auth  
- **Routes** – `/api/auth`, `/api/users`, `/api/events`, `/api/adverts`, `/api/applications`, `/api/notifications`, `/api/stripe`, `/api/admin`  

### Frontend

- **App Router** – Landing, auth (login/register), dashboard, events list/detail, profile, musicians list, admin  
- **Features** – Auth (useAuth, useLogin, useRegister), protected routes (dashboard, admin)  
- **API** – `lib/api.ts` with token attachment; Next rewrites send `/api/*` to backend  
- **UI** – Reusable components (Button, Card, Input, Badge, Modal, FilterPanel), dark theme  

### Roles

- **MUSICIAN** – Profile, adverts, apply to events, notifications  
- **VENUE** – Profile, create events, view applications, accept/reject, browse musicians  
- **SUPERADMIN** – Stats, users (suspend), events/applications/deals/subscriptions (list, cancel subscription)  

### Subscription

- **Free Trial** – 14 days, limited access (stored in DB; no Stripe).  
- **Pro / Premium** – Stripe Checkout; webhook updates subscription status.  
- Middleware and controllers block create/apply when subscription is inactive.  

## Main pages

1. **Landing** – Hero, how it works, features, plans, CTA  
2. **Login / Register** – Email, password, role (on signup), JWT redirect to dashboard  
3. **Dashboard** – Role-based: subscription status, notifications, my events/adverts, applications, browse musicians (venue)  
4. **Events** – Public list with filters (genre, date), pagination, event detail and apply (musician)  
5. **Profile** – `/profile/[id]` – Public musician or venue profile  
6. **Musicians** – List for venues to browse  
7. **Admin** – SuperAdmin only: stats, users (suspend/unsuspend), subscriptions (cancel), tables for events/applications/deals  

## Security

- Passwords hashed with bcrypt  
- JWT access (short-lived) + refresh (long-lived)  
- Role-based and subscription middleware  
- Stripe webhook signature verification  
- Input validation (Zod), rate limiting on auth routes  

## Scaling notes

- MongoDB: indexes on roles, email, subscription status, event date/genre  
- Connection pooling (default in Mongoose)  
- Stateless API; horizontal scaling by running more Node processes (e.g. PM2)  
- Replace email/upload mocks with SendGrid/SES and S3/GCS when going to production  

## License

Private / MIT as per your choice.
