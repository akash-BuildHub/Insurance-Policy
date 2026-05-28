# PolicyMate AI — AI-Powered Personalized Health Insurance Recommendation System

> **Academic final-year project.** Not licensed financial or insurance advice. All policy
> data is **synthetic** and illustrative.

A web-based system that helps users find the most suitable health insurance company and
policy based on their age, income, occupation, family size, health condition, lifestyle,
budget, coverage requirement, and risk profile.

The recommendation engine uses a transparent **four-stage hybrid pipeline**:

1. **Rule-based eligibility filtering** — drop ineligible policies.
2. **Risk classification** — Low / Medium / High based on age, pre-existing conditions,
   smoking, alcohol, lifestyle, family medical history, occupation, and coverage need.
3. **Content-based scoring** — score each policy against the user's profile.
4. **Weighted ranking** with the spec'd weights:

   | Factor                             | Weight |
   | ---------------------------------- | -----: |
   | Budget match                       |  30%   |
   | Coverage match                     |  25%   |
   | Claim settlement & reliability     |  20%   |
   | Benefits match                     |  15%   |
   | Risk suitability                   |  10%   |

The top 3 policies are returned with a plain-English **reason** for each.

---

## Architecture

Three clearly separated tiers — no third-party hosted services:

```
┌─────────────┐    HTTPS / JSON     ┌─────────────┐    SQL    ┌────────────┐
│  Frontend   │ ─────────────────▶ │   FastAPI   │ ────────▶ │ PostgreSQL │
│  (React)    │   JWT in Bearer    │ (Python)    │           │            │
└─────────────┘                    └─────────────┘           └────────────┘
   port 5173                          port 8000               port 5432
```

- **Frontend** — React 19 SPA (Vite), TanStack Router, Tailwind CSS v4, shadcn/ui.
- **Backend** — FastAPI + SQLAlchemy 2, Pydantic 2, JWT auth, recommendation engine.
- **Database** — PostgreSQL (local). Schema is created automatically on startup, seeded
  with 8 companies and 28 health insurance policies.

---

## Repository layout

```
.
├── backend/        # FastAPI + SQLAlchemy + recommendation engine
│   ├── app/
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
├── frontend/       # React SPA
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
├── README.md       # ← you are here
└── .gitignore
```

---

## Quick start — local development

### Prerequisites

- **Node.js 20+** (and npm)
- **Python 3.11+**
- **PostgreSQL 14+** running locally

### 1) Database

```sql
-- Run as a Postgres superuser, e.g. via `psql -U postgres`
CREATE USER policymate WITH PASSWORD 'policymate';
CREATE DATABASE policymate OWNER policymate;
GRANT ALL PRIVILEGES ON DATABASE policymate TO policymate;
```

### 2) One-time install (backend deps + frontend deps)

```bash
# --- Backend ---
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env       # or `copy .env.example .env` on Windows
deactivate                 # not required, but the dev script doesn't need an active shell venv

# --- Frontend ---
cd ../frontend
npm install
cp .env.example .env       # optional, defaults to http://localhost:8000
```

### 3) Run both servers with one command

From the `frontend/` directory:

```bash
npm run dev
```

This uses `concurrently` to start:

- **backend** — `uvicorn app.main:app --reload` on <http://localhost:8000>
  (auto-detects `backend/.venv` via [`frontend/scripts/dev-backend.mjs`](frontend/scripts/dev-backend.mjs))
- **frontend** — `vite` on <http://localhost:5173>

On first start the backend creates the tables and seeds 8 companies + 28 policies.
Interactive OpenAPI docs at <http://localhost:8000/docs>.

Press `Ctrl+C` once to stop both processes.

If you prefer separate terminals, the scripts are also available individually:

```bash
npm run dev:backend     # backend only
npm run dev:frontend    # frontend only (= plain `vite`)
```

---

## Sample user flow

1. **Sign up** at `/signup` (or log in).
2. **Fill the questionnaire** at `/recommend` — 20+ fields covering personal, family,
   finance, health, lifestyle, and insurance needs.
3. **Get your recommendation** — top 3 cards + side-by-side comparison + plain-English
   reason + risk badge.
4. **Download the PDF report** (button on the recommendation page).
5. **Submit feedback** — 1–5 star rating + useful flag + free-text comment.
6. Return to `/dashboard` for profile summary, latest risk profile, and history.

## Admin flow

Set `INITIAL_ADMIN_EMAIL` in `backend/.env` and sign up with that email — the account is
auto-promoted to admin. (Or run `UPDATE users SET role='admin' WHERE email='…';` after.)

1. Visit `/admin` — totals + most-recommended chart + risk distribution pie.
2. `/admin/companies` — add / edit / delete companies.
3. `/admin/policies` — add / edit / delete policies (all 17 fields).
4. `/admin/users` — list of users with roles.
5. `/admin/recommendations` — recent recommendations across the platform.

---

## Database tables

| Table                  | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `users`                | Authentication accounts + role (`user` / `admin`)       |
| `user_profiles`        | Latest health questionnaire snapshot (per user)         |
| `companies`            | Insurance companies                                     |
| `policies`             | Health insurance policy catalogue                       |
| `recommendations`      | One row per "Get recommendation" run                    |
| `recommendation_items` | Top-3 ranked policies per recommendation                |
| `feedback`             | 1–5 rating + useful flag + comment per recommendation   |

---

## API summary

All endpoints are mounted under `/api/*`. See `backend/README.md` for the full list. Quick
overview:

- **Auth** — `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- **Profile** — `GET|PUT /api/profile`
- **Catalogue (public)** — `GET /api/companies`, `GET /api/policies`, `GET /api/policies/{id}`
- **Catalogue (admin)** — `POST|PUT|DELETE /api/companies[/{id}]` and `/api/policies[/{id}]`
- **Recommendations** — `POST /api/recommendations` (run), `GET /api/recommendations` (list),
  `GET /api/recommendations/{id}`
- **Feedback** — `POST /api/feedback`, `GET /api/feedback/{recommendation_id}`
- **Admin** — `GET /api/admin/analytics`, `GET /api/admin/users`, `GET /api/admin/recommendations`

---

## Disclaimer

> **PolicyMate AI is an academic prototype for insurance policy recommendation. It does
> not provide licensed financial, legal, or insurance advice. All insurance company names,
> policy names, premiums, coverage amounts, claim settlement ratios, and benefits are
> synthetic and illustrative. Users must verify policy terms with the official insurance
> provider before making a purchase decision.**

Also accessible in the app at `/disclaimer` and linked from the footer.

---

## Known limitations

- **Policy data is synthetic** — sourced for academic realism, doesn't represent any
  specific real-world insurer or policy.
- **No live insurer-API integration** — premiums and claim ratios are static.
- **Risk model is rule-based**. The `feedback` table is structured to support training a
  classifier on collected user feedback in a future iteration.
- **AI chatbot module** is listed as future scope and intentionally not implemented.
- **Only Health Insurance** is in scope. Life / motor / travel are mentioned as future scope only.
