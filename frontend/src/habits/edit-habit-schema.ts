import { z } from 'zod'

export const editHabitSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Habit name is required.')
      .max(120, 'Habit name must not exceed 120 characters.'),
    description: z.string(),
  })
  .strict()

export type EditHabitInput = z.infer<typeof editHabitSchema>
