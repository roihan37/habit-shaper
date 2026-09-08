# Habit Shaper Data Model

## 1. Purpose

This document defines the logical data model for Habit Shaper.

The model supports:

- User registration and login
- Positive habit building
- Negative habit breaking
- Daily tracking
- Streak calculation
- Weekly completion statistics
- Relapse handling
- Goal management
- Per-user data ownership
- MySQL persistence through Prisma ORM

The coding-test requirements define the functional scope. The exact schema, constraints, indexes, and persistence decisions below are implementation decisions for this project.

---

## 2. Core Entities

```text
User
Habit
HabitRecord
Goal
```

Relationship overview:

```text
User
 │
 ├──< Habit
 │      │
 │      ├──< HabitRecord
 │      └──< Goal
 │
 └──< Goal
```

Cardinality:

```text
User 1 ---- N Habit
User 1 ---- N Goal
Habit 1 --- N HabitRecord
Habit 1 --- N Goal
```

---

## 3. ERD

```text
+----------------------+
|        users         |
+----------------------+
| PK id                |
| UQ email             |
| password_hash        |
| created_at           |
| updated_at           |
+----------+-----------+
           |
           | 1:N
           v
+----------------------+
|        habits        |
+----------------------+
| PK id                |
| FK user_id           |
| name                 |
| description          |
| type                 |
| created_at           |
| updated_at           |
+----------+-----------+
           |
       +---+---+
       |       |
      1:N     1:N
       |       |
       v       v
+----------------------+    +----------------------+
|    habit_records     |    |        goals         |
+----------------------+    +----------------------+
| PK id                |    | PK id                |
| FK habit_id          |    | FK user_id           |
| record_date          |    | FK habit_id          |
| status               |    | title                |
| created_at           |    | description          |
| updated_at           |    | created_at           |
+----------------------+    | updated_at           |
                            +----------------------+
```

---

## 4. Modeling Principles

1. Every user-owned resource must be attributable to a user.
2. Habit definitions and daily tracking records are stored separately.
3. A habit is either `BUILD` or `BREAK`.
4. A habit can have only one tracking record per calendar date.
5. Streaks are derived from tracking history and are not authoritative stored fields.
6. Weekly completion statistics are derived from habit records.
7. A goal must reference a habit owned by the same user.
8. Database constraints should prevent invalid or duplicate state where practical.
9. Business rules remain in the backend service layer.

---

## 5. Enumerations

### HabitType

```text
BUILD
BREAK
```

- `BUILD`: a positive habit the user wants to establish.
- `BREAK`: a negative habit the user wants to stop.

### HabitRecordStatus

Persistence model:

```text
SUCCESS
FAILURE
```

Interpretation:

For a `BUILD` habit:

```text
SUCCESS = completed
FAILURE = missed
```

For a `BREAK` habit:

```text
SUCCESS = clean day
FAILURE = relapse
```

The API or UI may expose domain-specific labels such as `COMPLETED`, `MISSED`, `CLEAN`, and `RELAPSED`.

---

## 6. users

Stores application users.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String UUID | PK, NOT NULL | User identifier |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Login email |
| `password_hash` | `VARCHAR(255)` | NOT NULL | Hashed password |
| `created_at` | `DATETIME(3)` | NOT NULL | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NOT NULL | Last update timestamp |

Constraints:

```text
PRIMARY KEY (id)
UNIQUE (email)
```

Rules:

- Normalize email before persistence.
- Never store plaintext passwords.
- Never return password hashes through the API.
- Email verification is not required by the test specification.

---

## 7. habits

Stores user-defined habits.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String UUID | PK, NOT NULL | Habit identifier |
| `user_id` | String UUID | FK, NOT NULL | Owner |
| `name` | `VARCHAR(120)` | NOT NULL | Habit name |
| `description` | `TEXT` | NULL | Optional description |
| `type` | `ENUM('BUILD','BREAK')` | NOT NULL | Habit type |
| `created_at` | `DATETIME(3)` | NOT NULL | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NOT NULL | Last update timestamp |

Foreign key:

```text
habits.user_id -> users.id
```

Recommended delete behavior:

```text
ON DELETE CASCADE
```

Indexes:

```text
INDEX (user_id)
INDEX (user_id, type)
```

