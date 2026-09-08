import { Router } from "express"

import { validateRequest } from "../../middleware/validate-request.js"
import { register } from "./auth.controller.js"
import { registerSchema } from "./auth.schema.js"

export const authRouter = Router()

authRouter.post("/register", validateRequest({ body: registerSchema }), register)
