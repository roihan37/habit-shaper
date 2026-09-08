import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { env } from "./config/env.js"

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
