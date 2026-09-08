import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { env } from "./config/env.js"
import { errorHandler } from "./middleware/error-handler.js"
import { authRouter } from "./modules/auth/auth.routes.js"
import { habitRouter } from "./modules/habits/habit.routes.js"

export const app = express()

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
)

app.use(express.json())
app.use(cookieParser())

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
  })
})

app.use("/api/auth", authRouter)
app.use("/api/habits", habitRouter)

app.use(errorHandler)
