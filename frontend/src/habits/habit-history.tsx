import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, LoaderCircle, Pencil } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Skeleton } from '../components/ui/skeleton'
import { apiRequest } from '../services/api'
import {
  getLocalCalendarDate,
  habitRecordsQueryKey,
  habitStatsQueryKey,
  useHabitRecords,
  type HabitRecord,
  type HabitRecordStatus,
} from './use-habit-detail'
import type { Habit } from './use-habits'

function shiftCalendarDate(calendarDate: string, days: number) {
  const date = new Date(`${calendarDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function formatRecordDate(calendarDate: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${calendarDate}T00:00:00Z`))
}

function statusLabel(type: Habit['type'], status: HabitRecordStatus) {
  if (type === 'BUILD') {
    return status === 'SUCCESS' ? 'Completed' : 'Missed'
  }

  return status === 'SUCCESS' ? 'Clean' : 'Relapsed'
}

export function HabitHistory({ habit }: { habit: Habit }) {
  const queryClient = useQueryClient()
  const today = getLocalCalendarDate()
  const from = shiftCalendarDate(today, -6)
  const historyQuery = useHabitRecords(habit.id, from, today, true)
  const [editingRecord, setEditingRecord] = useState<HabitRecord | null>(null)
  const [nextStatus, setNextStatus] =
    useState<HabitRecordStatus>('SUCCESS')
  const correctionMutation = useMutation({
    mutationFn: ({ date, status }: { date: string; status: HabitRecordStatus }) =>
      apiRequest<HabitRecord>(`/api/habits/${habit.id}/records/${date}`, {
        method: 'PUT',
        body: { status },
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: habitRecordsQueryKey(habit.id),
        }),
        queryClient.invalidateQueries({
          queryKey: habitStatsQueryKey(habit.id),
        }),
      ])
      setEditingRecord(null)
      toast.success('Tracking record updated successfully.')
    },
    onError: () => {
      toast.error('Unable to update this tracking record. Please try again.')
    },
  })
  const records = [...(historyQuery.data ?? [])].reverse()

  const editRecord = (record: HabitRecord) => {
    setNextStatus(record.status)
    setEditingRecord(record)
  }

  const saveCorrection = () => {
    if (!editingRecord || correctionMutation.isPending) return
    correctionMutation.mutate({
      date: editingRecord.recordDate,
      status: nextStatus,
    })
  }

  return (
    <section className="mt-10" aria-labelledby="tracking-history-heading">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" aria-hidden="true" />
          <h2 className="text-lg font-semibold" id="tracking-history-heading">
            Tracking history
          </h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Recent 7 days. Only recorded days are shown.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          {historyQuery.isPending ? (
            <div
              className="grid gap-3"
              aria-label="Loading tracking history"
              aria-busy="true"
            >
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : historyQuery.isError ? (
            <div role="alert">
              <p className="text-sm text-muted-foreground">
                Unable to load tracking history.
              </p>
              <Button
                className="mt-3"
                type="button"
                variant="outline"
                onClick={() => void historyQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="py-4 text-center">
              <p className="font-medium">No tracking history yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your recorded days will appear here.
              </p>
            </div>
          ) : (
            <ul className="grid gap-2" aria-label="Habit tracking records">
              {records.map((record) => (
                <li
                  key={record.id}
                  className="flex flex-col items-start gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center"
                >
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    {formatRecordDate(record.recordDate)}
                    {record.recordDate === today ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        Today
                      </span>
                    ) : null}
                  </span>
                  <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
                    <Badge
                      variant="outline"
                      className={
                        record.status === 'SUCCESS'
                          ? 'border-primary/20 bg-primary/10 text-primary'
                          : 'border-destructive/20 bg-destructive/5 text-destructive'
                      }
                    >
                      {statusLabel(habit.type, record.status)}
                    </Badge>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => editRecord(record)}
                      aria-label={`Edit tracking result for ${formatRecordDate(record.recordDate)}`}
                    >
                      <Pencil aria-hidden="true" />
                      Edit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingRecord !== null}
        onOpenChange={(open) => {
          if (!open && !correctionMutation.isPending) setEditingRecord(null)
        }}
      >
        <DialogContent className="max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Correct tracking record</DialogTitle>
            <DialogDescription>
              Update the result for{' '}
              {editingRecord ? formatRecordDate(editingRecord.recordDate) : ''}.
              Statistics will be recalculated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-2">
            <Label htmlFor={`history-status-${habit.id}`}>Result</Label>
            <Select
              value={nextStatus}
              onValueChange={(value) =>
                setNextStatus(value as HabitRecordStatus)
              }
            >
              <SelectTrigger id={`history-status-${habit.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={6}>
                <SelectItem value="SUCCESS">
                  {habit.type === 'BUILD' ? 'Completed' : 'Clean'}
                </SelectItem>
                <SelectItem value="FAILURE">
                  {habit.type === 'BUILD' ? 'Missed' : 'Relapsed'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={correctionMutation.isPending}
              onClick={() => setEditingRecord(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                correctionMutation.isPending ||
                editingRecord?.status === nextStatus
              }
              onClick={saveCorrection}
            >
              {correctionMutation.isPending && (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              )}
              {correctionMutation.isPending
                ? 'Saving…'
                : editingRecord?.status === nextStatus
                  ? 'No changes'
                  : 'Save correction'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
