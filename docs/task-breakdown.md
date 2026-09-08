# Habit Shaper Task Breakdown

## 1. Purpose

This document breaks the Habit Shaper coding test into implementation tasks that can be completed incrementally, reviewed independently, and reflected clearly in Git history.

The task order is designed to reduce rework by completing architecture, data integrity, backend business logic, and Docker reliability before UI polish.

Primary objectives:

- Complete all required features end-to-end
- Keep business rules consistent with `docs/business-rules.md`
- Keep API behavior consistent with `docs/api-design.md`
- Keep persistence consistent with `docs/data-model.md`
- Keep architecture consistent with `docs/architecture.md`
- Maintain meaningful Git history
- Ensure the whole application runs through Docker Compose

---

# 2. Delivery Strategy

Recommended implementation sequence:

```text
Planning
   ↓
Repository Setup
   ↓
Docker + MySQL
   ↓
Prisma Schema
   ↓
Authentication
   ↓
Habit CRUD
   ↓
Daily Tracking
   ↓
Streak Logic
   ↓
Weekly Statistics
   ↓
Goal Management
   ↓
Frontend Authentication
   ↓
Frontend Habits
   ↓
Frontend Tracking
   ↓
Frontend Goals
   ↓
Testing
   ↓
Docker Verification
   ↓
Documentation
   ↓
Final Review
```

Historical tracking API, tracking-history API, and historical-correction UI
are deferred P1 enhancements performed only after the complete P0 workflow is
working and verified.

Priority rule:

