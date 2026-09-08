import { z } from "zod"

const normalizedEmailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .transform((value) => value.toLowerCase())

export const registerSchema = z.object({
  email: normalizedEmailSchema,

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must not exceed 72 characters"),
})

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1, "Password is required"),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
