import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { LoaderCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { Badge } from '../components/ui/badge'
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
import { Textarea } from '../components/ui/textarea'
import { ApiError, apiRequest } from '../services/api'
import { editHabitSchema, type EditHabitInput } from './edit-habit-schema'
import {
  habitQueryKey,
  habitsQueryKey,
  type Habit,
} from './use-habits'

function fieldMessage(details: unknown, field: keyof EditHabitInput) {
  if (typeof details !== 'object' || details === null || !(field in details)) {
    return undefined
  }
  const messages = (details as Record<string, unknown>)[field]
  return Array.isArray(messages) && typeof messages[0] === 'string'
    ? messages[0]
    : undefined
}

export function HabitActions({ habit }: { habit: Habit }) {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<EditHabitInput>({
    resolver: zodResolver(editHabitSchema),
    defaultValues: {
      name: habit.name,
      description: habit.description ?? '',
    },
  })

  const refreshHabitData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: habitsQueryKey, exact: true }),
      queryClient.invalidateQueries({ queryKey: habitQueryKey(habit.id) }),
    ])
  }

  const updateMutation = useMutation({
    mutationFn: (input: EditHabitInput) =>
      apiRequest<Habit>(`/api/habits/${habit.id}`, {
        method: 'PATCH',
        body: {
          name: input.name,
          description: input.description.trim() || null,
        },
      }),
  })
  const deleteMutation = useMutation({
    mutationFn: () =>
      apiRequest(`/api/habits/${habit.id}`, { method: 'DELETE' }),
  })

  const openEdit = () => {
    reset({ name: habit.name, description: habit.description ?? '' })
    setFormError(null)
    setEditOpen(true)
  }

  const onEdit = handleSubmit(async (input) => {
    setFormError(null)
    try {
      await updateMutation.mutateAsync(input)
      await refreshHabitData()
      setEditOpen(false)
      toast.success('Habit updated successfully.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        const name = fieldMessage(error.details, 'name')
        const description = fieldMessage(error.details, 'description')
        if (name) setError('name', { message: name })
        if (description) setError('description', { message: description })
        if (name || description) return
      }
      if (error instanceof ApiError && error.code === 'HABIT_NOT_FOUND') {
        setEditOpen(false)
        await refreshHabitData()
        toast.error('This habit no longer exists.')
        return
      }
      setFormError('Unable to update habit. Please try again.')
    }
  })

  const onDelete = async () => {
    try {
      await deleteMutation.mutateAsync()
      queryClient.removeQueries({ queryKey: habitQueryKey(habit.id) })
      await queryClient.invalidateQueries({
        queryKey: habitsQueryKey,
        exact: true,
      })
      setDeleteOpen(false)
      toast.success('Habit deleted successfully.')
    } catch (error) {
      if (error instanceof ApiError && error.code === 'HABIT_NOT_FOUND') {
        queryClient.removeQueries({ queryKey: habitQueryKey(habit.id) })
        await queryClient.invalidateQueries({
          queryKey: habitsQueryKey,
          exact: true,
        })
        setDeleteOpen(false)
        toast.error('This habit no longer exists.')
        return
      }
      toast.error('Unable to delete habit. Please try again.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="shrink-0 text-muted-foreground"
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${habit.name}`}
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={openEdit}>
            <Pencil aria-hidden="true" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!updateMutation.isPending) setEditOpen(open)
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] rounded-xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit habit</DialogTitle>
            <DialogDescription>
              Update the details for this habit. Its type cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <form className="grid gap-5" id={`edit-habit-${habit.id}`} onSubmit={onEdit} noValidate>
            {formError && (
              <Alert variant="destructive">
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}
            <div className="grid gap-2">
              <Label htmlFor={`habit-name-${habit.id}`}>Habit name</Label>
              <Input
                id={`habit-name-${habit.id}`}
                aria-invalid={errors.name ? 'true' : 'false'}
                aria-describedby={errors.name ? `habit-name-error-${habit.id}` : undefined}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive" id={`habit-name-error-${habit.id}`} role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`habit-description-${habit.id}`}>Description (optional)</Label>
              <Textarea
                className="min-h-24 resize-y"
                id={`habit-description-${habit.id}`}
                aria-invalid={errors.description ? 'true' : 'false'}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive" role="alert">
                  {errors.description.message}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3">
              <span className="text-sm text-muted-foreground">Habit type</span>
              <Badge variant="outline">{habit.type === 'BUILD' ? 'Build' : 'Break'}</Badge>
            </div>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={updateMutation.isPending} onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form={`edit-habit-${habit.id}`} disabled={updateMutation.isPending}>
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
            <AlertDialogTitle>Delete habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete “{habit.name}” and its related tracking data.
            </AlertDialogDescription>
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
              {deleteMutation.isPending ? 'Deleting habit…' : 'Delete habit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
