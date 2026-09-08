import bcrypt from "bcrypt"

import { AppError } from "../../utils/app-error.js"
import { authRepository } from "./auth.repository.js"
import type { RegisterInput } from "./auth.schema.js"

function isUniqueConstraintError(error: unknown): error is { code: "P2002" } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
}

function emailAlreadyExistsError() {
  return new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already exists")
}

export const authService = {
  async register(input: RegisterInput) {
    const existingUser = await authRepository.findUserByEmail(input.email)

    if (existingUser) {
      throw emailAlreadyExistsError()
    }

    const passwordHash = await bcrypt.hash(input.password, 12)

    try {
      return await authRepository.createUser(input.email, passwordHash)
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw emailAlreadyExistsError()
      }

      throw error
    }
  },
}