```text
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

---

# 3. Phase 0 - Planning and Documentation

## Task 0.1 - Confirm Functional Scope

### Checklist

- [x] Confirm build habit requirements
- [x] Confirm break habit requirements
- [x] Confirm goal requirements
- [x] Confirm email/password authentication
- [x] Confirm MySQL requirement
- [x] Confirm React requirement
- [x] Confirm Node.js + TypeScript requirement
- [x] Confirm Docker Compose requirement
- [x] Confirm automatic database bootstrap requirement

### Deliverables

```text
docs/architecture.md
docs/data-model.md
docs/business-rules.md
docs/api-design.md
docs/task-breakdown.md
```

### Done When

All required behavior has an explicit technical interpretation before coding begins.

### Suggested Commit

```text
docs: define system architecture and implementation plan
```

---

## Task 0.2 - Lock Technical Stack

### Frontend

- [x] React
- [x] TypeScript
- [x] Vite
- [x] React Router
- [x] TanStack Query
- [x] React Hook Form
- [x] Zod
- [x] Tailwind CSS
- [x] shadcn/ui
- [x] Lucide React

### Backend

- [x] Node.js
- [x] TypeScript
- [x] Express
- [x] Zod
- [x] Prisma ORM
- [x] JWT
- [x] HttpOnly Cookie
- [x] bcrypt

### Database

- [x] MySQL
- [x] Prisma Migrate

### Testing

- [x] Vitest
- [x] Supertest

### Infrastructure

- [x] Docker
- [x] Docker Compose

### Done When

No major stack decision remains unresolved.

---

# 4. Phase 1 - Repository Initialization

## Task 1.1 - Create Repository Structure

### Checklist

- [x] Create `frontend/`
- [x] Create `backend/`
- [x] Create `docs/`
- [x] Add root `README.md`
- [x] Add root `.gitignore`
- [x] Add `.env.example`
- [x] Add root `compose.yml`

### Target Structure

```text
habit-shaper/
│
├── frontend/
├── backend/
├── docs/
│   ├── architecture.md
│   ├── data-model.md
│   ├── business-rules.md
│   ├── api-design.md
│   └── task-breakdown.md
├── compose.yml
├── .env.example
├── .gitignore
└── README.md
```

### Suggested Commit

```text
chore: initialize project structure
```

---

## Task 1.2 - Initialize Frontend

### Checklist

- [x] Initialize Vite React TypeScript project
- [x] Install React Router
- [x] Install TanStack Query
- [x] Install React Hook Form
- [x] Install Zod
- [x] Install Tailwind CSS
- [x] Configure shadcn/ui
- [x] Install Lucide React
- [x] Configure ESLint
- [x] Configure formatting
- [x] Verify production build

### Done When

```bash
npm run build
```

passes inside the frontend project.

### Suggested Commit

```text
chore(frontend): initialize react application
```

---

## Task 1.3 - Initialize Backend

### Checklist

- [x] Initialize Node.js TypeScript project
- [x] Install Express
- [x] Install Zod
- [x] Install Prisma
- [x] Install Prisma Client
- [x] Install bcrypt
- [x] Install JWT library
- [x] Add cookie parser
- [x] Configure CORS
- [x] Configure TypeScript
- [x] Configure ESLint
- [x] Configure Vitest
- [x] Configure Supertest
- [x] Add basic health endpoint

### Health Endpoint

```http
GET /health
```

Expected:

```json
{
  "status": "ok"
}
```

### Suggested Commit

```text
chore(backend): initialize express typescript application
```

---

# 5. Phase 2 - Docker and Database Foundation

## Task 2.1 - Create MySQL Service

### Checklist

- [x] Add MySQL service to `compose.yml`
- [x] Add persistent database volume
- [x] Add healthcheck
- [x] Configure database environment variables
- [x] Confirm backend can resolve MySQL service by Docker service name

### Done When

MySQL becomes healthy through Docker Compose without local MySQL installation.

### Suggested Commit

```text
chore: configure mysql docker service
```

---

## Task 2.2 - Create Backend Dockerfile

### Checklist

- [x] Create backend Dockerfile
- [x] Install dependencies inside container
- [x] Build TypeScript
- [x] Configure startup command
- [x] Add database readiness strategy
- [x] Ensure migrations run before API startup

### Done When

Backend starts through Docker Compose only.

### Suggested Commit

```text
chore(backend): add docker configuration
```

---

## Task 2.3 - Create Frontend Dockerfile

### Checklist

- [x] Create frontend Dockerfile
- [x] Configure frontend API URL
- [x] Ensure frontend can reach backend
- [x] Verify frontend starts through Docker Compose

### Suggested Commit

```text
chore(frontend): add docker configuration
```

---

# 6. Phase 3 - Prisma Data Model

## Task 3.1 - Define Prisma Models

### Models

- [x] `User`
- [x] `Habit`
- [x] `HabitRecord`
- [x] `Goal`

### Enums

- [x] `HabitType`
- [x] `HabitRecordStatus`

### Required Constraints

- [x] Unique user email
- [x] Foreign key Habit -> User
- [x] Foreign key HabitRecord -> Habit
- [x] Foreign key Goal -> User
- [x] Foreign key Goal -> Habit
- [x] `UNIQUE(habit_id, record_date)`
- [x] Cascade delete rules
- [x] Required indexes

### Suggested Commit

```text
feat(database): define prisma data model
```

---

## Task 3.2 - Create Initial Migration

### Checklist

- [x] Generate initial Prisma migration
- [x] Commit migration files
- [x] Apply migration automatically in container startup
- [x] Verify empty database bootstraps successfully

### Suggested Commit

```text
feat(database): add initial migration
```

---

## Task 3.3 - Verify Database Constraints

### Test Cases

- [x] Duplicate email rejected
- [x] Duplicate habit record for same habit/date rejected
- [x] Habit requires valid user
- [x] HabitRecord requires valid habit
- [x] Goal requires valid user
- [x] Goal requires valid habit
- [x] Deleting habit removes dependent records
- [x] Deleting user removes owned data

### Suggested Commit

```text
test(database): verify relational constraints
```

---

# 7. Phase 4 - Backend Shared Foundation

## Task 4.1 - Environment Configuration

### Checklist

- [x] Parse environment variables
- [x] Validate required variables at startup
- [x] Add `APP_TIMEZONE`
- [x] Add authentication secret
- [x] Add frontend origin
- [x] Add database configuration

### Suggested Commit

```text
chore(backend): add validated environment configuration
```

---

## Task 4.2 - Central Error Handling

### Checklist

- [ ] Create application error type
- [ ] Create error middleware
- [ ] Define stable error codes
- [ ] Hide internal stack/database details in production responses
- [ ] Handle unknown routes

### Response Shape

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Suggested Commit

```text
feat(backend): add centralized error handling
```

---

## Task 4.3 - Validation Middleware

### Checklist

- [x] Add reusable Zod validation
- [x] Support body validation
- [x] Support params validation
- [x] Support query validation
- [x] Return consistent validation errors

### Suggested Commit

```text
feat(backend): add request validation middleware
```

---

# 8. Phase 5 - Authentication

## Task 5.1 - Register User

### Endpoint

```http
POST /api/auth/register
```

### Checklist

- [x] Validate email
- [x] Normalize email
- [x] Enforce the API password policy: 8-72 characters with no character-class requirement
- [x] Reject duplicate email
- [x] Hash password using bcrypt
- [x] Persist user
- [x] Never return password hash

### Tests

- [x] Valid registration
- [x] Invalid email
- [x] Invalid password
- [x] Duplicate email
- [x] Password stored as hash

### Suggested Commit

```text
feat(auth): implement user registration
```

---

## Task 5.2 - Login

### Endpoint

```http
POST /api/auth/login
```

### Checklist

- [x] Find normalized email
- [x] Compare password
- [x] Return generic invalid-credentials error
- [x] Generate JWT
- [x] Store JWT in HttpOnly cookie
- [x] Apply environment-specific cookie settings

### Tests

- [x] Successful login
- [x] Wrong password
- [x] Unknown email
- [x] Cookie issued on success
- [x] Password/JWT not exposed in JSON response

### Suggested Commit

```text
feat(auth): implement login with http-only cookie
```

---

## Task 5.3 - Authentication Middleware

### Checklist

- [x] Read authentication cookie
- [x] Verify JWT
- [x] Attach authenticated user context
- [x] Reject missing/invalid authentication
- [x] Never trust client-provided `userId`

### Suggested Commit

```text
feat(auth): add authentication middleware
```

---

## Task 5.4 - Current User and Logout

### Endpoints

```http
GET  /api/auth/me
POST /api/auth/logout
```

### Checklist

- [x] Return current user
- [x] Clear authentication cookie on logout

### Suggested Commit

```text
feat(auth): add current-user and logout endpoints
```

---

# 9. Phase 6 - Habit Management Backend

## Task 6.1 - Habit Repository

### Checklist

- [x] Find all habits by authenticated user
- [x] Filter habits by type
- [x] Find habit by ID and owner
- [x] Create habit
- [x] Update habit
- [x] Delete habit

### Suggested Commit

```text
feat(habits): add habit repository
```

---

## Task 6.2 - Habit CRUD

### Endpoints

```http
GET    /api/habits
POST   /api/habits
GET    /api/habits/:habitId
PATCH  /api/habits/:habitId
DELETE /api/habits/:habitId
```

### Checklist

- [x] List current user's habits
- [x] Filter by BUILD/BREAK
- [x] Create BUILD habit
- [x] Create BREAK habit
- [x] Retrieve owned habit
- [x] Update owned habit
- [x] Delete owned habit
- [x] Prevent cross-user access
- [x] Keep habit type immutable after creation
- [x] PATCH accepts only `name` and `description`
- [x] PATCH rejects `type`, `userId`, `createdAt`, and owner fields

### Tests

- [x] User A sees only User A habits
- [x] User B cannot access User A habit
- [x] Invalid type rejected
- [x] Delete cascades correctly

### Suggested Commit

```text
feat(habits): implement habit management
```

---

# 10. Phase 7 - Daily Habit Tracking Backend

## Task 7.1 - Habit Record Repository

### Checklist

- [x] Find record by habit/date
- [x] Upsert habit/date record
- [x] Query records by date range
- [x] Query ordered history
- [x] Scope access through owned habit

### Suggested Commit

```text
feat(tracking): add habit record repository
```

---

## Task 7.2 - Track Today

### Endpoint

```http
PUT /api/habits/:habitId/today
```

### Checklist

- [x] Verify habit ownership
- [x] Resolve today using `APP_TIMEZONE`
- [x] Validate status
- [x] Create first record
- [x] Update existing record
- [x] Prevent duplicate daily rows

### Suggested Commit

```text
feat(tracking): implement daily habit tracking
```

---

## Task 7.3 - Historical Tracking (Deferred P1)

Priority: `P1`. Do not delay P0 streak, statistics, and daily-tracking work
for this enhancement.

### Endpoint

```http
PUT /api/habits/:habitId/records/:date
```

### Checklist

- [x] Validate `YYYY-MM-DD`
- [x] Reject dates before the habit creation date in `APP_TIMEZONE`
- [x] Reject future dates
- [x] Verify habit ownership
- [x] Upsert historical record
- [x] Return normalized date format

### Suggested Commit

```text
feat(tracking): support historical habit corrections (P1)
```

---

## Task 7.4 - List Tracking History (Deferred P1)

Priority: `P1`. This supports history and historical-correction UI and is not
required for the minimum P0 workflow.

### Endpoint

```http
GET /api/habits/:habitId/records
```

### Checklist

- [x] Support `from`
- [x] Support `to`
- [x] Validate date range
- [x] Return ordered records
- [x] Enforce ownership

### Suggested Commit

```text
feat(tracking): add habit history endpoint (P1)
```

---

# 11. Phase 8 - Streak Business Logic

## Task 8.1 - Build Streak Calculator

### Rules

```text
SUCCESS continues streak
FAILURE breaks streak
missing past day breaks streak
untracked today remains pending
dates before habit creation are excluded
```

### Tests

- [x] Single success = 1
- [x] Consecutive success = N
- [x] Failure resets
- [x] Missing past date breaks streak
- [x] Today missing does not immediately break previous streak
- [x] Historical correction recalculates streak
- [x] Dates before habit creation do not break the streak

### Suggested Commit

```text
feat(habits): implement build streak calculation
```

---

## Task 8.2 - Break Habit Clean Streak

### Rules

```text
SUCCESS = clean
FAILURE = relapse
missing past day cannot extend clean streak
today without record = pending
```

### Tests

- [x] One clean day
- [x] Multiple clean days
- [x] Relapse resets streak
- [x] New clean day after relapse starts at 1
- [x] Missing past day breaks continuity

### Suggested Commit

```text
feat(habits): implement clean streak calculation
```

---

# 12. Phase 9 - Weekly Statistics

## Task 9.1 - Week Boundary Utility

### Checklist

- [x] Week starts Monday
- [x] Week ends Sunday
- [x] Resolve boundaries using `APP_TIMEZONE`
- [x] Convert habit `createdAt` to `APP_TIMEZONE` before extracting its creation date
- [x] Avoid browser/server timezone dependency

### Suggested Commit

```text
feat(stats): add timezone-aware week calculation
```

---

## Task 9.2 - Build Weekly Completion

### Rules

```text
SUCCESS = completed
FAILURE = missed
untracked past eligible day = missed
today without record = pending
future day = excluded
dates before habit creation = excluded
```

Formula:

```text
completionRate =
completedDays / eligibleDays * 100
```

### Tests

- [ ] Historical full week
- [ ] Current partial week
- [ ] Missing past day counted as missed
- [ ] Dates before habit creation excluded from eligible and missed days
- [ ] Today pending excluded
- [ ] No eligible days returns 0 safely
- [ ] `2 / 3` rounds to numeric `66.7`
- [ ] Completion rate is not returned as a percent string

### Suggested Commit

```text
feat(stats): implement weekly completion metrics
```

---

## Task 9.3 - Habit Statistics Endpoint

### Endpoint

```http
GET /api/habits/:habitId/stats
```

### BUILD Response

- [ ] current streak
- [ ] week start
- [ ] week end
- [ ] completed days
- [ ] missed days
- [ ] eligible days
- [ ] completion rate

### BREAK Response

- [ ] current clean streak

### Suggested Commit

```text
feat(stats): expose habit statistics endpoint
```

---

# 13. Phase 10 - Goal Management Backend

## Task 10.1 - Goal Repository

### Checklist

- [ ] List goals by user
- [ ] Find goal by owner
- [ ] Create goal
- [ ] Update goal
- [ ] Delete goal

### Suggested Commit

```text
feat(goals): add goal repository
```

---

## Task 10.2 - Goal CRUD

### Endpoints

```http
GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:goalId
DELETE /api/goals/:goalId
```

### Checklist

- [ ] Create linked goal
- [ ] Verify habit exists
- [ ] Verify habit belongs to current user
- [ ] Update linked habit safely
- [ ] Delete goal
- [ ] List only current user's goals
- [ ] Prevent cross-user access

### Tests

- [ ] Valid linked goal
- [ ] Foreign user's habit rejected
- [ ] Foreign user's goal inaccessible
- [ ] Update to another owned habit succeeds

### Suggested Commit

```text
feat(goals): implement goal management
```

---

# 14. Phase 11 - Frontend Foundation

## Task 11.1 - Application Providers

### Checklist

- [ ] React Router
- [ ] TanStack Query provider
- [ ] Global error boundary if used
- [ ] API client
- [ ] Cookie credentials enabled

### Suggested Commit

```text
feat(frontend): configure app providers and api client
```

---

## Task 11.2 - Routing

### Routes

```text
/login
/register
/dashboard
/habits
/habits/:habitId
/goals
```

### Checklist

- [ ] Public routes
- [ ] Protected routes
- [ ] Not-found route
- [ ] Authentication loading state

### Suggested Commit

```text
feat(frontend): add application routing
```

---

# 15. Phase 12 - Frontend Authentication

## Task 12.1 - Register Page

### Checklist

- [ ] Email field
- [ ] Password field
- [ ] Client-side Zod validation
- [ ] Server validation handling
- [ ] Duplicate email handling
- [ ] Link to login

### Suggested Commit

```text
feat(frontend): build registration flow
```

---

## Task 12.2 - Login Page

### Checklist

- [ ] Email field
- [ ] Password field
- [ ] Invalid credentials handling
- [ ] Redirect after login
- [ ] Fetch current user

### Suggested Commit

```text
feat(frontend): build login flow
```

---

## Task 12.3 - Logout

### Checklist

- [ ] Logout action
- [ ] Clear cached authenticated state
- [ ] Redirect to login

### Suggested Commit

```text
feat(frontend): add logout flow
```

---

# 16. Phase 13 - Frontend Habit Management

## Task 13.1 - Habit List

### Checklist

- [ ] Fetch habits
- [ ] Separate BUILD/BREAK visually
- [ ] Loading state
- [ ] Empty state
- [ ] Error state

### Suggested Commit

```text
feat(frontend): add habit list
```

---

## Task 13.2 - Create Habit

### Checklist

- [ ] Habit name
- [ ] Optional description
- [ ] BUILD/BREAK selection
- [ ] Validation
- [ ] Query invalidation after create

### Suggested Commit

```text
feat(frontend): add habit creation
```

---

## Task 13.3 - Edit and Delete Habit

### Checklist

- [ ] Edit name
- [ ] Edit description
- [ ] Do not allow type conversion
- [ ] Delete confirmation
- [ ] Refresh related UI state

### Suggested Commit

```text
feat(frontend): add habit edit and delete actions
```

---

# 17. Phase 14 - Frontend Daily Tracking and Statistics

## Task 14.1 - Build Habit Tracking UI

### Checklist

- [ ] "Completed today" action
- [ ] Missed/failure action if exposed
- [ ] Pending state
- [ ] Current streak display
- [ ] Weekly completion display
- [ ] Missed-day display

### Suggested Commit

```text
feat(frontend): add build habit tracking
```

---

## Task 14.2 - Break Habit Tracking UI

### Checklist

- [ ] "Still clean" action
- [ ] "Relapsed" action
- [ ] Confirmation for relapse if useful
- [ ] Clean streak display
- [ ] Current daily state

### Suggested Commit

```text
feat(frontend): add break habit tracking
```

---

## Task 14.3 - Habit Detail Page

### Checklist

- [ ] Habit information
- [ ] Daily state
- [ ] Tracking history (P1; omit from the P0 detail view)
- [ ] Statistics
- [ ] Appropriate BUILD/BREAK labels

### Suggested Commit

```text
feat(frontend): build habit detail page
```

---

# 18. Phase 15 - Frontend Goal Management

## Task 15.1 - Goals Page

### Checklist

- [ ] List goals
- [ ] Show linked habit
- [ ] Loading state
- [ ] Empty state

### Suggested Commit

```text
feat(frontend): add goals page
```

---

## Task 15.2 - Create Goal

### Checklist

- [ ] Select owned habit
- [ ] Goal title
- [ ] Optional description
- [ ] Validation
- [ ] Refresh list

### Suggested Commit

```text
feat(frontend): add goal creation
```

---

## Task 15.3 - Edit and Delete Goal

### Checklist

- [ ] Edit title
- [ ] Edit description
- [ ] Change to another owned habit
- [ ] Delete goal
- [ ] Confirmation where appropriate

### Suggested Commit

```text
feat(frontend): add goal edit and delete actions
```

---

# 19. Phase 16 - Dashboard

## Task 16.1 - Dashboard Data

### Checklist

- [ ] Fetch habits
- [ ] Fetch relevant statistics
- [ ] Fetch goals if needed
- [ ] Avoid unnecessary duplicate API requests

### Suggested Commit

```text
feat(frontend): integrate dashboard data
```

---

## Task 16.2 - Dashboard UI

### BUILD Card

- [ ] Habit name
- [ ] Today's status
- [ ] Current streak
- [ ] Weekly completion

### BREAK Card

- [ ] Habit name
- [ ] Today's clean/relapse status
- [ ] Current clean streak

### General

- [ ] Responsive layout
- [ ] Clean design
- [ ] Clear action hierarchy
- [ ] Useful empty state

### Suggested Commit

```text
feat(frontend): build habit dashboard
```

---

# 20. Phase 17 - Security Review

## Task 17.1 - Authorization Review

### Checklist

- [ ] No endpoint trusts client-provided `userId`
- [ ] Habit queries are ownership-scoped
- [ ] Goal queries are ownership-scoped
- [ ] Habit record access goes through owned habit
- [ ] Foreign resource IDs return non-leaking responses
- [ ] Goal-habit ownership validated

### Suggested Commit

```text
fix(security): enforce resource ownership rules
```

---

## Task 17.2 - Authentication Security

### Checklist

- [ ] Passwords hashed
- [ ] Password hash never returned
- [ ] Invalid login response does not reveal account existence
- [ ] JWT not exposed to frontend JavaScript
- [ ] HttpOnly enabled
- [ ] Secure enabled in production
- [ ] CORS restricted
- [ ] Credentials configured correctly

### Suggested Commit

```text
fix(security): harden authentication configuration
```

---

## Task 17.3 - Input and Error Security

### Checklist

- [ ] Zod validates public inputs
- [ ] Internal Prisma errors not leaked
- [ ] Stack traces not returned in production
- [ ] Secrets not logged
- [ ] Passwords not logged
- [ ] Cookies/tokens not logged

---

# 21. Phase 18 - Backend Testing

These are P0 critical automated tests. P0 is not complete until this suite
passes.

## Task 18.1 - Authentication Tests

- [ ] Registration success
- [ ] Duplicate email
- [ ] Login success
- [ ] Invalid credentials
- [ ] Protected endpoint without authentication
- [ ] Logout clears the authentication cookie

---

## Task 18.2 - Habit Tests

- [ ] Create BUILD
- [ ] Create BREAK
- [ ] List
- [ ] Update
- [ ] Delete
- [ ] User cannot access another user's habit
- [ ] User cannot update another user's habit
- [ ] User cannot delete another user's habit
- [ ] User cannot access another user's goal
- [ ] Goal cannot link to another user's habit

---

## Task 18.3 - Tracking Tests

- [ ] Track today
- [ ] Repeated PUT updates the same daily record
- [ ] Duplicate habit/date row is not created

---

## Task 18.4 - Business Logic Tests

- [ ] Build streak
- [ ] Break clean streak
- [ ] Relapse resets clean streak
- [ ] Missing past eligible day breaks streak
- [ ] Untracked today remains pending
- [ ] Dates before habit creation are excluded
- [ ] Weekly completion
- [ ] Weekly missed days
- [ ] Weekly eligible days
- [ ] `completionRate` rounding

### Suggested Commit

```text
test: add core backend integration tests
```

### P1 Extended Testing

- [ ] Historical tracking integration tests
- [ ] Tracking-history endpoint tests
- [ ] Historical correction tests
- [ ] Extended backend/API integration coverage

---

# 22. Phase 19 - Frontend Quality

## Task 19.1 - UX States

Every async screen/action should handle:

- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Success feedback
- [ ] Disabled submit while pending

---

## Task 19.2 - Responsive Review

### Checklist

- [ ] Desktop
- [ ] Tablet
- [ ] Mobile-width browser
- [ ] No overflow
- [ ] Forms remain usable
- [ ] Actions remain visible

---

## Task 19.3 - Accessibility Basics

### Checklist

- [ ] Form labels
- [ ] Button labels
- [ ] Keyboard-accessible controls
- [ ] Dialog focus behavior
- [ ] Error messages associated with inputs

### Suggested Commit

```text
fix(frontend): improve ux and accessibility states
```

---

# 23. Phase 20 - Docker Verification

## Task 20.1 - Fresh Environment Test

Run:

```bash
docker compose down -v
docker compose up --build
```

### Verify

- [ ] MySQL starts
- [ ] MySQL healthcheck passes
- [ ] Migrations run automatically
- [ ] Backend starts
- [ ] Frontend starts
- [ ] Registration works
- [ ] Login works
- [ ] Habit creation works
- [ ] Tracking works
- [ ] Goal creation works

No manual:

```text
npm install
prisma migrate
mysql setup
```

should be required outside the containers.

### Suggested Commit

```text
fix(docker): ensure clean one-command startup
```

---

# 24. Phase 21 - Documentation Finalization

## Task 21.1 - README

### Checklist

- [ ] Project overview
- [ ] Features
- [ ] Tech stack
- [ ] Prerequisites
- [ ] Exact startup commands
- [ ] Environment setup
- [ ] Ports
- [ ] Testing commands
- [ ] Documentation links

---

## Task 21.2 - Architecture Documentation

### Checklist

- [ ] Frontend architecture
- [ ] Backend architecture
- [ ] Authentication flow
- [ ] Database interaction
- [ ] API structure
- [ ] Docker architecture
- [ ] Error handling
- [ ] Security assumptions
- [ ] Timezone strategy

---

## Task 21.3 - Data Model Documentation

### Checklist

- [ ] Entities
- [ ] ERD
- [ ] Relationships
- [ ] Constraints
- [ ] Indexes
- [ ] Cascade rules
- [ ] Prisma model
- [ ] Source-of-truth decisions

---

## Task 21.4 - API Documentation

### Checklist

- [ ] Endpoints
- [ ] Request shapes
- [ ] Response shapes
- [ ] Error format
- [ ] Authorization rules
- [ ] Status codes
- [ ] Date contract

### Suggested Commit

```text
docs: finalize project documentation
```

---

# 25. Phase 22 - Final QA

## Functional Checklist

### Authentication

- [ ] Register
- [ ] Login
- [ ] Current user
- [ ] Logout

### Habit Building

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete
- [ ] Track daily completion
- [ ] Current streak
- [ ] Weekly completion rate
- [ ] Missed days

### Habit Breaking

- [ ] Create
- [ ] Track clean day
- [ ] Track relapse
- [ ] Clean streak resets correctly

### Goals

- [ ] Create
- [ ] Edit
- [ ] Delete
- [ ] Link to BUILD habit
- [ ] Link to BREAK habit

---

## Technical Checklist

- [ ] TypeScript passes
- [ ] Lint passes
- [ ] Tests pass
- [ ] Frontend production build passes
- [ ] Backend production build passes
- [ ] Docker clean boot passes
- [ ] Migrations run automatically
- [ ] No secrets committed
- [ ] `.env.example` complete
- [ ] `node_modules` excluded
- [ ] Build artifacts excluded
- [ ] Git history is meaningful

---

# 26. Suggested Git Commit Story

A strong final Git history could look like:

```text
docs: define system architecture and implementation plan

