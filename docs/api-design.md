# Habit Shaper API

Base URL: `http://localhost:4000`. JSON endpoints use the `/api` prefix; `GET /health` is outside it.

## Common contracts

Successful JSON responses wrap their result:

```json
{ "data": {} }
```

Successful deletes/logout return `204 No Content`. Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": { "field": ["Reason"] }
  }
}
```

`details` is optional. Request schemas are strict where defined, so unexpected body/query fields are rejected. Protected endpoints authenticate only from the `auth_token` cookie; client `userId` values are not accepted.

## Resource shapes

```ts
type User = { id: string; email: string }

type Habit = {
  id: string
  name: string
  description: string | null
  type: "BUILD" | "BREAK"
  createdAt: string
  updatedAt: string
}

type HabitRecord = {
  id: string
  habitId: string
  recordDate: string // YYYY-MM-DD
  status: "SUCCESS" | "FAILURE"
}

type Goal = {
  id: string
  habitId: string
  title: string
  description: string | null
  createdAt: string
  updatedAt: string
}
```

Dates in timestamps are serialized as JSON strings by Express/Prisma.

## Authentication

| Method and path | Auth | Input | Success |
| --- | --- | --- | --- |
| `POST /api/auth/register` | No | Body `{ email, password }` | `201`, `data: User` |
| `POST /api/auth/login` | No | Body `{ email, password }` | `200`, `data: User`; sets `auth_token` cookie |
| `GET /api/auth/me` | Yes | None | `200`, `data: User` |
| `POST /api/auth/logout` | Yes | None | `204`; clears cookie |

Registration trims/lowercases email. Passwords must be 8-72 characters. Login requires a non-empty password and returns generic `INVALID_CREDENTIALS` for an unknown email or wrong password. Password hashes and JWTs never appear in JSON.

Relevant errors: `VALIDATION_ERROR` (400), `INVALID_CREDENTIALS` (401), `AUTHENTICATION_REQUIRED` (401), and `EMAIL_ALREADY_EXISTS` (409).

## Habits

| Method and path | Auth | Input | Success |
| --- | --- | --- | --- |
| `GET /api/habits` | Yes | Optional query `type=BUILD|BREAK` | `200`, `data: Habit[]` |
| `POST /api/habits` | Yes | Body `{ name, type, description? }` | `201`, `data: Habit` |
| `GET /api/habits/:habitId` | Yes | UUID path parameter | `200`, `data: Habit` |
| `PATCH /api/habits/:habitId` | Yes | Body with `name?`, `description?`; at least one | `200`, `data: Habit` |
| `DELETE /api/habits/:habitId` | Yes | UUID path parameter | `204` |

`name` is trimmed, required, and at most 120 characters. `description` is a nullable string. Creation requires `type`; update deliberately does not accept type conversion. A missing or foreign habit returns `HABIT_NOT_FOUND` (404).

## Tracking and history

| Method and path | Auth | Input | Success |
| --- | --- | --- | --- |
| `PUT /api/habits/:habitId/today` | Yes | Body `{ status: "SUCCESS" | "FAILURE" }` | `200`, `data: HabitRecord` |
| `PUT /api/habits/:habitId/records/:date` | Yes | `date` as `YYYY-MM-DD`; same status body | `200`, `data: HabitRecord` |
| `GET /api/habits/:habitId/records` | Yes | Optional `from`/`to` query dates | `200`, `data: HabitRecord[]` |

The history response is `HabitRecord[]`, ordered by `recordDate` descending. `from` and `to` are inclusive; when both exist, `to` must not precede `from`. Tracking uses upsert, so repeated writes for one habit/date update the existing record.

Historical tracking rejects dates before the habit's creation date with `INVALID_RECORD_DATE` (400) and future dates with `FUTURE_DATE_NOT_ALLOWED` (400). Missing or foreign habits return `HABIT_NOT_FOUND` (404).

## Statistics

`GET /api/habits/:habitId/stats` requires authentication and returns 200.

For a `BUILD` habit:

```json
{
  "data": {
    "habitId": "uuid",
    "type": "BUILD",
    "currentStreak": 3,
    "weekly": {
      "weekStart": "2026-09-07",
      "weekEnd": "2026-09-13",
      "completedDays": 3,
      "missedDays": 1,
      "eligibleDays": 4,
      "completionRate": 75
    }
  }
}
```

For a `BREAK` habit:

```json
{
  "data": {
    "habitId": "uuid",
    "type": "BREAK",
    "currentCleanStreak": 5
  }
}
```

A missing or foreign habit returns `HABIT_NOT_FOUND` (404).

## Goals

| Method and path | Auth | Input | Success |
| --- | --- | --- | --- |
| `GET /api/goals` | Yes | Optional query `habitId=<uuid>` | `200`, `data: Goal[]` |
| `POST /api/goals` | Yes | Body `{ habitId, title, description? }` | `201`, `data: Goal` |
| `PATCH /api/goals/:goalId` | Yes | Any of `habitId?`, `title?`, `description?`; at least one | `200`, `data: Goal` |
| `DELETE /api/goals/:goalId` | Yes | UUID path parameter | `204` |

`title` is trimmed, required, and at most 160 characters. `description` is a nullable string. The linked habit must belong to the authenticated user; otherwise the API returns `HABIT_NOT_FOUND` (404). A missing or foreign goal returns `GOAL_NOT_FOUND` (404).

## Authorization rules

- All habit, record, statistics, and goal operations use `req.user.id` from the verified cookie.
- Ownership is applied in repository queries and linked-habit validation.
- Foreign resources deliberately use the same 404 codes as missing resources; the API does not disclose their existence with 403.
- List endpoints return only resources owned by the authenticated user.

## Status and error codes

| HTTP status | Codes/use |
| --- | --- |
| 200 | Successful reads, updates, login, and tracking |
| 201 | Registration, habit creation, goal creation |
| 204 | Logout and deletes |
| 400 | `VALIDATION_ERROR`, `INVALID_RECORD_DATE`, `FUTURE_DATE_NOT_ALLOWED` |
| 401 | `AUTHENTICATION_REQUIRED`, `INVALID_CREDENTIALS` |
| 404 | `HABIT_NOT_FOUND`, `GOAL_NOT_FOUND` |
| 409 | `EMAIL_ALREADY_EXISTS` |
| 500 | `INTERNAL_SERVER_ERROR` |

## Date contract

- Record dates use strict `YYYY-MM-DD` calendar-date strings, not timestamps.
- MySQL stores them as `DATE` and responses preserve the same format.
- `APP_TIMEZONE` is the backend authority for today's date and for converting a habit's `createdAt` to its first eligible date. The configured example is `Asia/Jakarta`.
- Future historical tracking is rejected. Dates before habit creation are rejected for writes and excluded from statistics.
- BUILD weekly statistics use Monday through Sunday. The current week counts only eligible days from the later of Monday or habit creation through today.

## Health endpoint

`GET /health` requires no authentication and returns:

```json
{ "status": "ok" }
```
