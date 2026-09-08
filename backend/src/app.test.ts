import request from "supertest"
import { describe, expect, it } from "vitest"

import { app } from "./app.js"
import { env } from "./config/env.js"

describe("GET /health", () => {
  it("returns ok", async () => {
    const response = await request(app).get("/health")

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: "ok",
    })
  })
})

describe("CORS", () => {
  it("allows the configured frontend origin with credentials", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", env.FRONTEND_URL)

    expect(response.headers["access-control-allow-origin"]).toBe(
      env.FRONTEND_URL,
    )
    expect(response.headers["access-control-allow-credentials"]).toBe("true")
  })

  it("never reflects an untrusted origin", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "https://untrusted.example.com")

    expect(response.headers["access-control-allow-origin"]).toBe(
      env.FRONTEND_URL,
    )
    expect(response.headers["access-control-allow-origin"]).not.toBe(
      "https://untrusted.example.com",
    )
    expect(response.headers["access-control-allow-credentials"]).toBe("true")
  })
})
