import { z } from "zod"

import { HabitRecordStatus } from "../../generated/prisma/enums.js"
import { isValidCalendarDate } from "../../utils/date.js"

const recordStatusSchema = z.enum(HabitRecordStatus)
const calendarDateSchema = z
  .string()
  .refine(isValidCalendarDate, "Date must be a valid YYYY-MM-DD date")

export const historicalRecordParamsSchema = z
  .object({
    habitId: z.uuid("Invalid habit ID"),
    date: calendarDateSchema,
  })
  .strict()

export const listHabitRecordsQuerySchema = z
  .object({
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  })
  .strict()
  .refine((query) => !query.from || !query.to || query.from <= query.to, {
    path: ["to"],
    message: "To date must be on or after from date",
  })

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
export type ListHabitRecordsQuery = z.infer<
  typeof listHabitRecordsQuerySchema
>
export type TrackTodayInput = z.infer<typeof trackTodaySchema>
export type TrackHistoricalDateInput = z.infer<
  typeof trackHistoricalDateSchema
>
