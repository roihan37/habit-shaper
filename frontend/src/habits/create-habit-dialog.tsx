import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleOff, Leaf, LoaderCircle, Plus } from 'lucide-react'
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
  RadioGroup,
  RadioGroupItem,
} from '../components/ui/radio-group'
import { Textarea } from '../components/ui/textarea'
import { ApiError, apiRequest } from '../services/api'
import {
  createHabitSchema,
  type CreateHabitInput,
} from './create-habit-schema'
import { habitsQueryKey, type Habit } from './use-habits'

function getFieldMessage(details: unknown, field: keyof CreateHabitInput) {
  if (typeof details !== 'object' || details === null || !(field in details)) {
    return undefined
  }

  const messages = (details as Record<string, unknown>)[field]
  return Array.isArray(messages) && typeof messages[0] === 'string'
    ? messages[0]
    : undefined
}

export function CreateHabitDialog() {
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
  } = useForm<CreateHabitInput>({
    resolver: zodResolver(createHabitSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'BUILD',
    },
  })
  const createMutation = useMutation({
    mutationFn: (input: CreateHabitInput) => {
      const description = input.description?.trim()

      return apiRequest<Habit>('/api/habits', {
        method: 'POST',
        body: {
          name: input.name,
          ...(description ? { description } : {}),
          type: input.type,
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
      await queryClient.invalidateQueries({ queryKey: habitsQueryKey })
      reset()
      setOpen(false)
      toast.success('Habit created successfully.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const nameMessage = getFieldMessage(error.details, 'name')
        const descriptionMessage = getFieldMessage(error.details, 'description')
        const typeMessage = getFieldMessage(error.details, 'type')

        if (nameMessage) setError('name', { message: nameMessage })
        if (descriptionMessage) {
          setError('description', { message: descriptionMessage })
        }
        if (typeMessage) setError('type', { message: typeMessage })
        if (nameMessage || descriptionMessage || typeMessage) return
      }

      setFormError('Unable to create habit. Please try again.')
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          New habit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a habit</DialogTitle>
          <DialogDescription>
            Add a routine you want to build or a pattern you want to break.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-5" id="create-habit-form" onSubmit={onSubmit} noValidate>
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-2">
            <Label htmlFor="habit-name">Habit name</Label>
            <Input
              id="habit-name"
              autoComplete="off"
              placeholder="e.g. Read ten pages"
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'habit-name-error' : undefined}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive" id="habit-name-error" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="habit-description">Description (optional)</Label>
            <Textarea
              className="min-h-24 resize-y"
              id="habit-description"
              placeholder="Add a short note about this habit"
              aria-invalid={errors.description ? 'true' : 'false'}
              aria-describedby={
                errors.description ? 'habit-description-error' : undefined
              }
              {...register('description')}
            />
            {errors.description && (
              <p
                className="text-xs text-destructive"
                id="habit-description-error"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium">Habit type</legend>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <RadioGroup
                  className="grid gap-3 sm:grid-cols-2"
                  value={field.value}
                  onValueChange={field.onChange}
                  aria-invalid={errors.type ? 'true' : 'false'}
                  aria-describedby={errors.type ? 'habit-type-error' : undefined}
                >
                  <Label
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5"
                    htmlFor="habit-type-build"
                  >
                    <RadioGroupItem id="habit-type-build" value="BUILD" />
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        <Leaf className="size-4 text-primary" aria-hidden="true" />
                        Build
                      </span>
                      <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                        Build a positive habit
                      </span>
                    </span>
                  </Label>
                  <Label
                    className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-4 transition-colors has-[[data-state=checked]]:border-amber-400 has-[[data-state=checked]]:bg-amber-50"
                    htmlFor="habit-type-break"
                  >
                    <RadioGroupItem id="habit-type-break" value="BREAK" />
                    <span>
                      <span className="flex items-center gap-2 font-semibold">
                        <CircleOff className="size-4 text-amber-700" aria-hidden="true" />
                        Break
                      </span>
                      <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">
                        Break a negative habit
                      </span>
                    </span>
                  </Label>
                </RadioGroup>
              )}
            />
            {errors.type && (
              <p className="text-xs text-destructive" id="habit-type-error" role="alert">
                {errors.type.message}
              </p>
            )}
          </fieldset>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={createMutation.isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-habit-form"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            )}
            {createMutation.isPending ? 'Creating habit…' : 'Create habit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
