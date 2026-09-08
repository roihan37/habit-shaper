import { afterEach, describe, expect, it, vi } from "vitest"

import { authRepository } from "./auth.repository.js"
import { authService } from "./auth.service.js"

describe("authService.register", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("maps a database unique constraint race to EMAIL_ALREADY_EXISTS", async () => {
    vi.spyOn(authRepository, "findUserByEmail").mockResolvedValue(null)
    vi.spyOn(authRepository, "createUser").mockRejectedValue({ code: "P2002" })

    await expect(
      authService.register({
        email: "user@example.com",
        password: "password123",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: "EMAIL_ALREADY_EXISTS",
      message: "Email already exists",
    })
  })
})
