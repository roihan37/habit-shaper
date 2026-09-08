import { Router } from "express"

import { authenticate } from "../../middleware/authenticate.js"
import { validateRequest } from "../../middleware/validate-request.js"
import { habitIdParamsSchema } from "../habits/habit.schema.js"
import { trackToday } from "./habit-record.controller.js"
import { trackTodaySchema } from "./habit-record.schema.js"

export const habitRecordRouter = Router()

habitRecordRouter.put(
  "/:habitId/today",
  validateRequest({ params: habitIdParamsSchema, body: trackTodaySchema }),
  authenticate,
  trackToday,
)
