import { randomUUID } from "node:crypto"

import cookieParser from "cookie-parser"
import express from "express"
import jwt from "jsonwebtoken"
import request from "supertest"
import { describe, expect, it } from "vitest"

import { env } from "../config/env.js"
import { AUTH_COOKIE_NAME } from "../modules/auth/auth.controller.js"
import { errorHandler } from "./error-handler.js"
import { authenticate } from "./authenticate.js"

function createTestApp() {
  const app = express()
  app.use(express.json())
  app.use(cookieParser())
  app.post("/protected", authenticate, (req, res) => {
    res.status(200).json({ user: req.user })
  })
  app.use(errorHandler)
  return app
}

function authenticationCookie(token: string) {
  return `${AUTH_COOKIE_NAME}=${token}`
}

const authenticationRequiredResponse = {
  error: {
    code: "AUTHENTICATION_REQUIRED",
    message: "Authentication required",
  },
}

describe("authenticate", () => {
  it("rejects a request without an authentication cookie", async () => {
    const response = await request(createTestApp()).post("/protected")

    expect(response.status).toBe(401)
    expect(response.body).toEqual(authenticationRequiredResponse)
  })

  it("attaches the verified JWT subject as trusted user context", async () => {
    const userId = randomUUID()
    const token = jwt.sign({}, env.AUTH_SECRET, {
      subject: userId,
      expiresIn: "5m",
    })

    const response = await request(createTestApp())
      .post("/protected")
      .set("Cookie", authenticationCookie(token))

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ user: { id: userId } })
  })

  it.each([
    ["malformed token", "not-a-jwt"],
    ["invalid signature", jwt.sign({}, "different-test-secret", { subject: randomUUID() })],
    ["expired token", jwt.sign({}, env.AUTH_SECRET, { subject: randomUUID(), expiresIn: -1 })],
    ["missing subject", jwt.sign({}, env.AUTH_SECRET)],
    ["non-string subject", jwt.sign({ sub: 123 }, env.AUTH_SECRET)],
  ])("rejects a %s with a generic response", async (_case, token) => {
    const response = await request(createTestApp())
      .post("/protected")
      .set("Cookie", authenticationCookie(token))

    expect(response.status).toBe(401)
    expect(response.body).toEqual(authenticationRequiredResponse)
  })

  it("ignores a client-provided userId", async () => {
    const trustedUserId = randomUUID()
    const token = jwt.sign({}, env.AUTH_SECRET, {
      subject: trustedUserId,
      expiresIn: "5m",
    })

    const response = await request(createTestApp())
      .post("/protected")
      .set("Cookie", authenticationCookie(token))
      .send({ userId: "attacker-user-id" })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ user: { id: trustedUserId } })
  })
})
