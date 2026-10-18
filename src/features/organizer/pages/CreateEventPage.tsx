import { useParams } from '@tanstack/react-router'
import EventForm from '../components/EventForm'
import type { EventInput, EventItem } from '../types/Event'

const MOCK_EVENT: EventItem = {
  id: 'lake-of-stars',
  name: 'Lake of Stars Live',
  description: 'Three days of music, art and culture on the shores of Lake Malawi.',
  date: '2026-11-14',
  time: '17:00',
  location: 'Cape Maclear Beach, Mangochi',
  category: 'Music',
  imageUrl: '/images/events/event-1.webp',
  status: 'Published',
  ticketTypes: [
    { id: 'general', name: 'General', price: 35000, capacity: 800 },
    { id: 'vip', name: 'VIP', price: 75000, capacity: 120 },
  ],
  ticketsSold: 480 + 45,
  revenue: 480 * 35000 + 45 * 75000,
  checkedIn: 42,
}

export function CreateEventPage() {
  const { eventId } = useParams({ strict: false }) as { eventId?: string }
  const isEdit = !!eventId
  const initial = isEdit ? MOCK_EVENT : undefined

  async function handleSubmit(values: EventInput) {
    // Mock submit - in real app this would call an API
    console.log('Submitting event:', values)
    await new Promise((r) => setTimeout(r, 600))
    alert(isEdit ? 'Event updated (mock)' : 'Event created (mock)')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{isEdit ? 'Edit Event' : 'Create Event'}</h1>
          <p className="mt-2 text-slate-600">Fill in the details below</p>
        </div>
        <EventForm initialEvent={initial} onSubmit={handleSubmit} isSaving={false} />
      </div>
    </div>
  )
}
