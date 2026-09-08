import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

import { env } from "../../config/env.js"
import { AppError } from "../../utils/app-error.js"
import { authRepository } from "./auth.repository.js"
import type { LoginInput, RegisterInput } from "./auth.schema.js"


export const authService = {
  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId)

    if (!user) {
      throw authenticationRequiredError()
    }

    return user
  },

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

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email)

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw invalidCredentialsError()
    }

    const token = jwt.sign({}, env.AUTH_SECRET, {
      subject: user.id,
      expiresIn: "7d",
    })

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
      },
    }
  },
}

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

function invalidCredentialsError() {
  return new AppError(
    401,
    "INVALID_CREDENTIALS",
    "Invalid email or password",
  )
}

function authenticationRequiredError() {
  return new AppError(
    401,
    "AUTHENTICATION_REQUIRED",
    "Authentication required",
  )
}
