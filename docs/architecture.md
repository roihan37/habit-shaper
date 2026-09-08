# Habit Shaper Architecture

## 1. Overview

Habit Shaper is a lightweight web application for building positive
habits and breaking negative habits through daily tracking, streak
management, weekly completion statistics, and goal management.

The architecture is designed around the coding test requirements:

-   Frontend: React
-   Backend: Node.js with TypeScript
-   Database: MySQL
-   Authentication: email and password
-   Containerized execution using Docker Compose
-   Database schema bootstrap on first boot
-   The complete application must run with Docker and Docker Compose
    without requiring local runtime or database installation

The design prioritizes:

1.  Clear separation of concerns
2.  Secure user-level data ownership
3.  Correct and testable habit-tracking business logic
4.  Simple deployment
5.  Maintainable code structure
6.  A Git history that clearly communicates development progress

> Note: The coding test specifies the required technology and functional
> scope, but does not prescribe a specific backend framework, ORM,
> authentication mechanism, or frontend state-management library. Those
> implementation choices are therefore architectural decisions proposed
> for this project.

------------------------------------------------------------------------

## 2. System Context

``` text
                         +----------------------+
                         |       Browser        |
                         |   React Frontend     |
                         +----------+-----------+
                                    |
                                    | HTTP/JSON
                                    v
                         +----------------------+
                         |     Node.js API      |
                         |     TypeScript       |
                         |                      |
                         | Auth                 |
                         | Habits               |
                         | Tracking             |
                         | Goals                |
                         | Statistics           |
                         +----------+-----------+
                                    |
                                    | SQL
                                    v
                         +----------------------+
                         |        MySQL         |
                         |                      |
                         | Users                |
                         | Habits               |
                         | Habit Records        |
                         | Goals                |
                         +----------------------+
```

The browser communicates only with the backend API. The backend is
responsible for authentication, authorization, business rules,
persistence, and calculation of habit statistics.

The frontend should not connect directly to MySQL.

------------------------------------------------------------------------

## 3. Deployment Architecture

The entire application runs through Docker Compose.

``` text
+-------------------------------------------------------------+
|                    Docker Compose Network                   |
|                                                             |
|  +----------------+       +----------------+                |
|  |    frontend    | ----> |     backend    |                |
|  |     React      | HTTP  | Node + TS      |                |
|  +----------------+       +-------+--------+                |
|                                   |                         |
|                                   | MySQL protocol          |
|                                   v                         |
|                           +---------------+                 |
|                           |     mysql     |                 |
|                           |    MySQL DB   |                 |
|                           +---------------+                 |
|                                                             |
+-------------------------------------------------------------+
```

### Required deployment behavior

From the repository root:

``` bash
docker compose up --build
```

should start the complete stack.

The database schema must be initialized automatically on first boot
through migrations or an equivalent schema-bootstrap mechanism.

No local Node.js runtime, package installation, or MySQL installation
should be required for the reviewer.

------------------------------------------------------------------------

## 4. Repository Structure

Proposed repository structure:

``` text
habit-shaper/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── app/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── habits/
│   │   │   └── goals/
│   │   ├── middleware/
│   │   ├── database/
│   │   ├── config/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
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

This structure is intentionally modular without introducing unnecessary
enterprise layers.

------------------------------------------------------------------------

## 5. Backend Architecture

The backend follows a layered/module-oriented architecture.

``` text
HTTP Request
     |
     v
+------------+
| Middleware |
+-----+------+
      |
      v
+-------------+
| Controller  |
+------+------+
       |
       v
+-------------+
|   Service   |
+------+------+
       |
       v
+-------------+
| Repository  |
+------+------+
       |
       v
+-------------+
|   Prisma    |
+------+------+
       |
       v
