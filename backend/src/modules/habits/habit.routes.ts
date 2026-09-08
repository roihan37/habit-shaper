import { Router } from "express"

import { authenticate } from "../../middleware/authenticate.js"
import { validateRequest } from "../../middleware/validate-request.js"
import {
  createHabit,
  deleteHabit,
  getHabit,
  listHabits,
  updateHabit,
} from "./habit.controller.js"
import {
  createHabitSchema,
  habitIdParamsSchema,
  listHabitsQuerySchema,
  updateHabitSchema,
} from "./habit.schema.js"

export const habitRouter = Router()

habitRouter.get(
  "/",
  validateRequest({ query: listHabitsQuerySchema }),
  authenticate,
  listHabits,
)
habitRouter.post(
  "/",
  validateRequest({ body: createHabitSchema }),
  authenticate,
  createHabit,
)
habitRouter.get(
  "/:habitId",
  validateRequest({ params: habitIdParamsSchema }),
  authenticate,
  getHabit,
)
habitRouter.patch(
  "/:habitId",
  validateRequest({ params: habitIdParamsSchema, body: updateHabitSchema }),
  authenticate,
  updateHabit,
)
habitRouter.delete(
  "/:habitId",
  validateRequest({ params: habitIdParamsSchema }),
  authenticate,
  deleteHabit,
)
