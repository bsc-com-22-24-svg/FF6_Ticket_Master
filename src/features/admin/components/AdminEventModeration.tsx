import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../../toast'
import { updateAdminEventStatus, type AdminEventStatus } from '../../../lib/backendAdmin'

const fieldClass = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy'

export function AdminEventModeration() {
  const [eventId, setEventId] = useState('')
  const [status, setStatus] = useState<AdminEventStatus>('CANCELLED')
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => updateAdminEventStatus(eventId.trim(), status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['organizer-events'] }),
      ])
      showToast('Event status updated', 'success')
    },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Could not update event status', 'error'),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!eventId.trim()) {
      showToast('Enter the backend event ID.', 'error')
      return
    }
    mutation.mutate()
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-navy-dark">Event moderation</h2>
      <p className="mt-1 text-sm text-slate-600">
        Set an event status using the backend event ID. The backend authorizes this admin operation.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
        <label className="block text-sm font-medium text-slate-700">
          Event ID
          <input
            aria-label="Event ID"
            className={fieldClass}
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          New status
          <select
            aria-label="New event status"
            className={fieldClass}
            value={status}
            onChange={(event) => setStatus(event.target.value as AdminEventStatus)}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-50"
        >
          {mutation.isPending ? 'Saving…' : 'Update status'}
        </button>
      </form>
    </section>
  )
}