Habit names are not globally unique. The initial model also does not enforce uniqueness by `(user_id, name)` because the requirement does not state that users cannot create similarly named habits.

---

## 8. habit_records

Stores one daily tracking result for one habit.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String UUID | PK, NOT NULL | Record identifier |
| `habit_id` | String UUID | FK, NOT NULL | Related habit |
| `record_date` | `DATE` | NOT NULL | Calendar date |
| `status` | `ENUM('SUCCESS','FAILURE')` | NOT NULL | Daily outcome |
| `created_at` | `DATETIME(3)` | NOT NULL | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NOT NULL | Last update timestamp |

Foreign key:

```text
habit_records.habit_id -> habits.id
```

Recommended delete behavior:

```text
ON DELETE CASCADE
```

Critical constraint:

```text
UNIQUE (habit_id, record_date)
```

This prevents duplicate daily records.

Example invalid state:

```text
Habit: Read

2026-09-07 SUCCESS
2026-09-07 SUCCESS
```

Typical access patterns:

```text
Find today's record
Get records for a date range
Get records ordered by date
Calculate current streak
Calculate weekly completion
```

The unique constraint already provides an efficient lookup path for `(habit_id, record_date)`, so a duplicate secondary index should not be added without a measured need.

---

## 9. goals

Stores goals linked to habits.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | String UUID | PK, NOT NULL | Goal identifier |
| `user_id` | String UUID | FK, NOT NULL | Goal owner |
| `habit_id` | String UUID | FK, NOT NULL | Linked habit |
| `title` | `VARCHAR(160)` | NOT NULL | Goal title |
| `description` | `TEXT` | NULL | Optional details |
| `created_at` | `DATETIME(3)` | NOT NULL | Creation timestamp |
| `updated_at` | `DATETIME(3)` | NOT NULL | Last update timestamp |

Foreign keys:

```text
goals.user_id  -> users.id
goals.habit_id -> habits.id
```

Recommended behavior:

```text
ON DELETE CASCADE for user_id
ON DELETE CASCADE for habit_id
```

Indexes:

```text
INDEX (user_id)
INDEX (habit_id)
INDEX (user_id, habit_id)
```

Important ownership rule:

```text
goal.user_id == habit.user_id
```

This must be validated in the service layer because separate foreign keys do not guarantee same-user ownership.

---

## 10. Why Streak Is Not Stored

The initial model does not store:

```text
current_streak
longest_streak
weekly_completion_rate
missed_days
```

as authoritative fields.

They are derived from `habit_records`.

Example:

```text
2026-09-01 SUCCESS
2026-09-02 SUCCESS
2026-09-03 FAILURE
2026-09-04 SUCCESS
2026-09-05 SUCCESS
```

Current streak:

```text
2
```

Benefits:

- Prevents stale streak state
- Avoids synchronization bugs
- Keeps tracking history as the source of truth
- Makes relapse behavior deterministic
- Allows historical corrections without manual streak synchronization

If performance later requires caching, derived statistics can be cached without replacing tracking history as the authoritative source.

---

## 11. Build Habit Rules

For `BUILD`:

```text
SUCCESS = completed
FAILURE = missed
```

Example:

```text
Mon  SUCCESS
Tue  SUCCESS
Wed  FAILURE
Thu  SUCCESS
Fri  SUCCESS
```

Current streak on Friday:

```text
2 days
```

Weekly statistics are calculated from records within the selected week.
Unrecorded eligible past dates count as missed. Today without a record is
pending, future dates are excluded, and dates before the habit creation date
are outside the eligibility window. `docs/business-rules.md` is authoritative
for the complete calculation.

---

## 12. Break Habit Rules

For `BREAK`:

```text
SUCCESS = clean day
FAILURE = relapse
```

Example:

```text
Mon  SUCCESS
Tue  SUCCESS
Wed  FAILURE
Thu  SUCCESS
Fri  SUCCESS
```

Current clean streak:

```text
2 days
```

A relapse breaks the clean streak. No separate persisted `streak = 0` update is required because the failure record itself is sufficient to derive the reset.

---

## 13. Date Handling

Daily habit state uses:

```text
record_date DATE
```

instead of relying only on timestamps.

This separates the tracked calendar date from metadata such as `created_at`.