+-------------+
|    MySQL    |
+-------------+
```

### Responsibilities

#### Middleware

Responsible for cross-cutting concerns such as:

-   Authentication
-   Request validation where appropriate
-   Error handling
-   Request-level concerns

#### Controller

Responsible for:

-   Reading HTTP request data
-   Calling the appropriate service
-   Returning HTTP responses
-   Avoiding business logic

#### Service

Responsible for:

-   Business rules
-   Habit streak calculation
-   Weekly completion calculation
-   Relapse behavior
-   Goal-habit relationship rules
-   Ownership checks
-   Coordinating persistence operations

#### Repository

Responsible for:

-   Database queries
-   Creating, reading, updating, and deleting records
-   Keeping SQL/database access separate from business logic

------------------------------------------------------------------------

## 6. Domain Modules

### 6.1 Authentication Module

Responsibilities:

-   User registration
-   User login
-   Authentication state
-   Password hashing
-   Authentication validation

Proposed endpoints:

``` text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

The specification requires registration and login through email and
password. Email verification is not required.

------------------------------------------------------------------------

### 6.2 Habit Module

A habit has one of two types:

``` text
BUILD
BREAK
```

Build habits represent positive behaviors the user wants to establish.

Examples from the requirements include:

-   Meditation
-   Exercise
-   Reading
-   Learning Mandarin

Break habits represent behaviors the user wants to stop.

Examples include:

-   Smoking
-   Junk food
-   Doomscrolling

Proposed endpoints:

``` text
GET    /api/habits
POST   /api/habits
GET    /api/habits/:habitId
PATCH  /api/habits/:habitId
DELETE /api/habits/:habitId
```

------------------------------------------------------------------------

### 6.3 Habit Tracking Module

Daily tracking should be represented separately from the habit
definition.

Proposed endpoints:

``` text
PUT /api/habits/:habitId/today
GET /api/habits/:habitId/stats
```

Historical tracking and correction are P1 enhancements:

``` text
PUT /api/habits/:habitId/records/:date
GET /api/habits/:habitId/records
```

A daily record represents the state of a habit for a particular date.

A database uniqueness constraint should prevent more than one record for
the same habit and date:

``` text
UNIQUE(habit_id, record_date)
```

The API should update an existing daily record rather than creating
duplicate records.

------------------------------------------------------------------------

### 6.4 Goal Module

Goals are linked to habits and may be associated with either a build or
break habit.

Proposed endpoints:

``` text
GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:goalId
DELETE /api/goals/:goalId
```

The service layer should verify that the referenced habit belongs to the
authenticated user.

------------------------------------------------------------------------

## 7. Data Model

The following model is a proposed implementation derived from the
functional requirements.

### User

``` text
users
-----
id
email
password_hash
created_at
updated_at
```

Relationship:

``` text
User 1 ---- N Habits
User 1 ---- N Goals
```

------------------------------------------------------------------------

### Habit

``` text
habits
------
id
user_id
name
description
type
created_at
updated_at
```

Where:

``` text
type = BUILD | BREAK
```

Relationship:

``` text
Habit 1 ---- N HabitRecords
Habit 1 ---- N Goals
```

------------------------------------------------------------------------

### Habit Record

``` text
habit_records
-------------
id
habit_id
record_date
status
created_at
updated_at
```

A record represents the daily outcome for a habit.

``` text
BUILD:
SUCCESS = completed
FAILURE = missed

BREAK:
SUCCESS = clean
FAILURE = relapse
```

The shared status enum keeps persistence normalized while the API and UI may
use habit-type-specific labels.

------------------------------------------------------------------------

### Goal

``` text
goals
-----
id
user_id
habit_id
title
description
created_at
updated_at
```

Relationship:

``` text
User
 |
 +---- Habit
         |
         +---- Goal
```

------------------------------------------------------------------------

## 8. Business Rules

### 8.1 Build Habit Streak

A build streak represents consecutive days on which the habit was
completed.

Example:

``` text
Mon  completed
Tue  completed
Wed  completed
Thu  missed
Fri  completed
```

The current streak at Friday is:

``` text
1 day
```

The streak must not count earlier consecutive days after a missed day.

------------------------------------------------------------------------

### 8.2 Break Habit Clean Streak

A break-habit streak represents consecutive days without the unwanted
behavior.

Example:

``` text
Mon  clean
Tue  clean
Wed  relapse
Thu  clean
Fri  clean
```

The current clean streak at Friday is:

``` text
2 days
```

A relapse breaks the current clean streak.

------------------------------------------------------------------------

### 8.3 Daily Record Uniqueness

A habit can have only one tracking record for a given date.

``` text
(habit_id, record_date)
```

must therefore be unique.