chore: initialize project structure
chore(frontend): initialize react application
chore(backend): initialize express typescript application

chore: configure mysql docker service
chore(backend): add docker configuration
chore(frontend): add docker configuration

feat(database): define prisma data model
feat(database): add initial migration
test(database): verify relational constraints

chore(backend): add validated environment configuration
feat(backend): add centralized error handling
feat(backend): add request validation middleware

feat(auth): implement user registration
feat(auth): implement login with http-only cookie
feat(auth): add authentication middleware
feat(auth): add current-user and logout endpoints

feat(habits): add habit repository
feat(habits): implement habit management

feat(tracking): add habit record repository
feat(tracking): implement daily habit tracking

feat(habits): implement build streak calculation
feat(habits): implement clean streak calculation

feat(stats): add timezone-aware week calculation
feat(stats): implement weekly completion metrics
feat(stats): expose habit statistics endpoint

feat(goals): add goal repository
feat(goals): implement goal management

feat(frontend): configure app providers and api client
feat(frontend): add application routing
feat(frontend): build registration flow
feat(frontend): build login flow
feat(frontend): add logout flow

feat(frontend): add habit list
feat(frontend): add habit creation
feat(frontend): add habit edit and delete actions
feat(frontend): add build habit tracking
feat(frontend): add break habit tracking
feat(frontend): build habit detail page

