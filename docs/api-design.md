# Habit Shaper API Design

## 1. Purpose

This document defines the HTTP API contract for the Habit Shaper application.

The API supports:

- User registration and login
- Authentication state
- Habit CRUD
- Daily tracking for build habits
- Daily tracking for break habits
- Current streak calculation
- Weekly completion statistics
- Goal CRUD
- User-level authorization and ownership
- Consistent validation and error responses

The coding-test requirements define the functional scope. Endpoint naming, request/response shapes, error conventions, and authorization behavior below are implementation decisions for this project.

---

## 2. API Style

The API uses:

```text
REST-style HTTP endpoints
JSON request bodies
JSON responses
Cookie-based authentication
```

Base path:

```text
/api
```

Initial API versioning decision:

```text
No explicit /v1 prefix for the coding-test scope
```

Reason:

The application is small and internal to one frontend. Adding `/v1` is not required for the initial coding test.

If the API later becomes public or requires backward compatibility, versioning can be introduced.

---

## 3. Base URL

Development:

```text
http://localhost:4000/api
```

Example:

```text
POST http://localhost:4000/api/auth/login
```

The actual backend port is configured through Docker Compose and environment variables.

---

## 4. Content Type

All JSON requests should use:

```http
Content-Type: application/json
```

All JSON responses should return:

```http
Content-Type: application/json
```

---

## 5. Authentication Strategy

Authentication uses:

```text
Email + password
JWT
HttpOnly cookie
```

Login flow:

```text
Client
  |
  | POST /api/auth/login
  v
Backend
  |
  | validate credentials
  | verify password
  | issue JWT
  v
Set HttpOnly authentication cookie
```

Subsequent requests:

```text
Browser
  |
  | authentication cookie
  v
Auth Middleware
  |
  | verify JWT
  v
Authenticated User Context
```

The frontend must not manually attach a user ID to authorize access.

The authenticated user identity comes from the verified authentication token.

---

## 6. Authentication Cookie

Recommended cookie properties:

```text
HttpOnly = true
Secure = true in production
SameSite = Lax
Path = /
```

For local HTTP development:

```text
Secure = false
```

The final implementation must derive environment-specific values from configuration rather than hardcoding production settings.

---

## 7. Standard Response Format

### Success

Single resource:

```json
{
  "data": {
    "id": "resource-id"
  }
}
```

Collection:

```json
{
  "data": []
}
```

With metadata:

```json
{
  "data": [],
  "meta": {
    "total": 0
  }
}
```

### Error

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

Validation errors may include field details:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "email": [
        "Invalid email address"
      ]
    }
  }
}
```

Internal implementation details, stack traces, SQL errors, and secrets must never be returned to the client.

---

## 8. HTTP Status Code Conventions

| Status | Usage |
|---|---|
| `200 OK` | Successful read/update/action |
| `201 Created` | Resource created |
| `204 No Content` | Successful delete with no response body |
| `400 Bad Request` | Invalid business request or malformed input |
| `401 Unauthorized` | Authentication required or invalid |
| `404 Not Found` | Resource does not exist or is not accessible |
| `409 Conflict` | Unique/conflicting resource state |
| `500 Internal Server Error` | Unexpected server failure |

The contract consistently uses `400 Bad Request` for request validation
failures and invalid business input.

### Resource Enumeration Rule

For user-owned resources, the API may return:

```text
404 Not Found
```

instead of revealing that a resource exists but belongs to another user.

This avoids leaking resource existence across accounts.

---

## 9. Error Codes

The following stable error codes are part of the API contract:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
INVALID_CREDENTIALS
EMAIL_ALREADY_EXISTS
HABIT_NOT_FOUND
GOAL_NOT_FOUND
INVALID_RECORD_DATE
FUTURE_DATE_NOT_ALLOWED
INTERNAL_SERVER_ERROR
```

Frontend behavior should depend on stable error codes when necessary, not exact error-message text.

---