This prevents double-clicks or repeated API calls from creating
inconsistent daily statistics.

------------------------------------------------------------------------

### 8.4 User Ownership

All user-owned resources must be scoped to the authenticated user.

For example:

``` text
GET /api/habits/:habitId
```

must not return another user's habit even when the requester knows the
habit ID.

The same rule applies to:

-   Habits
-   Habit records
-   Goals

Authorization belongs in the backend and must not rely on frontend
checks.

------------------------------------------------------------------------

### 8.5 Weekly Completion Rate

For build habits, the weekly completion rate is calculated from eligible
days, not automatically from all seven calendar days:

``` text
weekly_completion_rate =
completed_days / eligible_days * 100
```

The UI should also show how many days were missed during the week
because this is explicitly required.

Detailed eligibility, pending-today, and historical-week rules are
defined in `docs/business-rules.md`.

------------------------------------------------------------------------

### 8.6 Habit Start Date

A habit becomes eligible on its creation calendar date in
`APP_TIMEZONE`. Earlier dates are outside its tracking window: they cannot
receive records, do not break streaks, and do not count as missed or eligible
weekly days.

For weekly statistics, evaluation begins at the later of the week start and
the habit creation date. The authoritative calculation is defined in
`docs/business-rules.md`.

------------------------------------------------------------------------

## 9. API Design Principles

The API should:

-   Use resource-oriented URLs
-   Return JSON
-   Validate request input
-   Return appropriate HTTP status codes
-   Avoid exposing password hashes
-   Require authentication for user-owned resources
-   Enforce ownership on the backend
-   Return predictable error structures

Example success response:

``` json
{
  "data": {
    "id": "habit-id",
    "name": "Read",
    "type": "BUILD"
  }
}
```

Example error response:

``` json
{
  "error": {
    "code": "HABIT_NOT_FOUND",
    "message": "Habit not found"
  }
}
```

The authoritative API response envelope is defined in
`docs/api-design.md` and must remain consistent across endpoints.

------------------------------------------------------------------------

## 10. Frontend Architecture

The React application should be organized by responsibility.

``` text
Pages
  |
  +---- Components
  |
  +---- Hooks
  |
  +---- Services
  |
  +---- API
```

### Pages

Proposed pages:

``` text
/login
/register
/dashboard
/habits
/habits/:habitId
/goals
```

### Components

Reusable UI components should include concepts such as:

``` text
HabitCard
HabitForm
HabitList
HabitTracker
StreakDisplay
WeeklyStats
GoalForm
GoalList
```

### Services

API calls should be isolated from UI components.

Example:

``` text
services/
├── authService
├── habitService
└── goalService
```

This prevents components from containing raw HTTP logic.

------------------------------------------------------------------------

## 11. Dashboard Flow

The dashboard should provide a concise overview of current progress.

``` text
Authenticated User
        |
        v
     Dashboard
        |
        +---- Build Habits
        |       |
        |       +---- Today's status
        |       +---- Current streak
        |       +---- Weekly completion
        |
        +---- Break Habits
        |       |
        |       +---- Today's clean status
        |       +---- Current clean streak
        |
        +---- Goals
```

The UI should remain lightweight and clean, consistent with the
specification.

------------------------------------------------------------------------

## 12. Authentication Flow

``` text
Register
   |
   v
Validate input
   |
   v
Hash password
   |
   v
Create user
   |
   v
Login
   |
   v
Verify credentials
   |
   v
Issue JWT
   |
   v
Set JWT in HttpOnly cookie
   |
   v
Authenticated API requests
```

The frontend should not store or expose the user's password.

The backend must authenticate requests before accessing user-owned data.

------------------------------------------------------------------------

## 13. Error Handling

Errors should be handled centrally.

``` text
Request
   |
   v
Controller
   |
   v
Service
   |
   +---- Expected domain error
   |
   +---- Unexpected error
   |
   v
Central Error Handler
   |
   v
Consistent HTTP response
```

The API should avoid leaking internal database errors or sensitive
implementation details to clients.

------------------------------------------------------------------------

## 14. Database Migration Strategy

Database schema changes should be versioned through migrations.

Example:

