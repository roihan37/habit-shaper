# Habit Shaper Business Rules

## 1. Purpose

This document defines the business rules that must be implemented consistently by the backend, tests, and frontend.

The backend is the source of truth for streak and weekly-statistics calculations. The frontend displays the values returned by the API and must not implement a different interpretation of the same rules.

---

## 2. Core Date Rule

Habit Shaper tracks habits by calendar date, not by rolling 24-hour periods.

Each daily record is uniquely identified by:

```text
habit_id + record_date
```

A habit can have at most one tracking record for a given calendar date.

---

## 3. Build Habit Rules

A `BUILD` habit represents a behavior the user wants to perform.

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

A failed or missed eligible day breaks the current streak.

---

## 4. Break Habit Rules

A `BREAK` habit represents a behavior the user wants to avoid.

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

Current clean streak on Friday:

```text
2 days
```

### Relapse

A relapse immediately breaks the clean streak.

The system does not persist a separate `streak = 0` operation. The relapse record itself is enough to derive the reset.

### Repeated Tracking

If the user changes today's state:

```text
SUCCESS -> FAILURE
```

or:

```text
FAILURE -> SUCCESS
```

the existing record is updated.

A second row for the same `habit_id + record_date` must not be created.

---

## 5. Current Streak Rule

The current streak is the number of consecutive successful eligible calendar days ending at the latest date that should count toward the streak.

For `BUILD`:

```text
SUCCESS -> continues streak
FAILURE -> breaks streak
```

For `BREAK`:

```text
SUCCESS -> continues clean streak
FAILURE -> breaks clean streak
```

Example:

```text
Sep 01 SUCCESS
Sep 02 SUCCESS
Sep 03 FAILURE
Sep 04 SUCCESS
Sep 05 SUCCESS
```

Current streak:

```text
2
```

Earlier streaks are not added to the current streak.

---

## 6. Missing-Day Rule

For the initial implementation, an untracked past day is treated as unsuccessful for streak purposes.

Example:

```text
Sep 01 SUCCESS
Sep 02 no record
Sep 03 SUCCESS
```

Current streak on Sep 03:

```text
1
```

For a `BUILD` habit:

```text
missing past day = missed
```

For a `BREAK` habit:

```text
missing past day = not proven clean
```

Therefore, an untracked past day cannot extend a clean streak.

This prevents break habits from accumulating clean streaks automatically without explicit tracking.

---

## 7. Today Rule

The current day is not automatically treated as a failure merely because it has not been tracked yet.

Example:

```text
Sep 05 SUCCESS
Sep 06 SUCCESS
Sep 07 no record yet
```

On Sep 07 before tracking:

```text
current streak = 2
```

If Sep 07 later becomes:

```text
SUCCESS -> streak = 3
FAILURE -> streak = 0
```

This prevents the dashboard from breaking a streak simply because the user has not yet recorded today's result.

---

## 8. Future-Date Rule

The initial scope does not allow tracking records for future dates or for
dates before the habit existed.

```text
record_date >= habit_creation_date
record_date <= current application date
```

Historical corrections may be allowed for past dates.

---

## 9. Habit Start Date Rule

A habit becomes eligible for tracking from its creation calendar date in
`APP_TIMEZONE`.

Dates before the habit was created:

- are not missed days
- do not break streaks
- are not weekly eligible days
- cannot receive tracking records

For weekly statistics:

```text
evaluation_start =
max(week_start, habit_creation_date)
```

The habit creation calendar date is derived by converting `created_at` to
`APP_TIMEZONE` before extracting the date.

---

## 10. Weekly Completion Rule

A week is defined as:

```text
Monday through Sunday
```

using the application's canonical timezone.

### Build Habit Weekly Completion

For a build habit:

```text
SUCCESS = completed
FAILURE = missed
untracked past eligible day = missed
future day = excluded
today without a record = pending
```

### Completed Days

```text
completed_days = number of SUCCESS dates in the evaluation window
```

### Missed Days

```text
missed_days =
explicit FAILURE dates
+
untracked elapsed dates
```

