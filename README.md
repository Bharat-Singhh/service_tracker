# Domain Tracker

A self-hosted web app for tracking domain and SSL certificate expiry across ~300+ domains and subdomains, with automated email reminders.

It does **not** do WHOIS lookups or automatic SSL detection — you enter the dates yourself (or import them via CSV), and the app reminds you before they expire.

---

## Features

- Track unlimited domains/subdomains: platform, renewal date, domain expiry, SSL expiry, notes
- Automatic status badges: **Healthy** (green), **Expiring Soon** ≤30 days (orange), **Expired** (red) — calculated separately for domain and SSL expiry
- Email reminders at **7 days** and **1 day** before domain/SSL expiry (won't send duplicates)
- CSV import with preview, duplicate detection (skip or update), and CSV export
- Search, sort, filter, bulk delete/update on the domain table
- Activity log + email log for full audit trail
- Single-admin JWT login, minimalist black-and-white UI
- Runs anywhere via Docker Compose

---

## Tech Stack

| Layer    | Stack |
|----------|-------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS + TanStack Table |
| Backend  | FastAPI + SQLAlchemy + APScheduler + Pandas |
| Database | SQLite |
| Auth     | JWT + bcrypt |
| Deploy   | Docker Compose (Nginx serving frontend, Uvicorn serving backend) |

---

## Quick Start (Docker — recommended)

This is the easiest way to run the app permanently on a server (Synology NAS, VPS, home server, etc).

### 1. Configure the backend

```bash
cd domain-tracker/backend
cp .env.example .env
```

Edit `backend/.env`:

```env
SECRET_KEY=generate-a-long-random-string-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=choose-a-strong-password

# Outlook SMTP (you can also set this later in the Settings page)
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USERNAME=you@outlook.com
SMTP_PASSWORD=your-outlook-password-or-app-password
SMTP_FROM=you@outlook.com
```

> Tip: generate a secret key with `python3 -c "import secrets; print(secrets.token_hex(32))"`

### 2. Configure the frontend's API URL

```bash
cd domain-tracker
cp .env.example .env
```

Edit `.env` and set `VITE_API_URL` to whatever address **your browser** will use to reach the backend — e.g. your server's IP:

```env
VITE_API_URL=http://192.168.1.50:8000
```

If you're running everything on your own laptop just to try it out, `http://localhost:8000` is fine (the default).

### 3. Build and run

```bash
docker compose up -d --build
```

- Frontend: `http://<your-server>:3000`
- Backend API: `http://<your-server>:8000`

Log in with the `ADMIN_USERNAME` / `ADMIN_PASSWORD` you set in step 1.

### 4. Updating the app later

```bash
git pull   # or copy in updated files
docker compose up -d --build
```

Your SQLite database lives in a Docker named volume (`domain_tracker_data`) and survives rebuilds/restarts.

### Stopping / removing

```bash
docker compose down          # stop containers, keep data
docker compose down -v       # stop containers AND delete the database volume
```

---

## Running Locally Without Docker (development)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # edit as needed
uvicorn app.main:app --reload --port 8000
```

On first run, the backend automatically:
- Creates all SQLite tables
- Creates the admin user from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`
- Starts the APScheduler job that checks for expiring domains **daily at 08:00**

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL=http://localhost:8000
npm run dev
```

Visit `http://localhost:5173`.

---

## CSV Import Format

Go to **Import CSV** in the sidebar. Required columns (case-insensitive, spaces become underscores):

| Column            | Required | Format |
|-------------------|----------|--------|
| `domain`          | ✅ | `example.com` |
| `subdomain`       | optional | `app`, `api`, etc. |
| `platform`        | ✅ | e.g. `GoDaddy`, `Cloudflare` |
| `renewal_date`    | optional | `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY`, or `DD-MM-YYYY` |
| `expiry_date`     | ✅ | same date formats as above |
| `ssl_expiry_date` | ✅ | same date formats as above |
| `notes`           | optional | free text |

The app shows a **preview** before importing — flagging invalid rows and duplicate domains. For duplicates you choose to **skip** them or **update** the existing record. Nothing is overwritten without your confirmation.

Example CSV:

```csv
domain,subdomain,platform,renewal_date,expiry_date,ssl_expiry_date,notes
example.com,,Cloudflare,2026-08-01,2026-09-01,2026-08-15,Main site
example.com,app,AWS,,2026-10-10,2026-10-01,Customer portal
mysite.org,,Namecheap,2026-07-20,2026-08-20,2026-08-05,
```

Use **Export CSV** any time to download everything currently stored.

---

## Email Reminders

A background scheduler (APScheduler) runs **once daily at 08:00 server time** and checks every domain:

- Sends an email if today is exactly **7 days** or **1 day** before `expiry_date`
- Sends an email if today is exactly **7 days** or **1 day** before `ssl_expiry_date`
- Each domain/event combination is logged in `email_logs`, so the same reminder is never sent twice

Configure SMTP under **Settings** (Outlook SMTP works out of the box: host `smtp-mail.outlook.com`, port `587`). You can add multiple recipients, comma-separated.

> Outlook/Microsoft 365 may require an **app password** instead of your normal password if you have 2FA enabled. Generate one from your Microsoft account security settings.

---

## Authentication

- Single administrator account (no multi-tenant/signup flow — this app is for personal use)
- Created automatically from `.env` on first boot
- Passwords hashed with bcrypt; sessions use JWT bearer tokens (24h expiry by default, configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- To change the admin password later, the simplest route is to stop the app, delete the user row directly from the SQLite DB, update `.env`, and restart (it'll recreate the user) — or add a "change password" endpoint if you'd like, just ask.

---

## Folder Structure

```
domain-tracker/
├── docker-compose.yml
├── .env.example                 # VITE_API_URL for the frontend build
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, scheduler, startup/seed logic
│   │   ├── api/                  # Route handlers (auth, domains, dashboard, csv, settings, logs)
│   │   ├── core/                 # config, database session, JWT/bcrypt security
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   └── services/              # Business logic (domain status, email, CSV import/export)
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── pages/                # Login, Dashboard, Domains, Import, Settings, Activity
    │   ├── components/
    │   │   ├── layout/            # Sidebar, Navbar, AppLayout
    │   │   ├── domains/           # DomainTable, FilterBar, BulkActionsBar, DomainFormModal
    │   │   ├── dashboard/         # StatCard, DomainList
    │   │   └── ui/                # Modal, ConfirmDialog, StatusBadge, loading/empty/error states
    │   ├── hooks/useAuth.tsx
    │   ├── lib/                  # api.ts (axios client), utils.ts
    │   └── types/                # Shared TypeScript types
    ├── package.json
    ├── Dockerfile
    └── nginx.conf
```

---

## REST API Reference

All endpoints except `/login` and `/health` require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|--------|----------|--------------|
| POST   | `/login` | Authenticate, returns JWT |
| GET    | `/domains` | List domains (`?search=`, `?status_filter=`) |
| POST   | `/domains` | Create a domain |
| PUT    | `/domains/{id}` | Update a domain |
| DELETE | `/domains/{id}` | Delete a domain |
| POST   | `/domains/bulk-delete` | Delete multiple domains |
| POST   | `/domains/bulk-update` | Update platform/notes on multiple domains |
| GET    | `/dashboard` | Aggregated stats for the dashboard |
| POST   | `/import/preview` | Upload CSV, get a validated preview (no DB writes) |
| POST   | `/import` | Commit the import (`on_duplicate=skip|update`) |
| GET    | `/export` | Download all domains as CSV |
| GET    | `/settings` | Get SMTP/notification settings |
| PUT    | `/settings` | Update SMTP/notification settings |
| GET    | `/activity` | Recent activity log entries |
| GET    | `/email-logs` | Recent reminder emails sent |

Interactive API docs are available at `http://localhost:8000/docs` while the backend is running.

---

## Notes & Limitations

- Built for personal/single-user use — there's no multi-tenancy or role-based access
- No WHOIS lookups or automatic certificate scanning by design — all dates are entered manually or via CSV
- SQLite comfortably handles thousands of domains; no need for Postgres/MySQL at this scale
- The scheduler runs inside the backend container, so the backend must stay running for reminders to fire (Docker's `restart: unless-stopped` handles this across reboots)