# 10. Authentication API

## 10.1 Register

```http
POST /api/auth/register
```

### Authentication

```text
Public
```

### Request

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Validation

```text
email
- required
- valid email
- trimmed
- normalized to lowercase

password
- required
- minimum 8 characters
- maximum 72 characters
- no uppercase, number, or special-character requirement
- whitespace is allowed and the password is not trimmed
```

### Success

```http
201 Created
```

Example:

```json
{
  "data": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

The API must never return:

```text
password
passwordHash
```

### Errors

```text
400 VALIDATION_ERROR
409 EMAIL_ALREADY_EXISTS
500 INTERNAL_SERVER_ERROR
```

---

## 10.2 Login

```http
POST /api/auth/login
```

### Authentication

```text
Public
```

### Request

```json
{
  "email": "user@example.com",
  "password": "strong-password"
}
```

### Success

```http
200 OK
```

The response sets an HttpOnly authentication cookie.

Example body:

```json
{
  "data": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

### Invalid Login

```http
401 Unauthorized
```

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

The response should not reveal whether the email exists.

---

## 10.3 Current User

```http
GET /api/auth/me
```

### Authentication

```text
Required
```

### Success

```json
{
  "data": {
    "id": "user-id",
    "email": "user@example.com"
  }
}
```

### Errors

```text
401 AUTHENTICATION_REQUIRED
```

---

## 10.4 Logout

Required endpoint:

```http
POST /api/auth/logout
```

Logout is part of the final cookie-authentication contract.

### Authentication

```text
Required
```

### Behavior

Clear the authentication cookie.

### Success

```http
204 No Content
```

---

# 11. Habit API

## 11.1 Habit Resource

Habit response shape:

```json
{
  "id": "habit-id",
  "name": "Read",
  "description": "Read for at least 20 minutes",
  "type": "BUILD",
  "createdAt": "2026-09-07T10:00:00.000Z",
  "updatedAt": "2026-09-07T10:00:00.000Z"
}
```

Valid habit types:

```text
BUILD
BREAK
```

---

## 11.2 List Habits

```http
GET /api/habits
```

### Authentication

```text
Required
```

### Optional Query

```text
type=BUILD
type=BREAK
```

Example:

```http
GET /api/habits?type=BUILD
```

### Success

```json
{
  "data": [
    {
      "id": "habit-id",
      "name": "Read",
      "description": null,
      "type": "BUILD",
      "createdAt": "2026-09-07T10:00:00.000Z",
      "updatedAt": "2026-09-07T10:00:00.000Z"
    }
  ]
}
```

Only habits owned by the authenticated user may be returned.

---

## 11.3 Create Habit

```http
POST /api/habits
```

### Authentication

```text
Required
```

### Request

```json
{
  "name": "Read",
  "description": "Read for at least 20 minutes",
  "type": "BUILD"
}
```

### Validation

```text
name
- required
- trimmed
- maximum 120 characters

description
- optional

type
- required
- BUILD or BREAK
```

The API ignores/rejects arbitrary client-provided `userId`.

Ownership is derived from authentication context.

### Success

```http
201 Created
```

```json
{
  "data": {
    "id": "habit-id",
    "name": "Read",
    "description": "Read for at least 20 minutes",
    "type": "BUILD",
    "createdAt": "2026-09-07T10:00:00.000Z",
    "updatedAt": "2026-09-07T10:00:00.000Z"
  }
}
```

---

## 11.4 Get Habit Detail

```http
GET /api/habits/:habitId
```

### Authentication

```text
Required
```

### Ownership

The requested habit must belong to the authenticated user.

### Success

```http
200 OK
```

### Not Found

```http
404 Not Found
```

```json
{
  "error": {
    "code": "HABIT_NOT_FOUND",
    "message": "Habit not found"
  }
}
```

---

## 11.5 Update Habit

```http
PATCH /api/habits/:habitId
```

### Authentication

```text
Required
```

### Request

```json
{
  "name": "Read Books",
  "description": "Read every day"
}
```

`habit.type` is immutable after habit creation. This applies whether or not
tracking history exists.

Reason:

Changing:

```text
BUILD -> BREAK
```

would reinterpret historical `SUCCESS/FAILURE` records with different semantics.

The PATCH body may contain only `name` and `description`. It must not accept
`type`, `userId`, `createdAt`, or any owner field.

### Success

```http
200 OK
```

---

## 11.6 Delete Habit

```http
DELETE /api/habits/:habitId
```

### Authentication

```text
Required
```

### Behavior

Deletion cascades to:

```text
habit_records
linked goals
```

according to the data-model constraints.

### Success

```http
204 No Content
```

---

# 12. Habit Tracking API

## 12.1 Tracking Representation

Daily tracking uses:

```text
SUCCESS
FAILURE
```

Meaning depends on habit type:

```text
BUILD:
SUCCESS = completed
FAILURE = missed

BREAK:
SUCCESS = clean
FAILURE = relapse
```

---

## 12.2 Track Today

Recommended primary endpoint:

```http
PUT /api/habits/:habitId/today
```

### Why PUT?

The logical resource is:

```text
one habit + today's calendar date
```

Repeated requests should update the same daily state rather than create duplicates.

This gives the operation idempotent resource semantics.

### Authentication

```text
Required
```

### Request

Build habit:

```json
{
  "status": "SUCCESS"
}
```

Break habit clean day:

```json
{
  "status": "SUCCESS"
}
```

Break habit relapse:

```json
{
  "status": "FAILURE"
}
```

### Date

The backend determines today's `record_date` using `APP_TIMEZONE`.

The frontend must not send the authoritative date for this endpoint.

### Success

Create:

```http
201 Created
```

Update existing today's record:

```http
200 OK
```

Example:

```json
{
  "data": {
    "id": "record-id",
    "habitId": "habit-id",
    "recordDate": "2026-09-07",
    "status": "SUCCESS"
  }
}
```

---

## 12.3 Track Specific Date

P1 optional enhancement for historical corrections:

```http
PUT /api/habits/:habitId/records/:date
```

Example:

```http
PUT /api/habits/abc123/records/2026-09-05
```

### Request

```json
{
  "status": "FAILURE"
}
```

### Date Format

```text
YYYY-MM-DD
```

### Rules

```text
date before habit creation -> rejected
future date -> rejected
invalid date -> rejected
habit not owned -> not found
existing daily record -> updated
missing daily record -> created
```

### Errors

Future date:

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "FUTURE_DATE_NOT_ALLOWED",
    "message": "Habit records cannot be created for future dates"
  }
}
```

Date before habit creation:

```http
400 Bad Request
```

```json
{
  "error": {
    "code": "INVALID_RECORD_DATE",
    "message": "Record date cannot be earlier than the habit creation date"
  }
}
```

Invalid date syntax also returns `400 Bad Request` with error code
`INVALID_RECORD_DATE`.

---

## 12.4 List Habit Records

This is a P1 optional enhancement and is not required for the minimum P0
workflow.

```http
GET /api/habits/:habitId/records
```

### Authentication

```text
Required
```

### Recommended Query Parameters

```text
from=YYYY-MM-DD
to=YYYY-MM-DD
```

Example:

```http
GET /api/habits/abc123/records?from=2026-09-01&to=2026-09-07
```

### Success

```json
{
  "data": [
    {
      "id": "record-id",
      "recordDate": "2026-09-07",
      "status": "SUCCESS"
    }
  ]
}
```

### Validation

```text
from <= to
date format must be valid
```

---

# 13. Habit Statistics API

## 13.1 Current Habit Statistics

```http
GET /api/habits/:habitId/stats
```

### Authentication

```text
Required
```

The backend calculates authoritative statistics.

### BUILD Response

```json
{
  "data": {
    "habitId": "habit-id",
    "type": "BUILD",
    "currentStreak": 3,
    "weekly": {
      "weekStart": "2026-09-07",
      "weekEnd": "2026-09-13",
      "completedDays": 1,
      "missedDays": 0,
      "eligibleDays": 1,
      "completionRate": 100
    }
  }
}
```

### BREAK Response

```json
{
  "data": {
    "habitId": "habit-id",
    "type": "BREAK",
    "currentCleanStreak": 5
  }
}
```

The coding-test requirement explicitly requires weekly completion under habit building. A weekly break-habit percentage is therefore not required in the initial contract.

---

## 13.2 Statistics Rules

The API follows the rules defined in:

```text
docs/business-rules.md
```

Summary:

```text
Week: Monday -> Sunday
Past untracked eligible build day: missed
Past untracked eligible break day: cannot extend clean streak
Untracked today: pending
Future dates: excluded and not writable
Dates before habit creation: excluded and not writable
```

The frontend must not recalculate authoritative statistics with different assumptions.

`completionRate` is a JSON number rounded to one decimal place. It is not a
string and does not include a `%` suffix. Examples: `2 / 3 -> 66.7`,
`5 / 7 -> 71.4`, and `3 / 4 -> 75`.

---

# 14. Goal API

## 14.1 Goal Resource

```json
{
  "id": "goal-id",
  "habitId": "habit-id",
  "title": "Read 30 days consistently",
  "description": null,
  "createdAt": "2026-09-07T10:00:00.000Z",
  "updatedAt": "2026-09-07T10:00:00.000Z"
}
```

---

## 14.2 List Goals

```http
GET /api/goals
```

### Authentication

```text
Required
```

### Optional Filter

```text
habitId=<id>
```

### Success

```json
{
  "data": []
}
```

Only goals owned by the authenticated user are returned.

---

## 14.3 Create Goal

```http
POST /api/goals
```

### Authentication

```text
Required
```

### Request

```json
{
  "habitId": "habit-id",
  "title": "Read consistently",
  "description": "Maintain the habit for this month"
}
```

### Rules

The backend must verify:

```text
habit exists
habit belongs to authenticated user
```

The frontend-provided `userId` must not be trusted or required.

### Success

```http
201 Created
```

### Ownership Failure

Use:

```http
404 Not Found
```

with:

```text
HABIT_NOT_FOUND
```

to avoid exposing another user's habit.

---

## 14.4 Update Goal

```http
PATCH /api/goals/:goalId
```

### Request

```json
{
  "title": "Read every day",
  "description": "Updated goal description",
  "habitId": "another-owned-habit-id"
}
```

If `habitId` is changed, the new habit must belong to the authenticated user.

### Success

```http
200 OK
```

### Not Found

If the goal does not exist or belongs to another user:

```http
404 Not Found
```

```json
{
  "error": {
    "code": "GOAL_NOT_FOUND",
    "message": "Goal not found"
  }
}
```

---

## 14.5 Delete Goal

```http
DELETE /api/goals/:goalId
```

### Authentication

```text
Required
```

### Success

```http
204 No Content
```

### Not Found

If the goal does not exist or belongs to another user:

```http
404 Not Found
```

```json
{
  "error": {
    "code": "GOAL_NOT_FOUND",
    "message": "Goal not found"
  }
}
```

---

# 15. Ownership Rules

Every user-owned operation must be scoped by authenticated user identity.

Incorrect:

```text
SELECT habit WHERE id = :habitId
```

Preferred conceptual rule:

```text
SELECT habit
WHERE id = :habitId
AND user_id = :authenticatedUserId
```

Equivalent ownership verification may be implemented through Prisma relationships.

The same principle applies to:

```text
habits
habit_records
goals
```

---

# 16. Input Validation

Request validation occurs before business logic.

Recommended flow:

```text
Request
   |
   v
