# Rewire With Kajal

Full-stack therapy website and admin CRM platform built with React, Express, and PostgreSQL.

This repository includes:
- A public marketing website with appointment and intake flows
- A secured admin portal at `/admin`
- Backend APIs for leads, customers, blogs, scheduling, notes, payments, and analytics

## Website Features

### Public Website
- Hero landing page with animated sections and smooth reveal effects
- About page with therapy philosophy and methodology content
- Blog listing page with featured card layout, secondary grid, active-only filtering, and inline read-more expansion
- Appointment request form (`/appointment`) posting to lead intake
- Public intake questionnaire form (`/intake-form`) with personal details, date/time preference capture, two 18-question blocks, and automatic `total_score` calculation for admin review
- Shared site UI: sticky header, footer, preloader, animated background

### Admin Features
- OTP-based admin login
- JWT-protected API access for admin-only operations
- Dashboard overview with leads/customers/blog/turnover KPIs, charting, and booked-slot calendar view
- Lead pipeline to view and process new, accepted, and rejected leads
- Lead acceptance flow that auto-creates customer records
- Customer management with deduplicated listing, profile/history view, status toggles, pricing/session config, notes, and payment ledger
- Session scheduling with past-slot protection, cross-customer conflict detection, and `customer_sessions` synchronization
- Presence tracking (`present`, `absent`, `not_marked`) with lock behavior and next-session auto-scheduling (+7 days)
- Session-limit awareness that stops auto-scheduling when configured total sessions are reached
- Blog CMS for create/edit/delete, image upload, active-state control, and rich text editing

### Automated Email Workflows
- Admin OTP email (`/api/auth/send-otp`)
- Lead thank-you email after appointment request
- Acceptance email with intake-form link
- Intake submission confirmation email

## Backend Features

- Express API server with modular routes/controllers
- PostgreSQL integration (`pg` pool)
- Health endpoint with DB connectivity check: `GET /api/health`
- Static file serving for blog image uploads: `/uploads/*`
- Validation utilities for email format, 10-digit mobile numbers, date normalization (`DD-MM-YYYY` and `YYYY-MM-DD`), future/past date checks, and slot format (`HH:mm`)
- Session storage utilities that ensure `customer_sessions` table/indexes exist

## Tech Stack

### Frontend
- React 19 + TypeScript
- React Router
- Axios
- Recharts
- React Calendar
- Lucide React
- React Quill

### Backend
- Node.js + Express 5 + TypeScript
- PostgreSQL (`pg`)
- JWT auth (`jsonwebtoken`)
- OTP + transactional email (`nodemailer`)
- File upload (`multer`)

## Project Structure

```text
rewirewithkajal/
	backend/
		src/
			controllers/
			middleware/
			routes/
			utils/
			server.ts
			db.ts
		scripts/
		uploads/
	frontend/
		src/
			admin/
			components/
			pages/
			styles/
			App.tsx
	database/
		schema.sql
		migration_v2.sql
```

## API Overview

### Auth
- `POST /api/auth/send-otp` - send login OTP to the entered admin email (must exist in DB)
- `POST /api/auth/login` - verify OTP and return JWT token
- `POST /api/auth/register` - create admin account

### Blogs
- `GET /api/blogs/public` - public active blogs
- `GET /api/blogs` - admin blog list (requires token)
- `POST /api/blogs` - create blog (requires token)
- `PUT /api/blogs/:id` - update blog (requires token)
- `DELETE /api/blogs/:id` - delete blog (requires token)
- `POST /api/blogs/upload` - upload blog image (requires token)

### Leads
- `POST /api/leads` - create lead from appointment form
- `GET /api/leads` - list leads (requires token)
- `PUT /api/leads/:id/accept` - accept lead (requires token)
- `PUT /api/leads/:id/reject` - reject lead (requires token)
- `DELETE /api/leads/:id` - delete lead (requires token)

