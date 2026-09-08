import type { Request, Response } from "express"

import type { GoalIdParams, ListGoalsQuery } from "./goal.schema.js"
import { goalService } from "./goal.service.js"

function authenticatedUserId(req: Request) {
  return req.user!.id
}

export const listGoals = async (req: Request, res: Response) => {
  const { habitId } = req.query as ListGoalsQuery
  const goals = await goalService.listGoals(authenticatedUserId(req), habitId)
  return res.status(200).json({ data: goals })
}

export const createGoal = async (req: Request, res: Response) => {
  const goal = await goalService.createGoal(authenticatedUserId(req), req.body)
  return res.status(201).json({ data: goal })
}

export const updateGoal = async (req: Request, res: Response) => {
  const { goalId } = req.params as GoalIdParams
  const goal = await goalService.updateGoal(
    authenticatedUserId(req),
    goalId,
    req.body,
  )
  return res.status(200).json({ data: goal })
}

export const deleteGoal = async (req: Request, res: Response) => {
  const { goalId } = req.params as GoalIdParams
  await goalService.deleteGoal(authenticatedUserId(req), goalId)
  return res.status(204).send()
}
