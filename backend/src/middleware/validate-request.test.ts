import express from "express"
import request from "supertest"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { validateRequest } from "./validate-request.js"

const schemas = {
  body: z.object({ name: z.string().trim().min(1, "Name is required") }),
  params: z.object({ habitId: z.string().min(3, "Invalid habit id") }),
  query: z.object({ page: z.coerce.number().int().positive() }),
}

function createTestApp() {
  const app = express()
  app.use(express.json())
  app.post(
    "/test/:habitId",
    validateRequest(schemas),
    (req, res) => {
      res.status(200).json({
        body: req.body,
        params: req.params,
        query: req.query,
      })
    },
  )
  return app
}

const validationError = (details: Record<string, string[]>) => ({
  error: {
    code: "VALIDATION_ERROR",
    message: "Request validation failed",
    details,
  },
})

describe("validateRequest", () => {
  it("validates body, params, and query and exposes parsed values", async () => {
    const response = await request(createTestApp())
      .post("/test/habit-1?page=2")
      .send({ name: "  Read  ", ignored: true })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      body: { name: "Read" },
      params: { habitId: "habit-1" },
      query: { page: 2 },
    })
  })

  it("returns a consistent error for an invalid body", async () => {
    const response = await request(createTestApp())
      .post("/test/habit-1?page=2")
      .send({ name: " " })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      validationError({ name: ["Name is required"] }),
    )
  })

  it("returns a consistent error for invalid params", async () => {
    const response = await request(createTestApp())
      .post("/test/x?page=2")
      .send({ name: "Read" })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      validationError({ habitId: ["Invalid habit id"] }),
    )
  })

  it("returns a consistent error for an invalid query", async () => {
    const response = await request(createTestApp())
      .post("/test/habit-1?page=zero")
      .send({ name: "Read" })

    expect(response.status).toBe(400)
    expect(response.body).toEqual(
      validationError({ page: ["Invalid input: expected number, received NaN"] }),
    )
  })
})
