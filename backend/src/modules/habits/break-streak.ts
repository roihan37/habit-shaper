import {
  formatCalendarDate,
  parseCalendarDate,
} from "../../utils/date.js"
import type { BuildStreakRecord } from "./build-streak.js"

export type BreakStreakRecord = BuildStreakRecord

export type CalculateBreakStreakInput = {
  habitCreationDate: string
  today: string
  records: readonly BreakStreakRecord[]
}

function previousCalendarDate(value: string) {
  const date = parseCalendarDate(value)
  date.setUTCDate(date.getUTCDate() - 1)
  return formatCalendarDate(date)
}

export function calculateBreakStreak({
  habitCreationDate,
  today,
  records,
}: CalculateBreakStreakInput) {
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
  let cleanStreak = 0

  // An untracked today is pending; only past missing days break continuity.
  if (!statusByDate.has(cursor)) cursor = previousCalendarDate(cursor)

  while (cursor >= habitCreationDate) {
    if (statusByDate.get(cursor) !== "SUCCESS") break

    cleanStreak += 1
    cursor = previousCalendarDate(cursor)
  }

  return cleanStreak
}