``` text
backend/prisma/migrations/
├── 001_create_users
├── 002_create_habits
├── 003_create_habit_records
└── 004_create_goals
```

On initial Docker startup:

``` text
MySQL starts
    |
    v
Backend waits for database readiness
    |
    v
Migration process runs
    |
    v
Application starts
```

This satisfies the requirement that schema bootstrap runs automatically
on first boot.

------------------------------------------------------------------------

## 15. Docker Strategy

Each application component should have an isolated container.

``` text
compose.yml
    |
    +---- frontend
    |
    +---- backend
    |
    +---- mysql
```

The backend should use the Docker service name for database
communication rather than assuming `localhost`.

Example:

``` text
DATABASE_HOST=mysql
```

The frontend should communicate with the backend through the configured
API endpoint.

------------------------------------------------------------------------

## 16. Configuration

Required environment variables are documented authoritatively in the root
`.env.example`. The current configuration contract contains:

``` text
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
AUTH_SECRET
APP_TIMEZONE
FRONTEND_URL
API_URL
```

The example file must contain placeholders only; environment-specific values
and real secrets must not be committed.

A real `.env` file should remain excluded through `.gitignore`.

------------------------------------------------------------------------

## 17. Testing Strategy

Testing should focus first on business-critical behavior.

### Authentication

-   Register with valid credentials
-   Reject duplicate email
-   Login with valid credentials
-   Reject invalid credentials
-   Logout clears the authentication cookie
-   Reject unauthenticated protected requests

### Habit Management

-   Create build habit
-   Create break habit
-   Update habit
-   Delete habit
-   Retrieve only the authenticated user's habits

### Daily Tracking

-   Track today
-   Repeated PUT updates today's record
-   Prevent duplicate records for the same habit/date

### Streaks

-   One-day streak
-   Consecutive-day streak
-   Streak after a missed day
-   Break-habit clean streak
-   Relapse resets the current clean streak
-   Missing past eligible day breaks the streak
-   Untracked today remains pending
-   Dates before habit creation are excluded
-   Weekly completed, missed, and eligible days
-   Completion rate rounds to one decimal place

### Goals

-   Create goal
-   Update goal
-   Delete goal
-   Link goal to an owned habit
-   Reject access to another user's goal

------------------------------------------------------------------------

## 18. Git Strategy

Git history is part of the evaluation criteria, so commits should
represent meaningful development steps.

Recommended sequence:

``` text
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

chore: improve production docker setup

docs: add setup and architecture documentation
```

Commits should be small enough to explain what changed but meaningful
enough to show development progression.

------------------------------------------------------------------------

## 19. Development Workflow

Recommended implementation order:

``` text
1. Requirement analysis
        |
2. Architecture and data model
        |
3. Repository initialization
        |
4. Docker Compose
        |
5. MySQL + migrations
        |
6. Authentication
        |
7. Habit CRUD
        |
8. Daily tracking
        |
9. Streak calculation
        |
10. Weekly statistics
        |
11. Goal management
        |
12. React dashboard
        |
13. Integration testing
        |
14. Fresh Docker verification
        |
15. README + architecture documentation
        |
16. Final review
```

This order reduces the risk of building frontend behavior around an
unstable backend contract.

------------------------------------------------------------------------

## 20. Definition of Done

The implementation is considered ready for submission when:

### Functional

-   [ ] User can register
-   [ ] User can log in
-   [ ] User can log out
-   [ ] User can create build habits
-   [ ] User can create break habits
-   [ ] User can mark build habits completed per day
-   [ ] User can track clean days for break habits
-   [ ] Build streaks are calculated correctly
-   [ ] Break clean streaks are calculated correctly
-   [ ] Relapse resets the clean streak
-   [ ] Weekly completion rate is displayed
-   [ ] Missed days are displayed
-   [ ] Goals can be added
-   [ ] Goals can be edited
-   [ ] Goals can be removed
-   [ ] Goals are linked to habits
-   [ ] User data is isolated from other users

### Technical

-   [ ] React frontend works
-   [ ] Node.js + TypeScript backend works
-   [ ] MySQL database works
-   [ ] Database migrations/bootstrap run automatically
-   [ ] Docker Compose starts the complete stack
-   [ ] No local runtime/database installation is required
-   [ ] `.env.example` exists
-   [ ] Real secrets are excluded
-   [ ] `README.md` contains exact setup commands
-   [ ] Core business logic is tested
-   [ ] Git history contains meaningful commits

