import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Please enter a valid email address.')
    .transform((value) => value.toLowerCase()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .max(72, 'Password must not exceed 72 characters.'),
})

export type RegisterInput = z.infer<typeof registerSchema>
