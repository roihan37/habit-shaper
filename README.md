# Habit Shaper

Habit Shaper is a full-stack application for building positive habits and breaking negative ones. Users can track daily outcomes, review type-specific streaks and statistics, and attach goals to habits.

## Features

- Email/password registration, login, current-user lookup, and logout
- Authenticated, ownership-scoped habit CRUD
- `BUILD` habits with current streak and Monday-Sunday weekly completion
- `BREAK` habits with a current clean streak
- Idempotent tracking for today and supported historical dates
- Filterable history and type-specific statistics
- Goal CRUD for owned habits
- Protected dashboard, habits, habit-detail, and goals pages

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router, TanStack Query, React Hook Form, Zod, Tailwind CSS, shadcn/ui components |
| Backend | Node.js, TypeScript, Express, Prisma, Zod, bcrypt, JWT |
| Database | MySQL 8.4 |
| Testing | Vitest, Supertest |
| Infrastructure | Docker, Docker Compose |

## Prerequisites

Running the application requires only Docker and Docker Compose. Local Node.js, npm, Prisma, and MySQL installations are not part of the application startup flow.

## Start the application

```bash
cp .env.example .env
docker compose up
```

Before starting, replace the example database passwords and `AUTH_SECRET` in `.env`. The authentication secret must contain at least 16 characters. Use `docker compose up --build` after image or dependency changes. To reset database state:

```bash
docker compose down -v
```

The backend waits for the MySQL healthcheck and runs `prisma migrate deploy` before serving requests.

## Environment

The uncommitted root `.env` is based on `.env.example`.

| Variable | Purpose |
| --- | --- |
| `DATABASE_NAME` | Database created by MySQL |
| `DATABASE_USER` | Application database user |
| `DATABASE_PASSWORD` | Application database password |
| `DATABASE_ROOT_PASSWORD` | MySQL root password used by its healthcheck |
| `AUTH_SECRET` | Backend-only JWT signing secret; minimum 16 characters |
| `APP_TIMEZONE` | Backend calendar-date authority, normally `Asia/Jakarta` |
| `FRONTEND_URL` | Allowed browser origin for credentialed CORS |
| `VITE_API_URL` | Browser-facing backend URL compiled into the frontend |

Compose constructs `DATABASE_URL` with the internal `mysql` hostname. `NODE_ENV` and backend `PORT` are optional in code and default to `development` and `4000`. Never expose `AUTH_SECRET` through a `VITE_*` variable.

## Ports

| Service | URL/port |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Backend health | http://localhost:4000/health |
| MySQL | localhost:3306 |

## Developer checks

These optional commands are for development and testing, not Docker startup prerequisites.

```bash
cd backend
npm ci
npm run build
npm run lint
npm run test:run
```

```bash
cd frontend
npm ci
npm run build
npm run lint
```

The frontend package currently has no automated test script.

## Documentation

- [Architecture](docs/architecture.md)
- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Business rules](docs/business-rules.md)
- [Task breakdown](docs/task-breakdown.md)
