import {
  formatCalendarDate,
  parseCalendarDate,
} from "../../utils/date.js"

export type BuildStreakRecord = {
  recordDate: string
  status: "SUCCESS" | "FAILURE"
}

export type CalculateBuildStreakInput = {
  habitCreationDate: string
  today: string
  records: readonly BuildStreakRecord[]
}

function previousCalendarDate(value: string) {
  const date = parseCalendarDate(value)
  date.setUTCDate(date.getUTCDate() - 1)
  return formatCalendarDate(date)
}

export function calculateBuildStreak({
  habitCreationDate,
  today,
  records,
}: CalculateBuildStreakInput) {
  parseCalendarDate(habitCreationDate)
  parseCalendarDate(today)

  if (today < habitCreationDate) return 0

  const statusByDate = new Map(
    records.map(({ recordDate, status }) => {
      parseCalendarDate(recordDate)
      return [recordDate, status] as const
    }),
  )

  let cursor = today
  let streak = 0

  // Today is still pending when untracked, so begin with the preceding day.
  if (!statusByDate.has(cursor)) cursor = previousCalendarDate(cursor)

  while (cursor >= habitCreationDate) {
    if (statusByDate.get(cursor) !== "SUCCESS") break

    streak += 1
    cursor = previousCalendarDate(cursor)
  }

  return streak
}
