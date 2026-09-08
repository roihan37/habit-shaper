import { describe, expect, it } from "vitest"
import { parseEnvironment } from "./env.js"

const validEnvironment = {
  DATABASE_URL: "mysql://app:password@localhost:3306/habit_shaper",
  APP_TIMEZONE: "Asia/Jakarta",
  AUTH_SECRET: "test-auth-secret-value",
  FRONTEND_URL: "http://localhost:3000",
}

describe("environment configuration", () => {
  it("parses required values and applies safe defaults", () => {
    expect(parseEnvironment(validEnvironment)).toEqual({
      ...validEnvironment,
      NODE_ENV: "development",
      PORT: 4000,
    })
  })

  it.each(["DATABASE_URL", "APP_TIMEZONE", "AUTH_SECRET", "FRONTEND_URL"])(
    "rejects missing %s",
    (key) => {
      const input = { ...validEnvironment }
      delete input[key as keyof typeof input]

      expect(() => parseEnvironment(input)).toThrow(
        "Invalid environment configuration",
      )
    },
  )

  it("rejects an authentication secret shorter than 16 characters", () => {
    expect(() =>
      parseEnvironment({ ...validEnvironment, AUTH_SECRET: "too-short" }),
    ).toThrow("AUTH_SECRET must be at least 16 characters")
  })

  it("rejects an invalid frontend URL", () => {
    expect(() =>
      parseEnvironment({ ...validEnvironment, FRONTEND_URL: "not-a-url" }),
    ).toThrow("FRONTEND_URL must be a valid URL")
  })

  it("coerces an explicitly configured port", () => {
    expect(parseEnvironment({ ...validEnvironment, PORT: "4100" }).PORT).toBe(
      4100,
    )
  })
})
