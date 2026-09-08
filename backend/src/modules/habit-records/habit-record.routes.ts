import { Router } from "express"

import { authenticate } from "../../middleware/authenticate.js"
import { validateRequest } from "../../middleware/validate-request.js"
import { habitIdParamsSchema } from "../habits/habit.schema.js"
import {
  trackHistoricalDate,
  trackToday,
} from "./habit-record.controller.js"
import {
  historicalRecordParamsSchema,
  trackHistoricalDateSchema,
  trackTodaySchema,
} from "./habit-record.schema.js"

export const habitRecordRouter = Router()

habitRecordRouter.put(
  "/:habitId/today",
  validateRequest({ params: habitIdParamsSchema, body: trackTodaySchema }),
  authenticate,
  trackToday,
)
habitRecordRouter.put(
  "/:habitId/records/:date",
  validateRequest({
    params: historicalRecordParamsSchema,
    body: trackHistoricalDateSchema,
  }),
  authenticate,
  trackHistoricalDate,
)