The application uses `APP_TIMEZONE=Asia/Jakarta` as the canonical timezone
for the initial deployment. The backend resolves "today", habit creation
dates, and weekly boundaries using this timezone. Browser, host, container,
and MySQL server timezones are not authoritative for business dates.

The habit creation calendar date is obtained by converting `habits.created_at`
to `APP_TIMEZONE` before extracting the date.

---

## 14. Ownership Model

### Habit

```text
habit.user_id == authenticated_user.id
```

### HabitRecord

```text
record.habit.user_id == authenticated_user.id
```

### Goal

```text
goal.user_id == authenticated_user.id
```

and its linked habit must belong to the same user.

Resource IDs alone must never be treated as authorization.

---

## 15. Referential Integrity

Recommended cascade behavior:

```text
users
  |
  | ON DELETE CASCADE
  v
habits
  |
  | ON DELETE CASCADE
  v
habit_records
```

and:

```text
users
  |
  | ON DELETE CASCADE
  v
goals
```

and:

```text
habits
  |
  | ON DELETE CASCADE
  v
goals
```

This prevents orphaned records.

---

## 16. Prisma Schema Proposal

```prisma
enum HabitType {
  BUILD
  BREAK
}

enum HabitRecordStatus {
  SUCCESS
  FAILURE
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique @db.VarChar(255)
  passwordHash String   @map("password_hash") @db.VarChar(255)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  habits Habit[]
  goals  Goal[]

  @@map("users")
}

model Habit {
  id          String    @id @default(uuid())
  userId      String    @map("user_id")
  name        String    @db.VarChar(120)
  description String?   @db.Text
  type        HabitType
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  user    User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  records HabitRecord[]
  goals   Goal[]

  @@index([userId])
  @@index([userId, type])
  @@map("habits")
}

model HabitRecord {
  id         String            @id @default(uuid())
  habitId    String            @map("habit_id")
  recordDate DateTime          @map("record_date") @db.Date
  status     HabitRecordStatus
  createdAt  DateTime          @default(now()) @map("created_at")
  updatedAt  DateTime          @updatedAt @map("updated_at")

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, recordDate])
  @@map("habit_records")
}

model Goal {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  habitId     String   @map("habit_id")
  title       String   @db.VarChar(160)
  description String?  @db.Text
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([habitId])
  @@index([userId, habitId])
  @@map("goals")
}
```

This is a proposed schema and should be validated against the exact Prisma and MySQL versions selected during project initialization.

---

## 17. Query Patterns

### Get user's habits

```text
WHERE user_id = ?
ORDER BY created_at DESC
```

### Get habits by type

```text
WHERE user_id = ?
AND type = ?
```

### Find one daily record

```text
WHERE habit_id = ?
AND record_date = ?
```

### Get weekly records

```text
WHERE habit_id = ?
AND record_date BETWEEN ? AND ?
ORDER BY record_date ASC
```

### Get current streak input

```text
WHERE habit_id = ?
AND record_date <= ?
ORDER BY record_date DESC
```

The service layer determines where the current consecutive sequence stops.

### Get goals

```text
WHERE user_id = ?
```

---

## 18. API-to-Database Mapping

```text
POST /api/auth/register
    -> users

POST /api/auth/login
    -> users (read)

GET /api/auth/me
    -> users (read authenticated user)

POST /api/auth/logout
    -> no database write
    -> clears authentication cookie

GET /api/habits
    -> habits

POST /api/habits
    -> habits

GET /api/habits/:habitId
    -> habits

PATCH /api/habits/:habitId
    -> habits

DELETE /api/habits/:habitId
    -> habits
    -> cascade habit_records/goals

PUT /api/habits/:habitId/today
    -> habit_records (upsert)

P1 optional historical tracking/history endpoints:

PUT /api/habits/:habitId/records/:date
    -> habit_records (upsert)

GET /api/habits/:habitId/records
    -> habit_records

GET /api/habits/:habitId/stats
    -> habit_records
    -> derived statistics

GET /api/goals
    -> goals

POST /api/goals
    -> goals

PATCH /api/goals/:goalId
    -> goals

DELETE /api/goals/:goalId
    -> goals
```

---

## 19. Validation Rules

### User

