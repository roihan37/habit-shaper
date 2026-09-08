import {
  formatCalendarDate,
  getWeekBounds,
  parseCalendarDate,
} from "../../utils/date.js"
import type { BuildStreakRecord } from "./build-streak.js"

export type CalculateBuildWeeklyCompletionInput = {
  habitCreationDate: string
  weekStart: string
  weekEnd: string
  today: string
  records: readonly BuildStreakRecord[]
}

export type BuildWeeklyCompletion = {
  completedDays: number
  missedDays: number
  eligibleDays: number
  completionRate: number
}

function nextCalendarDate(value: string) {
  const date = parseCalendarDate(value)
  date.setUTCDate(date.getUTCDate() + 1)
  return formatCalendarDate(date)
}

export function calculateBuildWeeklyCompletion({
  habitCreationDate,
  weekStart,
  weekEnd,
  today,
  records,
}: CalculateBuildWeeklyCompletionInput): BuildWeeklyCompletion {
  parseCalendarDate(habitCreationDate)
  parseCalendarDate(today)

  const expectedWeek = getWeekBounds(weekStart)
  if (expectedWeek.start !== weekStart || expectedWeek.end !== weekEnd) {
    throw new Error("Invalid Monday-Sunday week boundaries")
  }

  const statusByDate = new Map(
    records.map(({ recordDate, status }) => {
      parseCalendarDate(recordDate)
      return [recordDate, status] as const
    }),
  )

  let completedDays = 0
  let missedDays = 0
  let eligibleDays = 0
  let cursor = weekStart

  while (cursor <= weekEnd) {
    if (cursor > today) break

    if (cursor >= habitCreationDate) {
      const status = statusByDate.get(cursor)

      if (!(cursor === today && status === undefined)) {
        eligibleDays += 1

        if (status === "SUCCESS") completedDays += 1
        else missedDays += 1
      }
    }

    cursor = nextCalendarDate(cursor)
  }

  const completionRate =
    eligibleDays === 0
      ? 0
      : Math.round((completedDays / eligibleDays) * 1_000) / 10

  return { completedDays, missedDays, eligibleDays, completionRate }
}
