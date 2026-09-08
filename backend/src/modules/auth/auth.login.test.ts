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
  getAuthCookieOptions,
} from "./auth.controller.js"

const createdEmails = new Set<string>()

async function cleanUpCreatedUsers() {
  if (createdEmails.size === 0) {
    return
  }

  await prisma.user.deleteMany({
    where: { email: { in: [...createdEmails] } },
  })
  createdEmails.clear()
}

async function createUser(password = "password123") {
  const email = `${randomUUID()}@example.com`
  createdEmails.add(email)

  return prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 4),
    },
  })
}

describe("POST /api/auth/login", () => {
  afterEach(cleanUpCreatedUsers)

  afterAll(async () => {
    await cleanUpCreatedUsers()
    await prisma.$disconnect()
  })

  it("logs in using a normalized email and issues a valid JWT cookie", async () => {
    const password = "password123"
    const user = await createUser(password)

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: `  ${user.email.toUpperCase()}  `, password })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      data: { id: user.id, email: user.email },
    })
    expect(response.body).not.toHaveProperty("token")
    expect(response.body.data).not.toHaveProperty("password")
    expect(response.body.data).not.toHaveProperty("passwordHash")

    const cookie = response.headers["set-cookie"]?.[0]
    expect(cookie).toContain(`${AUTH_COOKIE_NAME}=`)
    expect(cookie).toContain("HttpOnly")
    expect(cookie).toContain("SameSite=Lax")
    expect(cookie).toContain("Path=/")
    expect(cookie).not.toContain("Secure")

    const token = cookie?.match(new RegExp(`${AUTH_COOKIE_NAME}=([^;]+)`))?.[1]
    const payload = jwt.verify(token!, env.AUTH_SECRET)
    expect(payload.sub).toBe(user.id)
  })

  it("returns generic invalid credentials for a wrong password", async () => {
    const user = await createUser()

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrong-password" })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    })
    expect(response.headers["set-cookie"]).toBeUndefined()
  })

  it("returns the same generic error for an unknown email", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: `${randomUUID()}@example.com`,
        password: "password123",
      })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({
      error: {
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password",
      },
    })
    expect(response.headers["set-cookie"]).toBeUndefined()
  })

  it("uses secure cookies only in production", () => {
    expect(getAuthCookieOptions("development").secure).toBe(false)
    expect(getAuthCookieOptions("test").secure).toBe(false)
    expect(getAuthCookieOptions("production").secure).toBe(true)
  })
})
