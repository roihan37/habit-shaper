import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { app } from "../../app.js"
import { env } from "../../config/env.js"
import { prisma } from "../../database/prisma.js"
import {
  AUTH_COOKIE_NAME,
  getAuthCookieClearOptions,
} from "./auth.controller.js"

const createdUserIds = new Set<string>()

async function cleanUpCreatedUsers() {
  if (createdUserIds.size === 0) return

  await prisma.user.deleteMany({
    where: { id: { in: [...createdUserIds] } },
  })
  createdUserIds.clear()
}

async function createUser(password = "password123") {
  const user = await prisma.user.create({
    data: {
      email: `${randomUUID()}@example.com`,
      passwordHash: await bcrypt.hash(password, 4),
    },
  })
  createdUserIds.add(user.id)
  return user
}

async function login(email: string, password = "password123") {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password })

  return response.headers["set-cookie"]?.[0]
}

const authenticationRequiredResponse = {
  error: {
    code: "AUTHENTICATION_REQUIRED",
    message: "Authentication required",
  },
}

afterEach(cleanUpCreatedUsers)

afterAll(async () => {
  await cleanUpCreatedUsers()
  await prisma.$disconnect()
})

describe("GET /api/auth/me", () => {
  it("returns only the current user's safe public fields", async () => {
    const user = await createUser()
    const cookie = await login(user.email)

    const response = await request(app).get("/api/auth/me").set("Cookie", cookie!)

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: { id: user.id, email: user.email },
    })
    expect(response.body.data).not.toHaveProperty("passwordHash")
    expect(response.body).not.toHaveProperty("token")
  })

  it("rejects missing and invalid authentication", async () => {
    const missing = await request(app).get("/api/auth/me")
    const invalid = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE_NAME}=invalid-token`)

    expect(missing.status).toBe(401)
    expect(missing.body).toEqual(authenticationRequiredResponse)
    expect(invalid.status).toBe(401)
    expect(invalid.body).toEqual(authenticationRequiredResponse)
  })

  it("uses the authenticated identity instead of client-provided user IDs", async () => {
    const authenticatedUser = await createUser()
    const otherUser = await createUser()
    const cookie = await login(authenticatedUser.email)

    const response = await request(app)
      .get(`/api/auth/me?userId=${otherUser.id}`)
      .set("Cookie", cookie!)
      .set("x-user-id", otherUser.id)

    expect(response.status).toBe(200)
    expect(response.body.data).toEqual({
      id: authenticatedUser.id,
      email: authenticatedUser.email,
    })
  })

  it("rejects a valid JWT whose user no longer exists", async () => {
    const token = jwt.sign({}, env.AUTH_SECRET, {
      subject: randomUUID(),
      expiresIn: "5m",
    })

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${AUTH_COOKIE_NAME}=${token}`)

    expect(response.status).toBe(401)
    expect(response.body).toEqual(authenticationRequiredResponse)
  })
})

describe("POST /api/auth/logout", () => {
  it("clears the existing authentication cookie with matching attributes", async () => {
    const user = await createUser()
    const cookie = await login(user.email)

    const response = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie!)

    expect(response.status).toBe(204)
    expect(response.text).toBe("")

    const clearedCookie = response.headers["set-cookie"]?.[0]
    expect(clearedCookie).toContain(`${AUTH_COOKIE_NAME}=`)
    expect(clearedCookie).toContain("Expires=Thu, 01 Jan 1970 00:00:00 GMT")
    expect(clearedCookie).toContain("Path=/")
    expect(clearedCookie).toContain("HttpOnly")
    expect(clearedCookie).toContain("SameSite=Lax")
    expect(clearedCookie).not.toContain("Secure")
  })

  it("requires authentication according to the API contract", async () => {
    const response = await request(app).post("/api/auth/logout")

    expect(response.status).toBe(401)
    expect(response.body).toEqual(authenticationRequiredResponse)
  })

  it("uses secure clear-cookie options only in production", () => {
    expect(getAuthCookieClearOptions("development").secure).toBe(false)
    expect(getAuthCookieClearOptions("test").secure).toBe(false)
    expect(getAuthCookieClearOptions("production").secure).toBe(true)
  })
})
