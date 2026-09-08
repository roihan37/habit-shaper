import { Router } from "express"

import { authenticate } from "../../middleware/authenticate.js"
import { validateRequest } from "../../middleware/validate-request.js"
import { getCurrentUser, login, logout, register } from "./auth.controller.js"
import { loginSchema, registerSchema } from "./auth.schema.js"

export const authRouter = Router()

authRouter.post("/register", validateRequest({ body: registerSchema }), register)
authRouter.post("/login", validateRequest({ body: loginSchema }), login)
authRouter.get("/me", authenticate, getCurrentUser)
authRouter.post("/logout", authenticate, logout)
