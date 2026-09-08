import { Router } from "express"

import { authenticate } from "../../middleware/authenticate.js"
import { validateRequest } from "../../middleware/validate-request.js"
import {
  createGoal,
  deleteGoal,
  listGoals,
  updateGoal,
} from "./goal.controller.js"
import {
  createGoalSchema,
  goalIdParamsSchema,
  listGoalsQuerySchema,
  updateGoalSchema,
} from "./goal.schema.js"

export const goalRouter = Router()

goalRouter.get(
  "/",
  validateRequest({ query: listGoalsQuerySchema }),
  authenticate,
  listGoals,
)
goalRouter.post(
  "/",
  validateRequest({ body: createGoalSchema }),
  authenticate,
  createGoal,
)
goalRouter.patch(
  "/:goalId",
  validateRequest({ params: goalIdParamsSchema, body: updateGoalSchema }),
  authenticate,
  updateGoal,
)
goalRouter.delete(
  "/:goalId",
  validateRequest({ params: goalIdParamsSchema }),
  authenticate,
  deleteGoal,
)