Zod Schema
   |
   v
Controller
   |
   v
Service
```

Validation includes:

```text
required fields
string lengths
enum values
email format
date format
date range
future-date rule
```

Business-level validation remains in the service layer.

Examples:

```text
Does the habit belong to the user?
Can this historical record be modified?
Does the linked goal habit belong to the user?
```

---

# 17. Date and Time Contract

Calendar dates:

```text
YYYY-MM-DD
```

Example:

```text
2026-09-07
```

Timestamps:

```text
ISO 8601
```

Example:

```text
2026-09-07T10:00:00.000Z
```

Business date calculations use:

```env
APP_TIMEZONE=Asia/Jakarta
```

for the initial deployment.

The backend determines:

```text
today
habit creation date
current week
future/past date
```

The habit creation calendar date is obtained by converting `created_at` to
`APP_TIMEZONE` before extracting `YYYY-MM-DD`.

The browser locale is not authoritative.

---

# 18. Idempotency and Duplicate Protection

The database enforces:

```text
UNIQUE(habit_id, record_date)
```

Daily tracking uses update/upsert semantics.

Recommended:

```http
PUT /api/habits/:habitId/today
PUT /api/habits/:habitId/records/:date
```

Repeated identical requests produce the same logical daily state.

This prevents double clicks or request retries from generating duplicate rows.

---

# 19. Pagination Strategy

Pagination is not required for the initial coding-test scope because expected data volume is small.

Therefore:

```text
GET /api/habits
GET /api/goals
```

may initially return all user-owned records.

For habit-history endpoints, date-range filtering is preferred because tracking is naturally time-based.

If pagination is introduced later, use a consistent contract rather than adding ad hoc query parameters.

---

# 20. Sorting

Recommended default sorting:

### Habits

```text
created_at DESC
```

### Goals

```text
created_at DESC
```

### Habit Records

```text
record_date ASC
```

for date-range displays.

For streak calculations, repositories may query descending dates internally.

---

# 21. CORS and Browser Requests

The backend should restrict CORS to the configured frontend origin.

Example configuration:

```env
FRONTEND_URL=http://localhost:3000
```

Because authentication uses cookies, frontend requests must include credentials.

Conceptually:

```text
credentials: include
```

The backend must enable credentials for the configured frontend origin.

Avoid:

```text
Access-Control-Allow-Origin: *
```

when credentialed cookies are used.

---

# 22. CSRF Assumption

Cookie-based authentication introduces CSRF considerations.

For this coding-test architecture:

```text
SameSite=Lax
restricted CORS origin
JSON-only mutation endpoints
```

provide baseline protection.

If frontend and backend are deployed cross-site or security requirements increase, add an explicit CSRF-token strategy.

This assumption should stay aligned with the actual deployment configuration.

---

# 23. Rate Limiting

Rate limiting is not a core coding-test requirement.

If implemented, prioritize authentication endpoints:

```text
POST /api/auth/login
POST /api/auth/register
```

It should not delay completion of required end-to-end functionality.

---

# 24. Logging

The API may log:

```text
HTTP method
route
status code
request duration
server-side error identifier
```

It must not log:

```text
passwords
JWTs
authentication cookies
database credentials
```

---

# 25. Endpoint Summary

## Authentication

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

## Habits

```text
GET    /api/habits
POST   /api/habits
GET    /api/habits/:habitId
PATCH  /api/habits/:habitId
DELETE /api/habits/:habitId
```

## Tracking

```text
PUT /api/habits/:habitId/today
```

P1 historical tracking:

```text
PUT /api/habits/:habitId/records/:date
GET /api/habits/:habitId/records
```

## Statistics

```text
GET /api/habits/:habitId/stats
```

## Goals

```text
GET    /api/goals
POST   /api/goals
PATCH  /api/goals/:goalId
DELETE /api/goals/:goalId
```

---

# 26. Endpoint Authorization Matrix

| Endpoint | Public | Auth Required | Ownership Check |
|---|---:|---:|---:|
| `POST /auth/register` | Yes | No | No |
| `POST /auth/login` | Yes | No | No |
| `POST /auth/logout` | No | Yes | No |
| `GET /auth/me` | No | Yes | Current user |
| `GET /habits` | No | Yes | User scope |
| `POST /habits` | No | Yes | User derived from auth |
| `GET /habits/:habitId` | No | Yes | Yes |
| `PATCH /habits/:habitId` | No | Yes | Yes |
| `DELETE /habits/:habitId` | No | Yes | Yes |
| `PUT /habits/:habitId/today` | No | Yes | Yes |
| `PUT /habits/:habitId/records/:date` | No | Yes | Yes |
| `GET /habits/:habitId/records` | No | Yes | Yes |
| `GET /habits/:habitId/stats` | No | Yes | Yes |
| `GET /goals` | No | Yes | User scope |
| `POST /goals` | No | Yes | Goal + habit ownership |
| `PATCH /goals/:goalId` | No | Yes | Goal + habit ownership |
| `DELETE /goals/:goalId` | No | Yes | Yes |

---

# 27. Controller-Service-Repository Mapping

Example:

```text
PUT /api/habits/:habitId/today
            |
            v
