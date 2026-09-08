import { z } from "zod"

import { HabitType } from "../../generated/prisma/enums.js"

const habitNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name must not exceed 120 characters")

const habitDescriptionSchema = z.string().nullable()

export const habitIdParamsSchema = z
  .object({
    habitId: z.uuid("Invalid habit ID"),
  })
  .strict()

export const listHabitsQuerySchema = z
  .object({
    type: z.enum(HabitType).optional(),
  })
  .strict()

export const createHabitSchema = z
  .object({
    name: habitNameSchema,
    description: habitDescriptionSchema.optional(),
    type: z.enum(HabitType),
  })
  .strict()

export const updateHabitSchema = z
  .object({
    name: habitNameSchema.optional(),
    description: habitDescriptionSchema.optional(),
  })
  .strict()
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    "At least one field is required",
  )

export type HabitIdParams = z.infer<typeof habitIdParamsSchema>
export type ListHabitsQuery = z.infer<typeof listHabitsQuerySchema>
export type CreateHabitInput = z.infer<typeof createHabitSchema>
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>
