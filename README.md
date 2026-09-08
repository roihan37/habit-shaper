
# Habit Shaper

A lightweight web application for building positive habits and breaking negative habits through daily tracking, streak management, weekly completion statistics, and goal management.

## Features

### Habit Building

- Create habits to build, such as reading, exercising, or meditating.
- Mark a habit as completed for each day.
- Track consecutive completion streaks.
- View weekly completion rate.
- View missed days during the week.

### Habit Breaking

- Create habits to break, such as smoking, junk food, or doomscrolling.
- Track consecutive clean days.
- Record a relapse.
- Reset the current clean streak after a relapse.

### Goal Management

- Create goals.
- Edit goals.
- Remove goals.
- Link each goal to a build or break habit.

### Authentication

- Register with email and password.
- Login with email and password.
- Logout by clearing the authentication cookie.
- Protected user-owned resources.
- User data is isolated between accounts.

---

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui
- Lucide React

### Backend

- Node.js
- TypeScript
- Express
- Zod
- Prisma ORM
- JWT
- HttpOnly Cookie
- bcrypt

### Database

- MySQL
- Prisma ORM
- Prisma Migrate

### Testing

- Vitest
- Supertest

### Infrastructure

- Docker
- Docker Compose

For detailed architectural decisions, see [`docs/architecture.md`](docs/architecture.md).

For database design, see [`docs/data-model.md`](docs/data-model.md).

---

## Architecture

The application follows a simple modular architecture.

```text
                    +------------------+
                    |     Browser      |
                    | React Frontend   |
                    +--------+---------+
                             |
                             | HTTP / JSON
                             v
                    +------------------+
                    |   Express API    |
                    | Node.js + TS     |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |     Services     |
                    | Business Logic   |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |   Repositories   |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |      Prisma      |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    |      MySQL       |
                    +------------------+
```

The frontend communicates with the backend through HTTP APIs.

The frontend never connects directly to MySQL.

Business-critical logic, including streak calculation, authorization, and data ownership, is handled on the backend.

---

## Project Structure

```text
habit-shaper/
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── business-rules.md
│   ├── api-design.md
│   └── task-breakdown.md
│
├── compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Prerequisites

Only the following are required:

* Docker
* Docker Compose

No local Node.js installation or MySQL installation is required.

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd habit-shaper
```

### 2. Create environment file

Copy the example environment file:

```bash
cp .env.example .env
```

Update the values if necessary.

For the default Docker setup, the database host should use the Docker Compose service name rather than `localhost`.

### 3. Start the application

```bash
docker compose up --build
```

The application stack will start with:

```text
Frontend
Backend
MySQL
```

Database migrations are applied automatically during application startup.

---

## Environment Variables

The following variables are required by the application:

```env
DATABASE_HOST=mysql
DATABASE_PORT=3306
DATABASE_NAME=habit_shaper
DATABASE_USER=app
DATABASE_PASSWORD=change_me

AUTH_SECRET=change_me
APP_TIMEZONE=Asia/Jakarta

FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:4000
```

The root [`.env.example`](.env.example) is the authoritative environment
configuration template.

Do not commit real secrets to the repository.

---

## Application URLs

After starting the containers:

```text
Frontend:
http://localhost:3000

Backend API:
http://localhost:4000
```

The exact ports are defined in `compose.yml`.

---

## API Structure

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

### Habits

```text
GET    /api/habits
POST   /api/habits
GET    /api/habits/:habitId
PATCH  /api/habits/:habitId
DELETE /api/habits/:habitId
```

### Habit Tracking

```text
PUT /api/habits/:habitId/today
GET /api/habits/:habitId/stats
```

Optional P1 historical tracking and correction:

```text
PUT /api/habits/:habitId/records/:date
GET /api/habits/:habitId/records
```

### Goals

```text
GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:goalId
DELETE /api/goals/:goalId
```

All user-owned endpoints require authentication.

---

## Habit Tracking Rules

### Build Habits

A build-habit streak represents consecutive days on which the user completed the habit.

Example:

```text
Monday     Completed
Tuesday    Completed
Wednesday  Completed
Thursday   Missed
Friday     Completed
```

Current streak on Friday:

```text
1 day
```

The missed day breaks the previous streak.

### Break Habits

A break-habit streak represents consecutive clean days.

Example:

```text
Monday     Clean
Tuesday    Clean
Wednesday  Relapse
Thursday   Clean
Friday     Clean
```

Current clean streak on Friday:

```text
2 days
```

A relapse resets the current clean streak.

---

## Data Ownership

All user-owned resources are protected by backend authorization.

A user can only access and modify:

* Their own habits
* Their own habit records
* Their own goals

Resource IDs alone are never treated as sufficient authorization.

For example:

```text
User A
  |
  +-- Habit A

User B
  |
  +-- Habit B
```

User A must not be able to access Habit B by providing its ID.

---

## Database

The application uses MySQL with Prisma ORM.

Core entities:

```text
users
  |
  +---- habits
  |       |
  |       +---- habit_records
  |
  +---- goals
           |
           +---- habits
```

A habit can have multiple daily records.

Each habit can have at most one tracking record for a given date.

```text
UNIQUE(habit_id, record_date)
```

Detailed database design is documented in:

[`docs/data-model.md`](docs/data-model.md)

---

## Database Migrations

Database schema changes are managed through Prisma migrations.

On initial application startup:

```text
Docker Compose
      |
      v
MySQL starts
      |
      v
Database becomes ready
      |
      v
Prisma migrations run
      |
      v
Backend starts
```

No manual database creation or migration command is required for the standard Docker setup.

---

## Testing

Run backend tests inside the backend environment.

```bash
docker compose exec backend npm test
```

Additional checks:

```bash
docker compose exec backend npm run lint
docker compose exec backend npm run typecheck
```

The test suite focuses on business-critical behavior, including:

* Authentication
* Habit CRUD
* Goal CRUD
* Daily tracking
* Streak calculation
* Relapse handling
* Weekly statistics
* Authorization and user ownership

---

## Development Commands

### Start development environment

```bash
docker compose up
```

### Rebuild containers

```bash
docker compose up --build
```

### Stop containers

```bash
docker compose down
```

### Stop containers and remove database volume

```bash
docker compose down -v
```

The `-v` option removes the local MySQL volume and should only be used when a clean database state is required.

---

## Code Quality

The project uses:

* TypeScript for static typing.
* ESLint for code-quality checks.
* Prettier for consistent formatting.
* Zod for request validation.
* Automated tests for critical business logic.

The codebase follows separation of concerns between:

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Database
```

Controllers should not contain business logic, and database access should remain isolated from the service layer.

---

## Security

Security-related assumptions include:

* Passwords are never stored in plaintext.
* Passwords are hashed using bcrypt.
* Authentication tokens are stored using HttpOnly cookies.
* Protected endpoints require authentication.
* Backend authorization verifies resource ownership.
* Request payloads are validated.
* Database credentials are provided through environment variables.
* Real secrets are excluded from Git.
* Internal database errors are not exposed to API clients.

See [`docs/architecture.md`](docs/architecture.md) for detailed security and architectural decisions.

---

## Docker

The complete application consists of three services:

```text
+----------------+
|    frontend    |
|     React      |
+-------+--------+
        |
        v
+----------------+
|    backend     |
| Node + Express |
+-------+--------+
        |
        v
+----------------+
|      mysql     |
|     MySQL      |
+----------------+
```

The services communicate through the Docker Compose network.

The backend connects to MySQL using the MySQL service name.

---

## Documentation

Additional project documentation:

* [`docs/architecture.md`](docs/architecture.md) - System architecture, technology decisions, API architecture, security, Docker, and development strategy.
* [`docs/data-model.md`](docs/data-model.md) - Database schema, relationships, constraints, and indexes.

---

## Git History

Development is organized into meaningful commits that reflect the implementation process.

Example:

```text
chore: initialize project structure
chore: configure docker compose
feat: add mysql schema and migrations
feat: implement user authentication
feat: implement habit management
feat: implement daily habit tracking
feat: implement streak calculation
feat: implement weekly habit statistics
feat: implement goal management
feat: build habit dashboard
test: add authentication and habit tests
test: add streak and relapse test cases
fix: prevent duplicate daily records
docs: add setup and architecture documentation
```

The repository history is intended to show the progression from initial setup to the completed implementation.

---

## Definition of Done

### Functional

* [ ] User registration works.
* [ ] User login works.
* [ ] User logout works.
* [ ] Build habits can be created.
* [ ] Break habits can be created.
* [ ] Daily habit tracking works.
* [ ] Build streaks are calculated correctly.
* [ ] Break-habit clean streaks are calculated correctly.
* [ ] Relapse resets the clean streak.
* [ ] Weekly completion rate is displayed.
* [ ] Missed days are displayed.
* [ ] Goals can be created.
* [ ] Goals can be edited.
* [ ] Goals can be removed.
* [ ] Goals can be linked to habits.
* [ ] User-owned resources are properly isolated.

### Technical

* [ ] Frontend runs successfully.
* [ ] Backend runs successfully.
* [ ] MySQL runs successfully.
* [ ] Database migrations run automatically.
* [ ] `docker compose up --build` starts the complete stack.
* [ ] No local Node.js or MySQL installation is required.
* [ ] `.env.example` is provided.
* [ ] No real secrets are committed.
* [ ] Critical automated tests cover authentication, ownership, daily tracking, streaks, relapse, and weekly statistics.
* [ ] README and architecture documentation are included.

---

## License

This project was created as part of an engineering coding test.

### Catatan Senior

Ada **dua hal yang sengaja saya lakukan** di README ini.

**Pertama**, saya tidak memasukkan terlalu banyak detail implementasi. `README.md` adalah **entry point reviewer**, sedangkan detail reasoning ada di:

```text
docs/
├── architecture.md
├── data-model.md
├── business-rules.md
├── api-design.md
└── task-breakdown.md
```

**Kedua**, saya tidak menulis versi dependency seperti `React 19.x`, `Prisma 6.x`, dan sebagainya **sebelum kita benar-benar initialize project**. Versi yang tercantum di README harus sama dengan versi aktual di `package.json`, bukan angka yang kita tebak sekarang.

Jadi struktur dokumentasi kita sekarang sudah tepat:

```text
habit-shaper/
│
├── README.md              ← "Apa ini dan bagaimana menjalankannya?"
│
└── docs/
    ├── architecture.md    ← "Bagaimana sistem dirancang dan kenapa?"
    ├── data-model.md      ← "Bagaimana data dimodelkan?"
    ├── business-rules.md  ← "Apa aturan domainnya?"
    ├── api-design.md      ← "Apa kontrak HTTP-nya?"
    └── task-breakdown.md  ← "Apa urutan implementasinya?"
```