### Customers
- `POST /api/customers` - submit public intake form
- `GET /api/customers` - list deduplicated customers (requires token)
- `GET /api/customers/:id/forms` - get matched form submissions (requires token)
- `PUT /api/customers/:id/status` - update customer status (requires token)
- `PUT /api/customers/:id/appointment` - set/update appointment slot (requires token)
- `GET /api/customers/token/:token` - legacy token endpoint
- `POST /api/customers/token/:token` - deprecated endpoint

### Admin Extras
- `GET /api/admin/turnover` - turnover and chart data (requires token)
- `GET /api/admin/customers/:id/payments` - list payments (requires token)
- `POST /api/admin/customers/:id/payments` - add payment (requires token)
- `PUT /api/admin/customers/:id/settings` - update pricing/settings/status (requires token)
- `GET /api/admin/customers/:id/notes` - list notes (requires token)
- `POST /api/admin/customers/:id/notes` - add note (requires token)
- `GET /api/admin/customers/:id/sessions` - list session history (requires token)
- `PUT /api/admin/customers/:id/sessions/:sessionId/presence` - update presence (requires token)
- `GET /api/admin/historical-forms` - query forms by phone + DOB (requires token)
- `GET /api/admin/historical-forms/:formId` - get single historical form (requires token)

## Environment Variables

Create `backend/.env`:

```env
PORT=5000

# Preferred for Supabase hosted Postgres
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres

# Optional local fallback (used when DATABASE_URL is not set)
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rewire_kajal
DB_PASSWORD=postgres
DB_PORT=5432

JWT_SECRET=replace_with_strong_secret

EMAIL_USER=your_gmail_address
EMAIL_PASS=your_gmail_app_password
```

## Local Setup

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Create Database

Create a PostgreSQL database named `rewire_kajal`.

### 3. Apply Schema

From repository root:

```bash
psql -U postgres -d rewire_kajal -f database/schema.sql
```

Optional migration (adds `customer_sessions` and newer fields safely):

```bash
cd backend
npx ts-node scripts/run_migration.ts
```

### 4. Seed Demo Blogs (Optional)

```bash
cd backend
npx ts-node seed_blogs.ts
```

### 5. Start Backend

```bash
cd backend
npm run dev
```

Backend runs on `http://localhost:5000`.

### 6. Start Frontend

```bash
cd frontend
npm start
```

Frontend runs on `http://localhost:3000`.

## Single Deployment (Frontend + Backend Together)

This repository now supports a single combined deployment where the Express server also serves the React build in production.

Build command (project root):

```bash
npm run build
```

Start command (project root):

```bash
npm start
```

How it works:
- Frontend API calls use relative paths (e.g. `/api/...`) so they work on the same deployed domain.
- In production, backend serves `frontend/build` and routes non-API requests to React `index.html`.
- Supabase can be used by setting `DATABASE_URL` in environment variables.

## Admin Access Bootstrap

Admin OTP login uses the entered email and validates it against the `admins` table.

Create one or more admin accounts first:

```bash
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin1@example.com\"}"
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d "{\"email\":\"admin2@example.com\"}"
```

Then enter any registered admin email at `/admin/login` and OTP will be sent only to that email.

Then login at:
- `http://localhost:3000/admin/login`

After login, token is stored in browser `localStorage` as `adminToken`.

## Notes

- Frontend uses relative API URLs (`/api/...`).
- For local frontend development on port 3000, CRA proxy is configured to `http://localhost:5000`.
- Public blogs are filtered by `is_active = true`.
- Date validation supports both `DD-MM-YYYY` and `YYYY-MM-DD` input normalization.
- `customer_sessions` is auto-managed by backend utilities and migration script.

## Useful Script Files

Additional utility scripts are available under:
- `backend/scripts/`
- `backend/migrate_customers.ts`
- `backend/migrate_admin_schema.ts`
- `backend/fix_schema.ts`
- `backend/scripts/delete_all_data.ts` (and related cleanup helpers)

Use these carefully in development/staging environments.
