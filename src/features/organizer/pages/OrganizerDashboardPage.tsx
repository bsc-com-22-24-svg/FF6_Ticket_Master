import { useMemo, useState } from 'react'
import { Users, Ticket, Coins, CheckCircle, Plus, Pencil, RotateCcw } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAllEvents } from '../../events'
import { remainingSeats } from '../../../types/event'
import { listTickets, BOOKINGS_KEY, TICKETS_KEY } from '../../../lib/tickets'
import { resetEvents } from '../../../lib/events'
import StatCard from '../components/StatCard'
import SalesChart from '../components/SalesChart'

export function OrganizerDashboardPage() {
  const { data: events = [], isLoading } = useAllEvents()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const selected = useMemo(
    () => events.find((event) => event.id === (selectedId ?? events[0]?.id)),
    [events, selectedId],
  )

  const stats = useMemo(() => {
    if (!selected) return { sold: 0, capacity: 0, remaining: 0, revenue: 0, checkedIn: 0 }
    const sold = selected.ticketTypes.reduce((sum, type) => sum + type.sold, 0)
    const capacity = selected.ticketTypes.reduce((sum, type) => sum + type.capacity, 0)
    const remaining = selected.ticketTypes.reduce((sum, type) => sum + remainingSeats(type), 0)
    const revenue = selected.ticketTypes.reduce((sum, type) => sum + type.sold * type.price, 0)
    const checkedIn = listTickets().filter(
      (ticket) => ticket.eventId === selected.id && ticket.status === 'used',
    ).length
    return { sold, capacity, remaining, revenue, checkedIn }
  }, [selected])

  function handleReset() {
    if (!window.confirm('Reset all demo data (events, tickets and bookings)?')) return
    resetEvents()
    window.localStorage.removeItem(TICKETS_KEY)
    window.localStorage.removeItem(BOOKINGS_KEY)
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Organizer Dashboard</h1>
            <p className="mt-2 text-slate-600">Track sales and attendance for your events</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw size={16} /> Reset demo data
            </button>
            <Link
              to="/organizer/events/new"
              className="flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              <Plus size={16} /> Create event
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold">Select event</label>
            <select
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                  {event.status === 'Draft' ? ' (draft)' : ''}
                </option>
              ))}
            </select>
            {isLoading && <p className="mt-2 text-sm text-slate-500">Loading events…</p>}
            {!isLoading && events.length === 0 && (
              <p className="mt-2 text-sm text-slate-500">No events yet — create one to get started.</p>
            )}
            {selected && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      selected.status === 'Published'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
                <Link
                  to="/organizer/events/$eventId/edit"
                  params={{ eventId: selected.id }}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  <Pencil size={14} /> Edit event
                </Link>
              </div>
            )}
          </div>

          <StatCard label="Tickets sold" value={stats.sold.toLocaleString()} detail={`${stats.capacity.toLocaleString()} total`} icon={Ticket} />
          <StatCard label="Remaining" value={stats.remaining.toLocaleString()} detail="seats left" icon={Users} />
          <StatCard label="Revenue" value={`MK ${stats.revenue.toLocaleString()}`} detail="from sales" icon={Coins} />
          <StatCard label="Checked in" value={stats.checkedIn.toLocaleString()} detail="attendees admitted" icon={CheckCircle} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Sales this week</h2>
            <p className="mt-1 text-sm text-slate-600">Illustrative trend for the demo</p>
            <div className="mt-6">
              <SalesChart values={[12, 18, 9, 24, 31, 15, 20]} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Ticket types</h2>
            <div className="mt-4 space-y-3">
              {selected?.ticketTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">{type.name}</p>
                    <p className="text-sm text-slate-600">
                      MK {type.price.toLocaleString()} · {type.capacity} cap
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{type.sold} sold</span>
                </div>
              ))}
              {!selected && <p className="text-sm text-slate-500">No event selected</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
