import { z } from "zod"

import { HabitRecordStatus } from "../../generated/prisma/enums.js"

export const trackTodaySchema = z
  .object({
    status: z.enum(HabitRecordStatus),
  })
  .strict()

export type TrackTodayInput = z.infer<typeof trackTodaySchema>
