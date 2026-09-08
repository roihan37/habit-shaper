import { randomUUID } from "node:crypto"

import bcrypt from "bcrypt"
import request from "supertest"
import { afterAll, afterEach, describe, expect, it } from "vitest"

import { app } from "../../app.js"
import { prisma } from "../../database/prisma.js"

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

function uniqueEmail() {
  const email = `${randomUUID()}@example.com`
  createdEmails.add(email)
  return email
}

describe("POST /api/auth/register", () => {
  afterEach(cleanUpCreatedUsers)

  afterAll(async () => {
    await cleanUpCreatedUsers()
    await prisma.$disconnect()
  })

  it("registers a user with a normalized email", async () => {
    const email = uniqueEmail()

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: `  ${email.toUpperCase()}  `, password: "password123" })

    expect(response.status).toBe(201)
    expect(response.body).toEqual({
      data: {
        id: expect.any(String),
        email,
      },
    })
    expect(response.body.data).not.toHaveProperty("passwordHash")
    expect(response.body.data).not.toHaveProperty("password")
  })

  it("rejects an invalid email", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: "invalid-email", password: "password123" })

    expect(response.status).toBe(400)
    expect(response.body).toMatchObject({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: { email: ["Invalid email address"] },
      },
    })
  })

  it.each(["short7", "a".repeat(73)])(
    "rejects a password outside the 8-72 character range",
    async (password) => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({ email: `${randomUUID()}@example.com`, password })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe("VALIDATION_ERROR")
      expect(response.body.error.details.password).toBeDefined()
    },
  )

  it("rejects a duplicate normalized email", async () => {
    const email = uniqueEmail()
    await prisma.user.create({
      data: { email, passwordHash: "existing-password-hash" },
    })

    const response = await request(app)
      .post("/api/auth/register")
      .send({ email: email.toUpperCase(), password: "password123" })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: {
        code: "EMAIL_ALREADY_EXISTS",
        message: "Email already exists",
      },
    })
  })

  it("stores the password as a bcrypt hash", async () => {
    const email = uniqueEmail()
    const password = "password123"

    await request(app).post("/api/auth/register").send({ email, password })

    const user = await prisma.user.findUniqueOrThrow({ where: { email } })
    expect(user.passwordHash).not.toBe(password)
    await expect(bcrypt.compare(password, user.passwordHash)).resolves.toBe(true)
  })
})
