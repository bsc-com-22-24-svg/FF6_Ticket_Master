import { useMemo, useState } from 'react'
import { Users, Ticket, Coins, CheckCircle, Plus } from 'lucide-react'
import { useEvents } from '../../events'
import { remainingSeats, type Event } from '../../../types/event'
import StatCard from '../components/StatCard'
import SalesChart from '../components/SalesChart'
import { Link } from '@tanstack/react-router'

export function OrganizerDashboardPage() {
  const { data: events = [], isLoading } = useEvents()
  const [selectedId, setSelectedId] = useState<string | null>(events[0]?.id ?? null)

  const selected = useMemo(
    () => events.find((e: Event) => e.id === (selectedId ?? events[0]?.id)),
    [events, selectedId],
  )

  const stats = useMemo(() => {
    if (!selected) return { sold: 0, capacity: 0, remaining: 0, revenue: 0, checkedIn: 0 }
    const sold = selected.ticketTypes.reduce((s, t) => s + t.sold, 0)
    const capacity = selected.ticketTypes.reduce((s, t) => s + t.capacity, 0)
    const remaining = selected.ticketTypes.reduce((s, t) => s + remainingSeats(t), 0)
    const revenue = selected.ticketTypes.reduce((s, t) => s + t.sold * t.price, 0)
    return { sold, capacity, remaining, revenue, checkedIn: Math.min(sold, 42) }
  }, [selected])

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Organizer Dashboard</h1>
            <p className="mt-2 text-slate-600">Track sales and attendance for your events</p>
          </div>
          <Link
            to="/organizer/events/new"
            className="flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            <Plus size={16} /> Create event
          </Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold">Select event</label>
            <select
              value={selected?.id ?? ''}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy"
            >
              {events.map((e: Event) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
            {isLoading && <p className="mt-2 text-sm text-slate-500">Loading events...</p>}
          </div>

          <StatCard label="Tickets sold" value={stats.sold.toLocaleString()} detail={`${stats.capacity.toLocaleString()} total`} icon={Ticket} />
          <StatCard label="Remaining" value={stats.remaining.toLocaleString()} detail="seats left" icon={Users} />
          <StatCard label="Revenue" value={`MK ${stats.revenue.toLocaleString()}`} detail="from sales" icon={Coins} />
          <StatCard label="Checked in" value={stats.checkedIn.toLocaleString()} detail="attendees admitted" icon={CheckCircle} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Sales this week</h2>
            <p className="mt-1 text-sm text-slate-600">Mock data for the demo</p>
            <div className="mt-6">
              <SalesChart values={[12, 18, 9, 24, 31, 15, 20]} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Ticket types</h2>
            <div className="mt-4 space-y-3">
              {selected?.ticketTypes.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-slate-600">MK {t.price.toLocaleString()} · {t.capacity} cap</p>
                  </div>
                  <span className="text-sm font-semibold">{t.sold} sold</span>
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
