import type { Request, RequestHandler } from "express"
import jwt from "jsonwebtoken"

import { env } from "../config/env.js"
import { AUTH_COOKIE_NAME } from "../modules/auth/auth.controller.js"
import { AppError } from "../utils/app-error.js"

function authenticationRequiredError() {
  return new AppError(
    401,
    "AUTHENTICATION_REQUIRED",
    "Authentication required",
  )
}

function readAuthenticationCookie(req: Request): unknown {
  const cookies: unknown = req.cookies

  if (typeof cookies !== "object" || cookies === null) {
    return undefined
  }

  return (cookies as Record<string, unknown>)[AUTH_COOKIE_NAME]
}

export const authenticate: RequestHandler = (req, _res, next) => {
  const token = readAuthenticationCookie(req)

  if (typeof token !== "string" || token.length === 0) {
    next(authenticationRequiredError())
    return
  }

  try {
    const payload = jwt.verify(token, env.AUTH_SECRET)

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      payload.sub.length === 0
    ) {
      next(authenticationRequiredError())
      return
    }

    req.user = { id: payload.sub }
    next()
  } catch {
    next(authenticationRequiredError())
  }
}
