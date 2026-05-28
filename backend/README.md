# AI Insurance Policy — Backend (FastAPI + PostgreSQL)

REST API that powers the React frontend. Pure Python — no third-party hosted services.

## Stack

- **FastAPI** — HTTP + OpenAPI docs
- **SQLAlchemy 2.x** ORM
- **PostgreSQL** (via `psycopg` v3) — single source of truth
- **Pydantic 2** — request / response validation
- **passlib + bcrypt** — password hashing
- **python-jose** — JWT signing

## Project layout

```
backend/
├── app/
│   ├── main.py             # FastAPI app entry + CORS + router registration
│   ├── config.py           # env-driven settings (Pydantic Settings)
│   ├── database.py         # SQLAlchemy engine + session factory
│   ├── models.py           # ORM models
│   ├── schemas.py          # Pydantic request/response schemas
│   ├── security.py         # password hashing + JWT
│   ├── deps.py             # FastAPI deps (get_current_user, require_admin)
│   ├── recommendation.py   # hybrid recommendation engine (Python port)
│   ├── seed.py             # 8 companies + 28 policies seed
│   └── routers/
│       ├── auth.py
│       ├── profiles.py
│       ├── companies.py
│       ├── policies.py
│       ├── recommendations.py
│       ├── feedback.py
│       └── admin.py
├── requirements.txt
└── .env.example
```

## Setup

### 1) Install PostgreSQL locally

Any recent Postgres works. Create the database and a user:

```sql
-- run in psql as the superuser
CREATE USER ai_insurance_policy WITH PASSWORD 'ai_insurance_policy';
CREATE DATABASE ai_insurance_policy OWNER ai_insurance_policy;
GRANT ALL PRIVILEGES ON DATABASE ai_insurance_policy TO ai_insurance_policy;
```

### 2) Create a Python virtual environment

```bash
cd backend
python -m venv .venv

# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
```

### 3) Configure environment

Copy `.env.example` to `.env` and edit if needed:

```env
DATABASE_URL=postgresql+psycopg://ai_insurance_policy:ai_insurance_policy@localhost:5432/ai_insurance_policy
JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_MINUTES=1440
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
INITIAL_ADMIN_EMAIL=admin@ai-insurance-policy.local
```

`INITIAL_ADMIN_EMAIL` — the first user that signs up with this email is auto-promoted to
admin. Everyone else signs up as a regular user.

### 4) Run the API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On startup the app will:
1. Create all tables (`Base.metadata.create_all`)
2. Seed 8 companies + 28 policies **if the catalogue is empty** (idempotent)

OpenAPI docs at <http://localhost:8000/docs>.

## Endpoints

| Method | Path                                  | Auth   | Description                          |
| ------ | ------------------------------------- | ------ | ------------------------------------ |
| POST   | `/api/auth/signup`                    | public | Register; returns JWT + user         |
| POST   | `/api/auth/login`                     | public | Login; returns JWT + user            |
| GET    | `/api/auth/me`                        | user   | Current user                         |
| GET    | `/api/profile`                        | user   | Current user's saved health profile  |
| PUT    | `/api/profile`                        | user   | Upsert health profile                |
| GET    | `/api/companies`                      | public | List companies                       |
| POST   | `/api/companies`                      | admin  | Create company                       |
| PUT    | `/api/companies/{id}`                 | admin  | Update company                       |
| DELETE | `/api/companies/{id}`                 | admin  | Delete company                       |
| GET    | `/api/policies`                       | public | List policies                        |
| GET    | `/api/policies/{id}`                  | public | Get policy by id                     |
| POST   | `/api/policies`                       | admin  | Create policy                        |
| PUT    | `/api/policies/{id}`                  | admin  | Update policy                        |
| DELETE | `/api/policies/{id}`                  | admin  | Delete policy                        |
| POST   | `/api/recommendations`                | user   | Run recommendation; persists snapshot|
| GET    | `/api/recommendations`                | user   | List my recommendations              |
| GET    | `/api/recommendations/{id}`           | user   | Get recommendation (top 3 + reasons) |
| POST   | `/api/feedback`                       | user   | Submit / update feedback             |
| GET    | `/api/feedback/{recommendation_id}`   | user   | Read my feedback for a rec           |
| GET    | `/api/admin/analytics`                | admin  | Totals, top policies, risk dist      |
| GET    | `/api/admin/users`                    | admin  | List all users                       |
| GET    | `/api/admin/recommendations`          | admin  | List all recent recommendations      |
| GET    | `/api/health`                         | public | Liveness probe                       |

All authenticated endpoints expect `Authorization: Bearer <token>`. Tokens are HS256 JWTs
with `sub=<user id>`, `role`, and `exp`.

## Recommendation pipeline

[`app/recommendation.py`](app/recommendation.py) implements the four-stage hybrid pipeline:

1. **Rule-based eligibility filter** — drops policies whose age band, family size, coverage
   amount, premium-vs-budget, exclusions, or preferred-type filter excludes the user.
2. **Risk classification** — Low / Medium / High based on age, pre-existing conditions,
   smoking, alcohol, lifestyle, family history, occupation, and coverage-to-income ratio.
3. **Content-based scoring** — each policy is scored on budget match, coverage match,
   reliability (claim ratio + network + rating), benefits overlap, and risk suitability.
4. **Weighted ranking** with the spec'd weights:

   | Factor                             | Weight |
   | ---------------------------------- | -----: |
   | Budget match                       |  30%   |
   | Coverage match                     |  25%   |
   | Claim settlement & reliability     |  20%   |
   | Benefits match                     |  15%   |
   | Risk suitability                   |  10%   |

The top 3 policies are returned with a generated reason explaining the rank.

## Re-running the seed

The seed is idempotent — if the catalogue is non-empty it skips. To force a re-seed,
truncate the relevant tables:

```sql
TRUNCATE
  recommendation_items, recommendations, feedback,
  policies, companies
RESTART IDENTITY CASCADE;
```

Then restart the API; it will reseed on lifespan startup. Or run the seed script directly:

```bash
python -m app.seed
```

## Promote an account to admin (alternative to INITIAL_ADMIN_EMAIL)

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

## Disclaimer

AI Insurance Policy is an academic prototype. Insurance company names, policy details, premiums,
claim ratios, and benefits are **synthetic and illustrative**. Verify policy terms with
the official insurance provider before any purchase decision.
