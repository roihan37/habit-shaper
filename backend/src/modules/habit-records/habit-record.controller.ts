import type { Request, Response } from "express"

import type { HabitIdParams } from "../habits/habit.schema.js"
import { habitRecordService } from "./habit-record.service.js"
import type { HistoricalRecordParams } from "./habit-record.schema.js"

export const trackToday = async (req: Request, res: Response) => {
  const { habitId } = req.params as HabitIdParams
  const record = await habitRecordService.trackToday(
    req.user!.id,
    habitId,
    req.body,
  )

  return res.status(200).json({ data: record })
}

export const trackHistoricalDate = async (req: Request, res: Response) => {
  const { habitId, date } = req.params as HistoricalRecordParams
  const record = await habitRecordService.trackHistoricalDate(
    req.user!.id,
    habitId,
    date,
    req.body,
  )

  return res.status(200).json({ data: record })
}
