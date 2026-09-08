import type { Request, Response } from "express"

import { habitService } from "./habit.service.js"
import type { HabitIdParams, ListHabitsQuery } from "./habit.schema.js"

function authenticatedUserId(req: Request) {
  return req.user!.id
}

export const listHabits = async (req: Request, res: Response) => {
  const { type } = req.query as ListHabitsQuery
  const habits = await habitService.listHabits(
    authenticatedUserId(req),
    type,
  )
  return res.status(200).json({ data: habits })
}

export const getHabit = async (req: Request, res: Response) => {
  const { habitId } = req.params as HabitIdParams
  const habit = await habitService.getHabit(
    authenticatedUserId(req),
    habitId,
  )
  return res.status(200).json({ data: habit })
}

export const getHabitStats = async (req: Request, res: Response) => {
  const { habitId } = req.params as HabitIdParams
  const stats = await habitService.getHabitStats(
    authenticatedUserId(req),
    habitId,
  )
  return res.status(200).json({ data: stats })
}

export const createHabit = async (req: Request, res: Response) => {
  const habit = await habitService.createHabit(authenticatedUserId(req), req.body)
  return res.status(201).json({ data: habit })
}

export const updateHabit = async (req: Request, res: Response) => {
  const { habitId } = req.params as HabitIdParams
  const habit = await habitService.updateHabit(
    authenticatedUserId(req),
    habitId,
    req.body,
  )
  return res.status(200).json({ data: habit })
}

export const deleteHabit = async (req: Request, res: Response) => {
  const { habitId } = req.params as HabitIdParams
  await habitService.deleteHabit(authenticatedUserId(req), habitId)
  return res.status(204).send()
}
