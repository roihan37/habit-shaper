import { Router } from "express"

import { validateRequest } from "../../middleware/validate-request.js"
import { login, register } from "./auth.controller.js"
import { loginSchema, registerSchema } from "./auth.schema.js"

export const authRouter = Router()

authRouter.post("/register", validateRequest({ body: registerSchema }), register)
authRouter.post("/login", validateRequest({ body: loginSchema }), login)
