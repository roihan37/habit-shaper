import { z } from 'zod'

export const createHabitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Habit name is required.')
      .max(120, 'Habit name must not exceed 120 characters.'),
    description: z.string().optional(),
    type: z.enum(['BUILD', 'BREAK'], {
      error: 'Choose whether to build or break this habit.',
    }),
  })
  .strict()

export type CreateHabitInput = z.infer<typeof createHabitSchema>
