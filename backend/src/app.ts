import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

export const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
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