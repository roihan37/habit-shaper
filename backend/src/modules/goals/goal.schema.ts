import { z } from "zod"

const goalTitleSchema = z
  .string()
  .trim()
  .min(1, "Title is required")
  .max(160, "Title must not exceed 160 characters")

const goalDescriptionSchema = z.string().nullable()

export const goalIdParamsSchema = z
  .object({
    goalId: z.uuid("Invalid goal ID"),
  })
  .strict()

export const listGoalsQuerySchema = z
  .object({
    habitId: z.uuid("Invalid habit ID").optional(),
  })
  .strict()

export const createGoalSchema = z
  .object({
    habitId: z.uuid("Invalid habit ID"),
    title: goalTitleSchema,
    description: goalDescriptionSchema.optional(),
  })
  .strict()

export const updateGoalSchema = z
  .object({
    habitId: z.uuid("Invalid habit ID").optional(),
    title: goalTitleSchema.optional(),
    description: goalDescriptionSchema.optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.habitId !== undefined ||
      data.title !== undefined ||
      data.description !== undefined,
    "At least one field is required",
  )

export type GoalIdParams = z.infer<typeof goalIdParamsSchema>
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
