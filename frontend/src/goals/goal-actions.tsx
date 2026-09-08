import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '../components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Textarea } from '../components/ui/textarea'
import { habitsQueryKey, type Habit } from '../habits/use-habits'
import { ApiError, apiRequest } from '../services/api'
import { createGoalSchema, type CreateGoalInput } from './create-goal-schema'
import { goalsQueryKey, type Goal } from './use-goals'

function fieldMessage(details: unknown, field: keyof CreateGoalInput) {
  if (typeof details !== 'object' || details === null || !(field in details)) {
    return undefined
  }
  const messages = (details as Record<string, unknown>)[field]
  return Array.isArray(messages) && typeof messages[0] === 'string'
    ? messages[0]
    : undefined
}

export function GoalActions({ goal, habits }: { goal: Goal; habits: Habit[] }) {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<CreateGoalInput>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      habitId: goal.habitId,
      title: goal.title,
      description: goal.description ?? '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (input: CreateGoalInput) =>
      apiRequest<Goal>(`/api/goals/${goal.id}`, {
        method: 'PATCH',
        body: {
          habitId: input.habitId,
          title: input.title,
          description: input.description?.trim() || null,
        },
      }),
  })
  const deleteMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/goals/${goal.id}`, { method: 'DELETE' }),
  })

  const refreshGoals = () =>
    queryClient.invalidateQueries({ queryKey: goalsQueryKey, exact: true })

  const openEdit = () => {
    reset({
      habitId: goal.habitId,
      title: goal.title,
      description: goal.description ?? '',
    })
    setFormError(null)
    setEditOpen(true)
  }

  const onEdit = handleSubmit(async (input) => {
    setFormError(null)
    try {
      await updateMutation.mutateAsync(input)
      await refreshGoals()
      setEditOpen(false)
      toast.success('Goal updated successfully.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const habitId = fieldMessage(error.details, 'habitId')
        const title = fieldMessage(error.details, 'title')
        const description = fieldMessage(error.details, 'description')
        if (habitId) setError('habitId', { message: habitId })
        if (title) setError('title', { message: title })
        if (description) setError('description', { message: description })
        if (habitId || title || description) return
      }
      if (error instanceof ApiError && error.code === 'HABIT_NOT_FOUND') {
        setError('habitId', { message: 'This habit is no longer available.' })
        await queryClient.invalidateQueries({ queryKey: habitsQueryKey })
        return
      }
      if (error instanceof ApiError && error.code === 'GOAL_NOT_FOUND') {
        setEditOpen(false)
        await refreshGoals()
        toast.error('This goal no longer exists.')
        return
      }
      setFormError('Unable to update goal. Please try again.')
    }
  })

  const onDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
      await refreshGoals()
      setDeleteOpen(false)
      toast.success('Goal deleted successfully.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'GOAL_NOT_FOUND') {
        await refreshGoals()
        setDeleteOpen(false)
        toast.error('This goal no longer exists.')
        return
      }
      toast.error('Unable to delete goal. Please try again.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="shrink-0 text-muted-foreground" variant="ghost" size="icon" aria-label={`Actions for ${goal.title}`}>
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openEdit}><Pencil aria-hidden="true" />Edit</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleteOpen(true)}><Trash2 aria-hidden="true" />Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={(open) => {
        if (!updateMutation.isPending) setEditOpen(open)
      }}>
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
            <DialogDescription>Update this goal and the habit it supports.</DialogDescription>
          </DialogHeader>
          <form className="grid gap-5" id={`edit-goal-${goal.id}`} onSubmit={onEdit} noValidate>
            {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
            <div className="grid gap-2">
              <Label htmlFor={`goal-habit-${goal.id}`}>Habit</Label>
              <Controller
                control={control}
                name="habitId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={`goal-habit-${goal.id}`} aria-invalid={errors.habitId ? 'true' : 'false'} aria-describedby={errors.habitId ? `goal-habit-error-${goal.id}` : undefined}>
                      <SelectValue placeholder="Select a habit" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={6}>
                      {habits.map((habit) => (
                        <SelectItem key={habit.id} value={habit.id}>{habit.name} · {habit.type === 'BUILD' ? 'Build' : 'Break'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.habitId && <p className="text-xs text-destructive" id={`goal-habit-error-${goal.id}`} role="alert">{errors.habitId.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`goal-title-${goal.id}`}>Goal title</Label>
              <Input id={`goal-title-${goal.id}`} aria-invalid={errors.title ? 'true' : 'false'} aria-describedby={errors.title ? `goal-title-error-${goal.id}` : undefined} {...register('title')} />
              {errors.title && <p className="text-xs text-destructive" id={`goal-title-error-${goal.id}`} role="alert">{errors.title.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`goal-description-${goal.id}`}>Description (optional)</Label>
              <Textarea className="min-h-24 resize-y" id={`goal-description-${goal.id}`} aria-invalid={errors.description ? 'true' : 'false'} aria-describedby={errors.description ? `goal-description-error-${goal.id}` : undefined} {...register('description')} />
              {errors.description && <p className="text-xs text-destructive" id={`goal-description-error-${goal.id}`} role="alert">{errors.description.message}</p>}
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" form={`edit-goal-${goal.id}`} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {updateMutation.isPending ? 'Saving changes…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={(open) => {
        if (!deleteMutation.isPending) setDeleteOpen(open)
      }}>
        <AlertDialogContent className="w-[calc(100%-2rem)] rounded-xl sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>This action will permanently delete this goal.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void onDelete()
              }}
            >
              {deleteMutation.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
              {deleteMutation.isPending ? 'Deleting goal…' : 'Delete goal'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
