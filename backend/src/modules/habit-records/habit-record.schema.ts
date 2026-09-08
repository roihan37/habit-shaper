import { z } from "zod"

import { HabitRecordStatus } from "../../generated/prisma/enums.js"
import { isValidCalendarDate } from "../../utils/date.js"

const recordStatusSchema = z.enum(HabitRecordStatus)

export const historicalRecordParamsSchema = z
  .object({
    habitId: z.uuid("Invalid habit ID"),
    date: z
      .string()
      .refine(isValidCalendarDate, "Date must be a valid YYYY-MM-DD date"),
  })
  .strict()

export const trackTodaySchema = z
  .object({
    status: recordStatusSchema,
  })
  .strict()

export const trackHistoricalDateSchema = z
  .object({
    status: recordStatusSchema,
  })
  .strict()

export type HistoricalRecordParams = z.infer<
  typeof historicalRecordParamsSchema
>
export type TrackTodayInput = z.infer<typeof trackTodaySchema>
export type TrackHistoricalDateInput = z.infer<
  typeof trackHistoricalDateSchema
>
