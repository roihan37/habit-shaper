import express from "express"
import request from "supertest"
import { describe, expect, it } from "vitest"

import { AppError } from "../utils/app-error.js"
import { errorHandler } from "./error-handler.js"

function createTestApp(error: Error) {
  const app = express()
  app.get("/failure", () => {
    throw error
  })
  app.use(errorHandler)
  return app
}

describe("errorHandler", () => {
  it("preserves the public AppError contract", async () => {
    const response = await request(
      createTestApp(new AppError(404, "RESOURCE_NOT_FOUND", "Not found")),
    ).get("/failure")

    expect(response.status).toBe(404)
    expect(response.body).toEqual({
      error: { code: "RESOURCE_NOT_FOUND", message: "Not found" },
    })
  })

  it("does not expose internal database details or stack traces", async () => {
    const internalError = new Error(
      "Prisma P2021: table users does not exist; SELECT password_hash",
    )
    internalError.name = "PrismaClientKnownRequestError"

    const response = await request(createTestApp(internalError)).get("/failure")
    const serializedBody = JSON.stringify(response.body)

    expect(response.status).toBe(500)
    expect(response.body).toEqual({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    })
    expect(serializedBody).not.toContain("Prisma")
    expect(serializedBody).not.toContain("password_hash")
    expect(serializedBody).not.toContain("stack")
  })
})
