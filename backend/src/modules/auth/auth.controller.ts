import type { CookieOptions, Request, Response } from "express"

import { env } from "../../config/env.js"
import { authService } from "./auth.service.js"

export const AUTH_COOKIE_NAME = "auth_token"
const AUTH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1_000

function getAuthCookieBaseOptions(
  nodeEnv: typeof env.NODE_ENV,
): CookieOptions {
  return {
    httpOnly: true,
    secure: nodeEnv === "production",
    sameSite: "lax",
    path: "/",
  }
}

export function getAuthCookieOptions(
  nodeEnv: typeof env.NODE_ENV = env.NODE_ENV,
): CookieOptions {
  return {
    ...getAuthCookieBaseOptions(nodeEnv),
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  }
}

export function getAuthCookieClearOptions(
  nodeEnv: typeof env.NODE_ENV = env.NODE_ENV,
): CookieOptions {
  return getAuthCookieBaseOptions(nodeEnv)
}

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body)
  
  return res.status(201).json({
    data: user,
  })
}

export const login = async (req: Request, res: Response) => {
  const { token, user } = await authService.login(req.body)
  
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions())
  return res.status(200).json({ data: user })
}

export const getCurrentUser = async (req: Request, res: Response) => {
  const user = await authService.getCurrentUser(req.user!.id)
  return res.status(200).json({ data: user })
}

export const logout = (_req: Request, res: Response) => {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieClearOptions())
  return res.status(204).send()
}
