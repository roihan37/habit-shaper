import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog'
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
import {
  createGoalSchema,
  type CreateGoalInput,
} from './create-goal-schema'
import { goalsQueryKey, type Goal } from './use-goals'

function getFieldMessage(details: unknown, field: keyof CreateGoalInput) {
  if (typeof details !== 'object' || details === null || !(field in details)) {
    return undefined
  }

  const messages = (details as Record<string, unknown>)[field]
  return Array.isArray(messages) && typeof messages[0] === 'string'
    ? messages[0]
    : undefined
}

export function CreateGoalDialog({ habits }: { habits: Habit[] }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
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
    defaultValues: { habitId: '', title: '', description: '' },
  })
  const createMutation = useMutation({
    mutationFn: (input: CreateGoalInput) => {
      const description = input.description?.trim()

      return apiRequest<Goal>('/api/goals', {
        method: 'POST',
        body: {
          habitId: input.habitId,
          title: input.title,
          ...(description ? { description } : {}),
        },
      })
    },
  })

  const handleOpenChange = (nextOpen: boolean) => {
    if (createMutation.isPending) return
    setOpen(nextOpen)
    if (nextOpen) setFormError(null)
  }

  const onSubmit = handleSubmit(async (input) => {
    setFormError(null)

    try {
      await createMutation.mutateAsync(input)
      await queryClient.invalidateQueries({ queryKey: goalsQueryKey })
      reset()
      setOpen(false)
      toast.success('Goal created successfully.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const habitIdMessage = getFieldMessage(error.details, 'habitId')
        const titleMessage = getFieldMessage(error.details, 'title')
        const descriptionMessage = getFieldMessage(error.details, 'description')

        if (habitIdMessage) setError('habitId', { message: habitIdMessage })
        if (titleMessage) setError('title', { message: titleMessage })
        if (descriptionMessage) {
          setError('description', { message: descriptionMessage })
        }
        if (habitIdMessage || titleMessage || descriptionMessage) return
      }

      if (error instanceof ApiError && error.code === 'HABIT_NOT_FOUND') {
        setError('habitId', { message: 'This habit is no longer available.' })
        await queryClient.invalidateQueries({ queryKey: habitsQueryKey })
        return
      }

      setFormError('Unable to create goal. Please try again.')
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button><Plus aria-hidden="true" />Create goal</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a goal</DialogTitle>
          <DialogDescription>Connect a clear goal to one of your habits.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" id="create-goal-form" onSubmit={onSubmit} noValidate>
          {formError && (
            <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="goal-habit">Habit</Label>

            <Controller
              control={control}
              name="habitId"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={habits.length === 0}
                >
                  <SelectTrigger
  id="goal-habit"
  aria-invalid={errors.habitId ? 'true' : 'false'}
  aria-describedby={
    errors.habitId ? 'goal-habit-error' : undefined
  }
>
  <SelectValue placeholder="Select a habit" />
</SelectTrigger>

                  <SelectContent position="popper" sideOffset={6}>
  {habits.map((habit) => (
    <SelectItem key={habit.id} value={habit.id}>
      {habit.name} · {habit.type === 'BUILD' ? 'Build' : 'Break'}
    </SelectItem>
  ))}
</SelectContent>
                </Select>
              )}
            />

            {habits.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Create a habit before adding a goal.
              </p>
            )}

            {errors.habitId && (
              <p
                className="text-xs text-destructive"
                id="goal-habit-error"
                role="alert"
              >
                {errors.habitId.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-title">Goal title</Label>
            <Input id="goal-title" autoComplete="off" placeholder="e.g. Read every day for 30 days" aria-invalid={errors.title ? 'true' : 'false'} aria-describedby={errors.title ? 'goal-title-error' : undefined} {...register('title')} />
            {errors.title && <p className="text-xs text-destructive" id="goal-title-error" role="alert">{errors.title.message}</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-description">Description (optional)</Label>
            <Textarea className="min-h-24 resize-y" id="goal-description" placeholder="Add a short note about this goal" aria-invalid={errors.description ? 'true' : 'false'} aria-describedby={errors.description ? 'goal-description-error' : undefined} {...register('description')} />
            {errors.description && <p className="text-xs text-destructive" id="goal-description-error" role="alert">{errors.description.message}</p>}
          </div>
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" disabled={createMutation.isPending} onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" form="create-goal-form" disabled={createMutation.isPending || habits.length === 0}>
            {createMutation.isPending && <LoaderCircle className="animate-spin" aria-hidden="true" />}
            {createMutation.isPending ? 'Creating goal…' : 'Create goal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
