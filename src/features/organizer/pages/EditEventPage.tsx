import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  createOrganizerTicketType,
  fetchEditableOrganizerEvent,
  listOrganizerTicketTypes,
  updateOrganizerEvent,
  updateOrganizerTicketType,
  type EditableOrganizerEvent,
} from '../../../lib/backendOrganizer'

interface TicketDraft {
  id?: string
  name: string
  description: string
  price: string
  quantity: string
  perOrderLimit: string
  currency: string
}

function localDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const field = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900 outline-none focus:border-navy focus:ring-2 focus:ring-navy/15'

export function EditEventPage() {
  const { eventId } = useParams({ from: '/organizer/events/$eventId/edit' })
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState<EditableOrganizerEvent | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketDraft[]>([])
  const [removedTicketIds, setRemovedTicketIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    void Promise.all([fetchEditableOrganizerEvent(eventId), listOrganizerTicketTypes(eventId)])
      .then(([event, types]) => {
        if (!active) return
        setForm(event)
        setTicketTypes(types.filter((type) => type.isActive).map((type) => ({
          id: type.id,
          name: type.name,
          description: type.description,
          price: String(type.price),
          quantity: String(type.quantity),
          perOrderLimit: String(type.perOrderLimit),
          currency: type.currency,
        })))
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Could not load this event.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [eventId])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!form || saving) return
    const startAt = new Date(form.startAt)
    const endAt = new Date(form.endAt)
    if (!form.title.trim() || !form.description.trim() || !form.venue.trim() || !form.location.trim()) {
      setError('Enter the event title, description, venue, and location.')
      return
    }
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
      setError('Choose a valid start and end time. The event must end after it starts.')
      return
    }
    if (ticketTypes.length === 0 || ticketTypes.some((ticket) =>
      !ticket.name.trim() || !Number.isFinite(Number(ticket.price)) || Number(ticket.price) < 0 ||
      !Number.isInteger(Number(ticket.quantity)) || Number(ticket.quantity) < 1 ||
      !Number.isInteger(Number(ticket.perOrderLimit)) || Number(ticket.perOrderLimit) < 1,
    )) {
      setError('Keep at least one valid ticket type. Each needs a name, a non-negative price, quantity, and per-order limit.')
      return
    }

    setSaving(true)
    setError('')
    try {
      await updateOrganizerEvent(eventId, {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category?.trim() || undefined,
        imageUrl: form.imageUrl?.trim() || undefined,
        venue: form.venue.trim(),
        location: form.location.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      })
      for (const ticketId of removedTicketIds) {
        await updateOrganizerTicketType(eventId, ticketId, { isActive: false })
      }
      for (const ticket of ticketTypes) {
        const changes = {
          name: ticket.name.trim(),
          description: ticket.description.trim(),
          price: Number(ticket.price),
          currency: ticket.currency || 'MWK',
          quantity: Number(ticket.quantity),
          perOrderLimit: Number(ticket.perOrderLimit),
        }
        if (ticket.id) await updateOrganizerTicketType(eventId, ticket.id, changes)
        else await createOrganizerTicketType(eventId, changes)
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['events', 'mine'] }),
      ])
      await navigate({ to: '/organizer/dashboard' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save event changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link to="/organizer/dashboard" className="text-sm font-semibold text-slate-600 hover:text-navy">← Organizer dashboard</Link>
        <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h1 className="text-2xl font-extrabold text-navy-dark">Edit event</h1>
          <p className="mt-2 text-sm text-slate-600">Update the event details shown to attendees.</p>

          {loading && <p className="mt-6 text-slate-500">Loading event…</p>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

          {!loading && form && (
            <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
              <label className="block text-sm font-semibold text-slate-700">Event title
                <input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Description
                <textarea className={field} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Category
                <input className={field} value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">Venue
                  <input className={field} value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
                </label>
                <label className="block text-sm font-semibold text-slate-700">City and location
                  <input className={field} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required />
                </label>
                <label className="block text-sm font-semibold text-slate-700">Starts
                  <input className={field} type="datetime-local" value={localDateTime(form.startAt)} onChange={(e) => setForm({ ...form, startAt: e.target.value })} required />
                </label>
                <label className="block text-sm font-semibold text-slate-700">Ends
                  <input className={field} type="datetime-local" value={localDateTime(form.endAt)} onChange={(e) => setForm({ ...form, endAt: e.target.value })} required />
                </label>
              </div>
              <label className="block text-sm font-semibold text-slate-700">Image URL
                <input className={field} value={form.imageUrl ?? ''} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Leave blank to keep the current image" />
              </label>
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-navy-dark">Ticket details</h2>
                    <p className="mt-1 text-xs font-normal text-slate-500">Removing a type deactivates it; existing ticket records are kept.</p>
                  </div>
                  <button type="button" onClick={() => setTicketTypes((current) => [...current, { name: '', description: '', price: '', quantity: '1', perOrderLimit: '10', currency: 'MWK' }])} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Add ticket type</button>
                </div>
                <div className="space-y-4">
                  {ticketTypes.map((ticket, index) => (
                    <div key={ticket.id ?? `new-${index}`} className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-slate-700">Name
                        <input className={field} value={ticket.name} onChange={(e) => setTicketTypes((current) => current.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">Description
                        <input className={field} value={ticket.description} onChange={(e) => setTicketTypes((current) => current.map((item, i) => i === index ? { ...item, description: e.target.value } : item))} />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">Price (MWK)
                        <input className={field} type="number" min="0" step="1" value={ticket.price} onChange={(e) => setTicketTypes((current) => current.map((item, i) => i === index ? { ...item, price: e.target.value } : item))} />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">Quantity
                        <input className={field} type="number" min="1" step="1" value={ticket.quantity} onChange={(e) => setTicketTypes((current) => current.map((item, i) => i === index ? { ...item, quantity: e.target.value } : item))} />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">Per-order limit
                        <input className={field} type="number" min="1" step="1" value={ticket.perOrderLimit} onChange={(e) => setTicketTypes((current) => current.map((item, i) => i === index ? { ...item, perOrderLimit: e.target.value } : item))} />
                      </label>
                      <div className="flex items-end justify-end">
                        <button type="button" disabled={ticketTypes.length === 1} onClick={() => {
                          if (ticket.id) setRemovedTicketIds((current) => [...current, ticket.id!])
                          setTicketTypes((current) => current.filter((_, i) => i !== index))
                        }} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Remove type</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => void navigate({ to: '/organizer/dashboard' })} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" disabled={saving}>Cancel</button>
                <button type="submit" className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}