feat(frontend): add goals page
feat(frontend): add goal creation
feat(frontend): add goal edit and delete actions

feat(frontend): integrate dashboard data
feat(frontend): build habit dashboard

test: add core backend integration tests
fix(security): enforce resource ownership rules
fix(frontend): improve ux and accessibility states
fix(docker): ensure clean one-command startup

# Optional P1 work after P0 verification
feat(tracking): support historical habit corrections
feat(tracking): add habit history endpoint

docs: finalize project documentation
```

The actual commit sequence may differ as implementation evolves. Avoid fabricating artificial commits after the fact. Commits should reflect real development progress.

---

# 27. Minimum Viable Submission

If time becomes limited, complete work in this order:

```text
P0 - Must Have
```

- [ ] Docker Compose
- [ ] MySQL + automatic migrations
- [ ] Register
- [ ] Login
- [ ] Logout
- [ ] Habit CRUD
- [ ] Build daily tracking
- [ ] Build streak
- [ ] Weekly completion
- [ ] Missed days
- [ ] Break habit clean tracking
- [ ] Relapse
- [ ] Clean streak
- [ ] Goal CRUD
- [ ] Basic usable React UI
- [ ] Ownership/security
- [ ] Critical automated tests
- [ ] README
- [ ] Fresh Docker test

```text
P1 - Strong Submission
```

- [ ] Extended backend/API integration coverage
- [ ] Better error states
- [ ] Historical correction API
- [ ] Tracking history API
- [ ] Historical correction UI
- [ ] Responsive polish
- [ ] Accessibility basics
- [ ] Strong documentation

```text
P2 - Optional
```

- [ ] Frontend E2E/browser tests
- [ ] Optional UI-level end-to-end scenarios
- [ ] Advanced logging
- [ ] Rate limiting
- [ ] Additional UI animations
- [ ] Non-required analytics

Do not start P2 work before all P0 requirements are complete.

---

# 28. Final Definition of Done

The project is submission-ready only when a reviewer can:

```text
1. Clone repository
2. Copy .env.example to .env if required
3. Run docker compose up --build
4. Register
5. Login
6. Create a BUILD habit
7. Track it
8. See streak and weekly completion
9. Create a BREAK habit
10. Mark clean days
11. Record relapse
12. See clean streak reset
13. Create/edit/delete a goal
14. Logout
15. Restart the stack without manual database setup
```

and the implementation:

```text
passes tests
enforces ownership
does not expose secrets
has clear documentation
has meaningful Git history
```

That is the target for completion.
