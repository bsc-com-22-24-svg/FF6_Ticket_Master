import { useState } from 'react'
import type { EventInput, StoredEvent } from '../../../lib/events'
import type { TicketType } from '../../../types/event'

type Props = {
  initialEvent?: StoredEvent
  onSubmit: (values: EventInput) => Promise<void> | void
  isSaving: boolean
}

const CATEGORIES = ['Festivals', 'Sports', 'Concerts', 'Community', 'Music', 'Theatre', 'Comedy']
const IMAGES = [
  { value: '/images/events/event-1.webp', label: 'Beach / festival' },
  { value: '/images/events/event-2.jpg', label: 'Stadium / sports' },
  { value: '/images/events/event-3.webp', label: 'Concert / stage' },
]

const makeTicket = (): TicketType => ({
  id: `ticket-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
  name: '', price: 0, capacity: 100, sold: 0,
})

const empty: EventInput = {
  title: '', description: '', date: '', time: '', city: '', venue: '',
  category: 'Festivals', organizer: '', image: IMAGES[0].value, status: 'Draft',
  ticketTypes: [makeTicket()],
}

function toInput(event: StoredEvent): EventInput {
  const { id, title, description, date, time, city, venue, category, organizer, image, status, ticketTypes } = event
  return {
    id, title, description, date, time, city, venue, category, organizer, image, status,
    ticketTypes: ticketTypes.map((type) => ({ ...type })),
  }
}

export default function EventForm({ initialEvent, onSubmit, isSaving }: Props) {
  const [values, setValues] = useState<EventInput>(() =>
    initialEvent ? toInput(initialEvent) : { ...empty, ticketTypes: [makeTicket()] },
  )

  function update<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function updateTicket(id: string, patch: Partial<TicketType>) {
    setValues((old) => ({
      ...old,
      ticketTypes: old.ticketTypes.map((type) => (type.id === id ? { ...type, ...patch } : type)),
    }))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); void onSubmit({ ...values, status: 'Pending' }) }}>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Event details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Event name *</span>
                <input required maxLength={100} value={values.title} onChange={(e) => update('title', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" placeholder="e.g. Campus Tech Summit 2026" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Description</span>
                <textarea rows={4} maxLength={1500} value={values.description} onChange={(e) => update('description', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" placeholder="What can attendees expect?" />
              </label>
              <label>
                <span className="text-sm font-medium">Category *</span>
                <select required value={values.category} onChange={(e) => update('category', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy">
                  {CATEGORIES.map((category) => (<option key={category} value={category}>{category}</option>))}
                </select>
              </label>
              <label>
                <span className="text-sm font-medium">Organizer *</span>
                <input required value={values.organizer} onChange={(e) => update('organizer', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" placeholder="e.g. Nyasa Events" />
              </label>
              <label>
                <span className="text-sm font-medium">City *</span>
                <input required value={values.city} onChange={(e) => update('city', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" placeholder="e.g. Lilongwe" />
              </label>
              <label>
                <span className="text-sm font-medium">Venue *</span>
                <input required value={values.venue} onChange={(e) => update('venue', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" placeholder="e.g. Bingu National Stadium" />
              </label>
              <label>
                <span className="text-sm font-medium">Date *</span>
                <input required type="date" value={values.date} onChange={(e) => update('date', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" />
              </label>
              <label>
                <span className="text-sm font-medium">Start time *</span>
                <input required type="time" value={values.time} onChange={(e) => update('time', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy" />
              </label>
              <label className="sm:col-span-2">
                <span className="text-sm font-medium">Cover image</span>
                <select value={values.image} onChange={(e) => update('image', e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy">
                  {IMAGES.map((image) => (<option key={image.value} value={image.value}>{image.label}</option>))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Ticket types</h2>
            <div className="mt-4 space-y-3">
              {values.ticketTypes.map((type) => (
                <div key={type.id} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <input aria-label="Ticket name" required value={type.name} onChange={(e) => updateTicket(type.id, { name: e.target.value })} placeholder="General Admission" className="sm:col-span-5 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy" />
                  <input aria-label="Price in MWK" required type="number" min={0} value={type.price} onChange={(e) => updateTicket(type.id, { price: Number(e.target.value) })} className="sm:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy" />
                  <input aria-label="Ticket capacity" required type="number" min={1} value={type.capacity} onChange={(e) => updateTicket(type.id, { capacity: Number(e.target.value) })} className="sm:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy" />
                  <button type="button" disabled={values.ticketTypes.length === 1} onClick={() => setValues((old) => ({ ...old, ticketTypes: old.ticketTypes.filter((candidate) => candidate.id !== type.id) }))} className="sm:col-span-1 rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">Remove</button>
                </div>
              ))}
              <button type="button" onClick={() => setValues((old) => ({ ...old, ticketTypes: [...old.ticketTypes, makeTicket()] }))} className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50">+ Add ticket type</button>
            </div>
            <p className="mt-3 text-sm text-slate-600">Total capacity: {values.ticketTypes.reduce((sum, type) => sum + (type.capacity || 0), 0).toLocaleString()}</p>
          </section>
        </div>

        <aside>
          <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Publish</h2>
            <p className="mt-2 text-sm text-slate-600">Save as a draft, or submit it to the Admin for review before it goes live to the public.</p>
            <div className="mt-6 grid gap-3">
              <button type="button" disabled={isSaving} onClick={() => onSubmit({ ...values, status: 'Draft' })} className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">Save draft</button>
              <button type="submit" disabled={isSaving} className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-50">{isSaving ? 'Saving…' : 'Submit for Review'}</button>
            </div>
          </section>
        </aside>
      </div>
    </form>
  )
}
