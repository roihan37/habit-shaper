import { env } from "../../config/env.js"
import { habitRepository } from "../habits/habit.repository.js"
import { AppError } from "../../utils/app-error.js"
import {
  formatCalendarDate,
  getCalendarDateInTimeZone,
  parseCalendarDate,
} from "../../utils/date.js"
import { habitRecordRepository } from "./habit-record.repository.js"
import type {
  TrackHistoricalDateInput,
  TrackTodayInput,
} from "./habit-record.schema.js"

function habitNotFoundError() {
  return new AppError(404, "HABIT_NOT_FOUND", "Habit not found")
}

type HabitRecord = NonNullable<
  Awaited<ReturnType<typeof habitRecordRepository.upsertByHabitAndDate>>
>

function toHabitRecordResponse(record: HabitRecord) {
  return {
    id: record.id,
    habitId: record.habitId,
    recordDate: formatCalendarDate(record.recordDate),
    status: record.status,
  }
}

export const habitRecordService = {
  async trackToday(userId: string, habitId: string, input: TrackTodayInput) {
    const habit = await habitRepository.findByIdAndUserId(habitId, userId)

    if (!habit) throw habitNotFoundError()

    const recordDate = getCalendarDateInTimeZone(env.APP_TIMEZONE)
    const record = await habitRecordRepository.upsertByHabitAndDate(
      userId,
      habitId,
      recordDate,
      input.status,
    )

    if (!record) throw habitNotFoundError()

    return toHabitRecordResponse(record)
  },

  async trackHistoricalDate(
    userId: string,
    habitId: string,
    requestedDate: string,
    input: TrackHistoricalDateInput,
    now = new Date(),
  ) {
    const habit = await habitRepository.findByIdAndUserId(habitId, userId)
    if (!habit) throw habitNotFoundError()

    const recordDate = parseCalendarDate(requestedDate)
    const normalizedRequestedDate = formatCalendarDate(recordDate)
    const creationDate = formatCalendarDate(
      getCalendarDateInTimeZone(env.APP_TIMEZONE, habit.createdAt),
    )
    const today = formatCalendarDate(
      getCalendarDateInTimeZone(env.APP_TIMEZONE, now),
    )

    if (normalizedRequestedDate < creationDate) {
      throw new AppError(
        400,
        "INVALID_RECORD_DATE",
        "Record date cannot be earlier than the habit creation date",
      )
    }

    if (normalizedRequestedDate > today) {
      throw new AppError(
        400,
        "FUTURE_DATE_NOT_ALLOWED",
        "Habit records cannot be created for future dates",
      )
    }

    const record = await habitRecordRepository.upsertByHabitAndDate(
      userId,
      habitId,
      recordDate,
      input.status,
    )

    if (!record) throw habitNotFoundError()
    return toHabitRecordResponse(record)
  },
}
