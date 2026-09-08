import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().max(65_535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_TIMEZONE: z.string().min(1, "APP_TIMEZONE is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  FRONTEND_URL: z.url("FRONTEND_URL must be a valid URL"),
})

export type Environment = z.infer<typeof envSchema>

export function parseEnvironment(input: NodeJS.ProcessEnv): Environment {
  const parsed = envSchema.safeParse(input)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n")

    throw new Error(`Invalid environment configuration:\n${issues}`)
  }

  return parsed.data
}

export const env = parseEnvironment(process.env)
