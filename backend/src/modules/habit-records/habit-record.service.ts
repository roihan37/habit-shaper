import { env } from "../../config/env.js"
import { habitRepository } from "../habits/habit.repository.js"
import { AppError } from "../../utils/app-error.js"
import {
  formatCalendarDate,
  getCalendarDateInTimeZone,
} from "../../utils/date.js"
import { habitRecordRepository } from "./habit-record.repository.js"
import type { TrackTodayInput } from "./habit-record.schema.js"

function habitNotFoundError() {
  return new AppError(404, "HABIT_NOT_FOUND", "Habit not found")
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

    return {
      id: record.id,
      habitId: record.habitId,
      recordDate: formatCalendarDate(record.recordDate),
      status: record.status,
    }
  },
}
