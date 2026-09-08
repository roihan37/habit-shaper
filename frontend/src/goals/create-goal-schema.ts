import { z } from 'zod'

export const createGoalSchema = z
  .object({
    habitId: z.uuid('Choose a habit.'),
    title: z
      .string()
      .trim()
      .min(1, 'Goal title is required.')
      .max(160, 'Goal title must not exceed 160 characters.'),
    description: z.string().optional(),
  })
  .strict()

export type CreateGoalInput = z.infer<typeof createGoalSchema>
