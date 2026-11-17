import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  createOrganizerTicketType,
  fetchEditableOrganizerEvent,
  listOrganizerTicketTypes,
  updateOrganizerEvent,
  updateOrganizerTicketType,
  uploadEventImage,
  type EditableBackendEvent,
  type EditableTicketType,
  type TicketTypeInput,
} from '../../../lib/backendOrganizer'

interface TicketTypeFormValue extends Omit<EditableTicketType, 'price' | 'quantity' | 'perOrderLimit'> {
  price: string
  quantity: string
  perOrderLimit: string
}

function ticketTypeFormValue(type: EditableTicketType): TicketTypeFormValue {
  return { ...type, price: String(type.price), quantity: String(type.quantity), perOrderLimit: String(type.perOrderLimit) }
}

function localDateTime(iso: string): { date: string; time: string } {
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return { date: '', time: '' }
  const pad = (part: number) => String(part).padStart(2, '0')
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  }
}

const inputClass = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20'

export function EditEventPage() {
  const { eventId } = useParams({ strict: false }) as { eventId?: string }
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [event, setEvent] = useState<EditableBackendEvent | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [venue, setVenue] = useState('')
  const [location, setLocation] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [ticketTypes, setTicketTypes] = useState<TicketTypeFormValue[]>([])
  const [ticketTypesLoaded, setTicketTypesLoaded] = useState(false)
  const [ticketTypesError, setTicketTypesError] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!eventId) {
      setError('The event ID is missing from the address.')
      setLoading(false)
      return
    }
    void fetchEditableOrganizerEvent(eventId).then(async (loaded) => {
      if (!active) return
      setEvent(loaded)
      setTitle(loaded.title ?? '')
      setDescription(loaded.description ?? '')
      setCategory(loaded.category ?? '')
      setVenue(loaded.venue ?? '')
      setLocation(loaded.location ?? '')
      setImageUrl(loaded.imageUrl ?? '')
      const start = localDateTime(loaded.startAt)
      const end = localDateTime(loaded.endAt)
      setStartDate(start.date)
      setStartTime(start.time)
      setEndDate(end.date)
      setEndTime(end.time)
      try {
        const types = await listOrganizerTicketTypes(eventId)
        if (active) {
          setTicketTypes(types.map(ticketTypeFormValue))
          setTicketTypesLoaded(true)
        }
      } catch {
        if (active) setTicketTypesError('Ticket types could not be loaded. You can still update the event details.')
      }
    }).catch((caught) => {
      if (active) setError(caught instanceof Error ? caught.message : 'Could not load this event.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [eventId])

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    if (!eventId || saving) return
    const startAt = new Date(`${startDate}T${startTime}`)
    const endAt = new Date(`${endDate}T${endTime}`)
    if (!title.trim() || !description.trim() || !venue.trim() || !location.trim()) return setError('Complete the title, description, venue, and location.')
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) return setError('Enter valid event dates, and make sure the event ends after it starts.')
    const parsedTypes: TicketTypeInput[] = ticketTypes.map((type) => ({
      name: type.name.trim(),
      description: type.description.trim(),
      price: Number(type.price),
      currency: type.currency.trim() || 'MWK',
      quantity: Number(type.quantity),
      perOrderLimit: Number(type.perOrderLimit),
      isActive: type.isActive,
    }))
    if (ticketTypesLoaded && parsedTypes.some((type) =>
      !type.name || !Number.isFinite(type.price) || type.price < 0 ||
      !Number.isInteger(type.quantity) || type.quantity < 0 || type.quantity > 1_000_000 ||
      !Number.isInteger(type.perOrderLimit) || type.perOrderLimit < 1 || type.perOrderLimit > 1_000 ||
      !/^[A-Za-z]{3}$/.test(type.currency),
    )) return setError('Each ticket type needs a name, a valid price, a whole-number quantity, and an order limit of at least one.')
    if (ticketTypesLoaded && parsedTypes.length > 0 && !parsedTypes.some((type) => type.isActive)) return setError('Keep at least one ticket type active for sale, or add a new one.')
    setError('')
    setSaving(true)
    try {
      await updateOrganizerEvent(eventId, {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        venue: venue.trim(),
        location: location.trim(),
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        ...(ticketTypesLoaded ? { capacity: parsedTypes.filter((type) => type.isActive !== false).reduce((sum, type) => sum + type.quantity, 0) } : {}),
        ...(imageUrl.trim() ? { imageUrl: imageUrl.trim() } : {}),
      })
      if (ticketTypesLoaded) {
        for (let index = 0; index < ticketTypes.length; index += 1) {
          const type = ticketTypes[index]
          const input = parsedTypes[index]
          if (type.id) await updateOrganizerTicketType(eventId, type.id, input)
          else if (input.isActive !== false) await createOrganizerTicketType(eventId, input)
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['events'] })
      await navigate({ to: '/organizer/dashboard' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update this event.')
    } finally {
      setSaving(false)
    }
  }

  async function selectImage(file?: File) {
    if (!file) return
    setError('')
    setUploading(true)
    try {
      setImageUrl(await uploadEventImage(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The image could not be uploaded.')
    } finally {
      setUploading(false)
    }
  }

  function updateTicketType(index: number, patch: Partial<TicketTypeFormValue>) {
    setTicketTypes((current) => current.map((type, row) => row === index ? { ...type, ...patch } : type))
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
      <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Edit event</h1>
        {event && <p className="mt-2 text-sm text-slate-600">Current status: {event.status}</p>}
        {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {loading ? <p className="mt-5 text-sm text-slate-500">Loading event…</p> : !event ? null : (
          <form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2" noValidate>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Title<input className={inputClass} maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700">Category<input className={inputClass} maxLength={100} value={category} onChange={(e) => setCategory(e.target.value)} /></label>
            <label className="text-sm font-semibold text-slate-700">Venue<input className={inputClass} maxLength={150} value={venue} onChange={(e) => setVenue(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Description<textarea className={inputClass} rows={4} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Location<input className={inputClass} maxLength={255} value={location} onChange={(e) => setLocation(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700">Start date<input className={inputClass} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700">Start time<input className={inputClass} type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700">End date<input className={inputClass} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700">End time<input className={inputClass} type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">Event image URL<input className={inputClass} type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" /></label>
            <label className="text-sm font-medium text-slate-600 sm:col-span-2">Or upload an image<input className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; e.target.value = ''; void selectImage(file) }} /></label>
            {uploading && <p className="text-sm text-slate-500 sm:col-span-2">Uploading image…</p>}
            <section className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><h2 className="font-bold text-navy-dark">Ticket types</h2><p className="mt-1 text-xs text-slate-500">Update ticket names, prices, quantities, and active status.</p></div>
                <button type="button" disabled={!ticketTypesLoaded} onClick={() => setTicketTypes((current) => [...current, { name: '', description: '', price: '', currency: 'MWK', quantity: '', perOrderLimit: '10', isActive: true }])} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50">Add type</button>
              </div>
              {ticketTypesError && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">{ticketTypesError}</p>}
              {ticketTypesLoaded && ticketTypes.length === 0 && <p className="mt-3 text-sm text-slate-500">No active ticket types were returned. Add one if this event should sell tickets.</p>}
              <div className="mt-4 space-y-4">
                {ticketTypes.map((type, index) => (
                  <div key={type.id ?? `new-${index}`} className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-xs font-semibold text-slate-600">Name<input className={inputClass} value={type.name} onChange={(e) => updateTicketType(index, { name: e.target.value })} maxLength={100} /></label>
                    <label className="text-xs font-semibold text-slate-600">Price<input className={inputClass} type="number" min="0" step="0.01" value={type.price} onChange={(e) => updateTicketType(index, { price: e.target.value })} /></label>
                    <label className="text-xs font-semibold text-slate-600">Quantity<input className={inputClass} type="number" min="0" step="1" value={type.quantity} onChange={(e) => updateTicketType(index, { quantity: e.target.value })} /></label>
                    <label className="text-xs font-semibold text-slate-600">Limit per order<input className={inputClass} type="number" min="1" max="1000" step="1" value={type.perOrderLimit} onChange={(e) => updateTicketType(index, { perOrderLimit: e.target.value })} /></label>
                    <label className="text-xs font-semibold text-slate-600 sm:col-span-2 lg:col-span-3">Description<input className={inputClass} value={type.description} onChange={(e) => updateTicketType(index, { description: e.target.value })} maxLength={5000} /></label>
                    <div className="flex items-center justify-between gap-2 self-end pb-2">
                      {type.id ? <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={type.isActive} onChange={(e) => updateTicketType(index, { isActive: e.target.checked })} />Active for sale</label> : <span className="text-xs text-slate-500">New ticket type</span>}
                      {!type.id && <button type="button" onClick={() => setTicketTypes((current) => current.filter((_, row) => row !== index))} className="text-xs font-semibold text-red-700 underline">Remove</button>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <div className="flex justify-end gap-3 pt-2 sm:col-span-2">
              <button type="button" onClick={() => void navigate({ to: '/organizer/dashboard' })} className="rounded-lg border border-slate-300 px-4 py-2.5 font-semibold text-slate-700">Cancel</button>
              <button type="submit" disabled={saving || uploading} className="rounded-lg bg-navy px-5 py-2.5 font-semibold text-white hover:bg-navy-dark disabled:opacity-60">{saving ? 'Saving…' : 'Save changes'}</button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}
