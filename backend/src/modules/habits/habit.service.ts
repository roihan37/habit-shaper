import { AppError } from "../../utils/app-error.js"
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