```text
email
- required
- valid email
- normalized

password
- required
- minimum 8 characters
- maximum 72 characters
- no uppercase, number, or special-character requirement
- whitespace is allowed and the password is not trimmed
```

### Habit

```text
name
- required
- trimmed
- max 120 characters

description
- optional

type
- BUILD or BREAK
```

### Habit Record

```text
recordDate
- required or inferred by a "track today" endpoint
- valid calendar date
- on or after the habit creation date in APP_TIMEZONE
- not later than today in APP_TIMEZONE

status
- SUCCESS or FAILURE
```

### Goal

```text
title
- required
- trimmed
- max 160 characters

habitId
- required
- must reference a habit owned by the authenticated user
```

---

## 20. Transaction Assumptions

Most operations are single-resource CRUD operations and do not need explicit multi-step transactions.

Transactions should be used when a use case introduces multiple writes that must succeed or fail together.

Do not wrap every simple operation in a transaction without a consistency requirement.

---

## 21. Data Integrity Checklist

- [ ] `users.email` is unique
- [ ] Passwords are stored only as hashes
- [ ] Every habit references an existing user
- [ ] Every habit record references an existing habit
- [ ] Every goal references an existing user
- [ ] Every goal references an existing habit
- [ ] A habit has at most one record per calendar date
- [ ] User ownership is checked in backend services
- [ ] Goal-habit ownership consistency is validated
- [ ] Habit deletion does not leave orphaned records
- [ ] User deletion does not leave orphaned records
- [ ] Streak is derived from tracking history
- [ ] Weekly completion is derived from tracking history
- [ ] Date interpretation is consistent across API and database
- [ ] Prisma migrations are committed to Git

---

## 22. Deliberate Non-Goals

The initial model intentionally excludes:

```text
habit_categories
notifications
reminders
social_accounts
email_verifications
achievements
leaderboards
habit_templates
tags
attachments
audit_logs
soft_delete fields
cached streak tables
```

These are not required for the initial coding-test scope.

---

## 23. Final Model

```text
users
├── id
├── email
├── password_hash
├── created_at
└── updated_at

habits
├── id
├── user_id
├── name
├── description
├── type
├── created_at
└── updated_at

habit_records
├── id
├── habit_id
├── record_date
├── status
├── created_at
└── updated_at

goals
├── id
├── user_id
├── habit_id
├── title
├── description
├── created_at
└── updated_at
```

Critical constraint:

```text
UNIQUE(habit_id, record_date)
```

Core design principle:

```text
Habit tracking history = source of truth
Streaks/statistics       = derived values
```

This model is intentionally small, relational, secure by ownership, and sufficient for the complete Habit Shaper coding-test scope.

## Database Constraints

The database must enforce structural rules that should never depend only on application code.

### users

```text
PRIMARY KEY (id)
UNIQUE (email)
NOT NULL (email)
NOT NULL (password_hash)
```

Rules:

- Email is normalized before persistence.
- Duplicate normalized emails must be rejected.
- Passwords are stored only as hashes.

### habits

```text
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
NOT NULL (user_id)
NOT NULL (name)
NOT NULL (type)
INDEX (user_id)
INDEX (user_id, type)
```

Rules:

- `type` must be `BUILD` or `BREAK`.
- `user_id` is determined by the authenticated user, not trusted from arbitrary client input.

### habit_records

```text
PRIMARY KEY (id)
FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
UNIQUE (habit_id, record_date)
NOT NULL (habit_id)
NOT NULL (record_date)
NOT NULL (status)
```

Rules:

- `status` must be `SUCCESS` or `FAILURE`.
- At most one daily record can exist for a habit.
- Repeated tracking of the same day uses update/upsert semantics rather than duplicate insert.

### goals

```text
PRIMARY KEY (id)
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE
NOT NULL (user_id)
NOT NULL (habit_id)
NOT NULL (title)
INDEX (user_id)
INDEX (habit_id)
INDEX (user_id, habit_id)
```

Rules:

- Foreign keys guarantee referenced records exist.
- The service layer must additionally verify `goal.user_id == habit.user_id`.
- Resource IDs alone never authorize access.

## Constraint Responsibility

```text
Database constraints
    -> structural integrity

Backend service rules
    -> domain integrity and ownership
```

Both layers are required.
