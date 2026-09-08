import { env } from "../../config/env.js"
import { habitRecordRepository } from "../habit-records/habit-record.repository.js"
import { HabitType } from "../../generated/prisma/enums.js"
import { AppError } from "../../utils/app-error.js"
import {
  formatCalendarDate,
  formatCalendarDateInTimeZone,
  getWeekBounds,
  parseCalendarDate,
} from "../../utils/date.js"
import { calculateBreakStreak } from "./break-streak.js"
import { calculateBuildStreak } from "./build-streak.js"
import { calculateBuildWeeklyCompletion } from "./build-weekly-completion.js"
import { habitRepository } from "./habit.repository.js"
import type {
  CreateHabitInput,
  ListHabitsQuery,
  UpdateHabitInput,
} from "./habit.schema.js"

type Habit = Awaited<ReturnType<typeof habitRepository.findByIdAndUserId>>
type ExistingHabit = NonNullable<Habit>

function habitNotFoundError() {
  return new AppError(404, "HABIT_NOT_FOUND", "Habit not found")
}

function toHabitResponse(habit: ExistingHabit) {
  return {
    id: habit.id,
    name: habit.name,
    description: habit.description,
    type: habit.type,
    createdAt: habit.createdAt,
    updatedAt: habit.updatedAt,
  }
}

export const habitService = {
  async listHabits(userId: string, type?: ListHabitsQuery["type"]) {
    const habits = await habitRepository.findAllByUserId(userId, type)
    return habits.map(toHabitResponse)
  },

  async getHabit(userId: string, habitId: string) {
    const habit = await habitRepository.findByIdAndUserId(habitId, userId)

    if (!habit) throw habitNotFoundError()
    return toHabitResponse(habit)
  },

  async getHabitStats(userId: string, habitId: string) {
    const habit = await habitRepository.findByIdAndUserId(habitId, userId)

    if (!habit) throw habitNotFoundError()

    const today = formatCalendarDateInTimeZone(env.APP_TIMEZONE, new Date())
    const habitCreationDate = formatCalendarDateInTimeZone(
      env.APP_TIMEZONE,
      habit.createdAt,
    )
    const records = await habitRecordRepository.findByDateRange(
      userId,
      habitId,
      parseCalendarDate(habitCreationDate),
      parseCalendarDate(today),
    )
    const normalizedRecords = records.map((record) => ({
      recordDate: formatCalendarDate(record.recordDate),
      status: record.status,
    }))

    if (habit.type === HabitType.BREAK) {
      return {
        habitId: habit.id,
        type: habit.type,
        currentCleanStreak: calculateBreakStreak({
          habitCreationDate,
          today,
          records: normalizedRecords,
        }),
      }
    }

    const { start: weekStart, end: weekEnd } = getWeekBounds(today)
    const weekly = calculateBuildWeeklyCompletion({
      habitCreationDate,
      weekStart,
      weekEnd,
      today,
      records: normalizedRecords,
    })

    return {
      habitId: habit.id,
      type: habit.type,
      currentStreak: calculateBuildStreak({
        habitCreationDate,
        today,
        records: normalizedRecords,
      }),
      weekly: { weekStart, weekEnd, ...weekly },
    }
  },

  async createHabit(userId: string, input: CreateHabitInput) {
    const habit = await habitRepository.create(userId, input)
    return toHabitResponse(habit)
  },

  async updateHabit(userId: string, habitId: string, input: UpdateHabitInput) {
    const result = await habitRepository.update(habitId, userId, input)

    if (result.count === 0) throw habitNotFoundError()

    const habit = await habitRepository.findByIdAndUserId(habitId, userId)
    if (!habit) throw habitNotFoundError()
    return toHabitResponse(habit)
  },

  async deleteHabit(userId: string, habitId: string) {
    const result = await habitRepository.delete(habitId, userId)

    if (result.count === 0) throw habitNotFoundError()
  },
}
