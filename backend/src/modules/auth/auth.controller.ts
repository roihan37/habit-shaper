import type { Request, Response } from "express"

import { authService } from "./auth.service.js"

export const register = async (req: Request, res: Response) => {
  const user = await authService.register(req.body)

  return res.status(201).json({
    data: user,
  })
}