### Eligible Days

For a completed historical week:

```text
eligible_days = calendar days from evaluation_start through week_end
```

This is seven only when the habit existed on or before the start of that
historical week.

For the current week:

```text
eligible_days = elapsed completed calendar days from evaluation_start
```

Today is included only after it has an explicit tracking result, or once the date advances beyond today.

### Formula

```text
weekly_completion_rate =
(completed_days / eligible_days) * 100
```

The API returns `completionRate` as a JSON number rounded to one decimal
place. It is not returned as a string and does not contain a `%` suffix.

```text
2 / 3 -> 66.7
5 / 7 -> 71.4
3 / 4 -> 75
```

If:

```text
eligible_days = 0
```

return:

```text
completion_rate = 0
completed_days = 0
missed_days = 0
```

### Example

Assume today is Friday:

```text
Mon SUCCESS
Tue SUCCESS
Wed FAILURE
Thu no record
Fri no record yet
```

Eligible days:

```text
Mon, Tue, Wed, Thu = 4
```

Completed:

```text
2
```

Missed:

```text
2
```

Completion rate:

```text
2 / 4 = 50%
```

Friday remains pending until tracked or until the application date advances.

---

## 11. Break Habit Weekly Statistics

The coding-test requirement explicitly asks for weekly completion rate under habit building, not habit breaking.

Therefore, the initial implementation does not require a break-habit weekly completion percentage.

The primary required metric for break habits is:

```text
current clean streak
```

If a weekly break-habit metric is added later, it must be documented separately.

---

## 12. Historical Editing

Historical editing is a P1 enhancement.

If the P1 historical-editing feature is implemented, a past record may be
corrected only within the habit's valid tracking window:

```text
record_date >= habit_creation_date
record_date <= today
```

All derived statistics must immediately reflect the updated
`habit_records` history.

Example:

Before:

```text
Sep 01 SUCCESS
Sep 02 FAILURE
Sep 03 SUCCESS
```

After correcting Sep 02:

```text
Sep 01 SUCCESS
Sep 02 SUCCESS
Sep 03 SUCCESS
```

The current streak becomes:

```text
3
```

No cached authoritative streak field needs manual synchronization.

---

## 13. Backend Responsibility

Streak and weekly statistics belong in the backend service layer.

```text
Controller
   |
   v
Habit Service
   |
   v
Habit Record Repository
   |
   v
Ordered Records
   |
   v
Streak / Weekly Calculator
   |
   v
API Response
```

The frontend may format returned values, but it must not apply different business rules.

---

## 14. Example Statistics Response

```json
{
  "currentStreak": 3,
  "weekly": {
    "completedDays": 3,
    "missedDays": 1,
    "eligibleDays": 4,
    "completionRate": 75
  }
}
```

---

## 15. Rule Test Matrix

### Build Streak

| Records | Expected Current Streak |
|---|---:|
| SUCCESS | 1 |
| SUCCESS, SUCCESS | 2 |
| SUCCESS, FAILURE | 0 |
| SUCCESS, FAILURE, SUCCESS | 1 |
| SUCCESS, missing past day, SUCCESS | 1 |

### Break Streak

| Records | Expected Clean Streak |
|---|---:|
| SUCCESS | 1 |
| SUCCESS, SUCCESS | 2 |
| SUCCESS, FAILURE | 0 |
| SUCCESS, FAILURE, SUCCESS | 1 |
| SUCCESS, missing past day, SUCCESS | 1 |

### Pending Today

```text
Yesterday SUCCESS
Today no record
```

Expected:

```text
streak remains based on yesterday
```

### Weekly Completion Rounding

| Completed / Eligible | Expected `completionRate` |
|---|---:|
| `2 / 3` | `66.7` |
| `5 / 7` | `71.4` |
| `3 / 4` | `75` |

---

## 16. Source of Truth

Authoritative state:

```text
habit_records
```

Derived values:

```text
current streak
weekly completion rate
completed days
missed days
```

The derived values are not stored as independent authoritative fields in the initial implementation.