------------------------------------------------------------------------

## 21. Architectural Priorities

The project should prioritize the following in order:

``` text
Correctness
    >
Security / Data Ownership
    >
Completeness
    >
Maintainability
    >
Deployment Reliability
    >
UI Polish
```

The goal is not to maximize the number of features. The goal is to
deliver a complete, reliable, understandable implementation of the
requirements with a simple deployment process.

------------------------------------------------------------------------

## 22. Requirements Traceability

  Requirement                     Architectural Response
  ------------------------------- --------------------------------
  Build positive habits           Habit module with `BUILD` type
  Daily completion                Habit records
  Consecutive streak              Backend streak service
  Weekly completion rate          Backend statistics service
  Missed days                     Weekly statistics
  Break negative habits           Habit module with `BREAK` type
  Clean streak                    Daily records + streak service
  Relapse resets streak           Break-habit business rule
  Add/edit/remove goals           Goal module
  Goal linked to habit            `goals.habit_id` relationship
  React frontend                  Frontend container
  Node.js + TypeScript            Backend container
  MySQL                           Database container
  Email/password authentication   Authentication module
  Logout                          Authentication module clears the HttpOnly cookie
  Docker Compose                  Root `compose.yml`
  Automatic schema bootstrap      Database migration process
  `.env.example`                  Repository configuration
  README setup instructions       Documentation
  Meaningful Git history          Incremental feature commits

------------------------------------------------------------------------

## 23. Documentation Authority

When documents conflict, use this precedence order:

``` text
1. Original coding-test requirements
2. docs/business-rules.md
3. docs/api-design.md
4. docs/data-model.md
5. docs/architecture.md
6. docs/task-breakdown.md
7. README.md
```

Lower-priority documents should summarize or link to authoritative rules
rather than define conflicting behavior.

------------------------------------------------------------------------

## 24. Design Principle

Keep the implementation simple enough for a coding test while applying
production-oriented engineering practices where they directly improve
correctness, security, maintainability, and deployability.

Avoid adding architectural complexity that is not justified by the
requirements.

## 25. Timezone Strategy

Habit Shaper is date-sensitive, so timezone handling is an architectural concern.

### Canonical Timezone

The application uses one canonical timezone configured through:

```env
APP_TIMEZONE=Asia/Jakarta
```

For the initial coding-test deployment, `Asia/Jakarta` is the recommended default.

The business timezone must not be inferred from:

- Browser locale
- Host machine timezone
- Docker container timezone
- MySQL server timezone

### Storage Strategy

Daily habit tracking:

```text
record_date -> MySQL DATE
```

System metadata:

```text
created_at
updated_at
```

are timestamps handled consistently by the backend and ORM.

`record_date` intentionally represents a calendar date, not an instant in time.

### Resolving "Today"

The backend is authoritative for determining today's application date.

```text
Current instant
    |
    v
APP_TIMEZONE
    |
    v
Application calendar date
    |
    v
record_date
```

For a standard "track today" action, the frontend should not decide the authoritative date independently.

### Weekly Boundaries

Weeks are defined as:

```text
Monday -> Sunday
```

in `APP_TIMEZONE`.

The backend resolves week boundaries before querying `habit_records`.

### API Date Format

Calendar dates:

```text
YYYY-MM-DD
```

Example:

```text
2026-09-07
```

Timestamps exposed through APIs should use ISO 8601.

### Docker

Containers may be configured consistently, but application business logic must explicitly use `APP_TIMEZONE`.

The container/system timezone is not the domain rule.

### Why This Strategy

It prevents:

- UTC midnight shifting a habit into the wrong calendar day
- Browser timezone differences producing inconsistent streaks
- Different deployment locations changing weekly boundaries
- Docker/container timezone settings changing business results

### Future Multi-Timezone Support

The initial scope assumes one application timezone.

If per-user timezone support is added later:

```text
users.timezone
```

can be introduced.

That is a product-level change because it affects:

- "Today"
- Streak boundaries
- Weekly boundaries
- Historical interpretation
- API behavior
