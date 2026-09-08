import { AppError } from "../../utils/app-error.js"
import { habitRepository } from "../habits/habit.repository.js"
import { goalRepository } from "./goal.repository.js"
import type {
  CreateGoalInput,
  ListGoalsQuery,
  UpdateGoalInput,
} from "./goal.schema.js"

type Goal = Awaited<ReturnType<typeof goalRepository.findByIdAndUserId>>
type ExistingGoal = NonNullable<Goal>

function goalNotFoundError() {
  return new AppError(404, "GOAL_NOT_FOUND", "Goal not found")
}

function habitNotFoundError() {
  return new AppError(404, "HABIT_NOT_FOUND", "Habit not found")
}

function toGoalResponse(goal: ExistingGoal) {
  return {
    id: goal.id,
    habitId: goal.habitId,
    title: goal.title,
    description: goal.description,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }
}

export const goalService = {
  async listGoals(userId: string, habitId?: ListGoalsQuery["habitId"]) {
    const goals = await goalRepository.findAllByUserId(userId, habitId)
    return goals.map(toGoalResponse)
  },

  async createGoal(userId: string, input: CreateGoalInput) {
    const habit = await habitRepository.findByIdAndUserId(input.habitId, userId)
    if (!habit) throw habitNotFoundError()

    const goal = await goalRepository.create(userId, input)
    return toGoalResponse(goal)
  },

  async updateGoal(userId: string, goalId: string, input: UpdateGoalInput) {
    const goal = await goalRepository.findByIdAndUserId(goalId, userId)
    if (!goal) throw goalNotFoundError()

    if (input.habitId !== undefined && input.habitId !== goal.habitId) {
      const habit = await habitRepository.findByIdAndUserId(input.habitId, userId)
      if (!habit) throw habitNotFoundError()
    }

    const result = await goalRepository.update(goalId, userId, input)
    if (result.count === 0) throw goalNotFoundError()

    const updatedGoal = await goalRepository.findByIdAndUserId(goalId, userId)
    if (!updatedGoal) throw goalNotFoundError()
    return toGoalResponse(updatedGoal)
  },

  async deleteGoal(userId: string, goalId: string) {
    const result = await goalRepository.delete(goalId, userId)
    if (result.count === 0) throw goalNotFoundError()
  },
}