HabitRecordController
            |
            v
HabitTrackingService
            |
      +-----+------+
      |            |
      v            v
HabitRepository  HabitRecordRepository
      |            |
      +-----+------+
            |
            v
          Prisma
            |
            v
           MySQL
```

Responsibilities:

### Controller

```text
parse request
read validated input
read authenticated user
call service
map result to HTTP response
```

### Service

```text
ownership
business rules
timezone/date resolution
streak logic
weekly statistics
transaction coordination
```

### Repository

```text
Prisma queries
persistence
database filtering
```

---

# 28. Suggested Backend Route Structure

```text
backend/src/modules/

auth/
├── auth.routes.ts
├── auth.controller.ts
├── auth.service.ts
├── auth.repository.ts
└── auth.schema.ts

habits/
├── habit.routes.ts
├── habit.controller.ts
├── habit.service.ts
├── habit.repository.ts
├── habit.schema.ts
├── habit-record.repository.ts
├── streak.service.ts
└── statistics.service.ts

goals/
├── goal.routes.ts
├── goal.controller.ts
├── goal.service.ts
├── goal.repository.ts
└── goal.schema.ts
```

---

# 29. API Contract Testing Priorities

The following contracts should have automated tests.

### Auth

```text
register success
duplicate email
login success
invalid credentials
protected endpoint without authentication
```

### Habits

```text
create BUILD
create BREAK
invalid type
list only owned habits
cannot read another user's habit
cannot update another user's habit
cannot delete another user's habit
```

### Tracking

```text
track today success
repeat tracking updates same daily record
past missing day breaks streak
today without record remains pending
relapse breaks clean streak
```

P1 historical tracking:

```text
track a specific historical date
reject dates before habit creation
reject future dates
retrieve an ordered date range
```

### Statistics

```text
build streak
break clean streak
weekly completed days
weekly missed days
weekly eligible days
weekly completion rate
```

### Goals

```text
create linked goal
reject habit owned by another user
update goal
delete goal
list only owned goals
```

---

# 30. Deliberate API Non-Goals

The initial API intentionally excludes:

```text
email verification
forgot password
password reset
OAuth/social login
refresh-token session management
notifications
reminders
leaderboards
public profiles
habit sharing
bulk APIs
GraphQL
WebSocket
admin APIs
```

These are not required for the coding-test core scope.

---

# 31. Final API Principles

The implementation should preserve these rules:

```text
Authentication identity comes from the server-verified token.

Authorization is enforced on the backend.

The client never chooses resource ownership.

One habit has at most one record per calendar date.

Daily tracking is idempotent at the habit/date level.

The backend is authoritative for "today".

The backend is authoritative for streaks and weekly statistics.

Errors use stable codes and consistent response shapes.

Internal implementation details are never exposed.

The API remains small and focused on the required product behavior.
```
