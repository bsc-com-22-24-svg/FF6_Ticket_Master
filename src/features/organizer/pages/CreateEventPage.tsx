import { useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import EventForm from '../components/EventForm'
import { getEvent, saveEvent, type EventInput } from '../../../lib/events'

export function CreateEventPage() {
  const { eventId } = useParams({ strict: false }) as { eventId?: string }
  const isEdit = !!eventId
  const initial = eventId ? getEvent(eventId) : undefined

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(values: EventInput) {
    setIsSaving(true)
    // Simulate a network round-trip, then persist to the shared store.
    await new Promise((resolve) => setTimeout(resolve, 400))
    saveEvent(values)
    await queryClient.invalidateQueries({ queryKey: ['events'] })
    setIsSaving(false)
    await navigate({ to: '/organizer/dashboard' })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">
            {isEdit ? 'Edit Event' : 'Create Event'}
          </h1>
          <p className="mt-2 text-slate-600">
            {isEdit
              ? 'Update the details and save your changes.'
              : 'Fill in the details below to list a new event.'}
          </p>
        </div>
        {isEdit && !initial ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
            That event could not be found.
          </div>
        ) : (
          <EventForm
            key={eventId ?? 'new'}
            initialEvent={initial}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  )
}
