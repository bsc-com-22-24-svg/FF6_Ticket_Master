import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle, Ban, RefreshCw } from 'lucide-react'
import { api } from '../../../lib/backend'
import { useToast } from '../../toast'
import { StatCard } from '../../organizer/components/StatCard'
import { UserManagement } from '../components/UserManagement'
import { AuditLogTab } from '../components/AuditLogTab'

interface AdminEvent {
  id: string
  title: string
  organizer?: string
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | string
}

// The OpenAPI spec says GET /events/mine returns all of the caller's own events
// for an organizer. For an admin, the backend returns all events across organizers
// (this is the "admin sees everything" behaviour via the /mine endpoint).
async function fetchAllEvents(): Promise<AdminEvent[]> {
  const all: AdminEvent[] = []
  let page = 1
  let totalPages = 1
  do {
    const res = await api<any>(`/events/mine?page=${page}&limit=50`)
    const list: any[] = Array.isArray(res) ? res : (res?.data || [])
    all.push(...list.map((e) => ({
      id: String(e.id),
      title: e.title || 'Untitled',
      organizer: e.organizerName || e.organizer || '',
      status: String(e.status || 'PUBLISHED').toUpperCase(),
    })))
    const meta = res?.meta
    totalPages = meta?.totalPages ?? 1
    page += 1
  } while (page <= totalPages)
  return all
}

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'events' | 'users' | 'audit'>('events')
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setEvents(await fetchAllEvents())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load events')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function setStatus(eventId: string, status: 'PUBLISHED' | 'CANCELLED') {
    setBusyId(eventId)
    try {
      // PATCH /events/:id accepts { status: 'DRAFT'|'PUBLISHED'|'CANCELLED' }
      let applied: string = status
      try {
        await api(`/events/${eventId}`, { method: 'PATCH', body: { status } })
      } catch (err) {
        // an event that was never published goes back to draft, not to published
        if (status === 'PUBLISHED' && (err as { status?: number }).status === 409) {
          applied = 'DRAFT'
          await api(`/events/${eventId}`, { method: 'PATCH', body: { status: 'DRAFT' } })
        } else {
          throw err
        }
      }
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: applied } : e)),
      )
      showToast(`Event ${status === 'PUBLISHED' ? 'restored' : 'cancelled'}`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update event', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = events.filter((e) => e.status === 'PUBLISHED').length
  const cancelledCount = events.filter((e) => e.status === 'CANCELLED').length

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-dark">Admin Control Center</h1>
            <p className="mt-2 text-slate-600">Manage platform events and user accounts.</p>
          </div>
          <button
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loadError && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <b>Could not load events:</b> {loadError}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <StatCard label="Total Events" value={events.length.toString()} icon={ShieldAlert} />
          <StatCard label="Active Events" value={activeCount.toString()} icon={CheckCircle} />
          <StatCard label="Cancelled" value={cancelledCount.toString()} icon={Ban} />
        </div>

        <div className="mt-8 flex gap-6 border-b border-slate-200">
          <button
            onClick={() => setTab('events')}
            className={`pb-3 font-semibold text-sm ${tab === 'events' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            Event Moderation
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 font-semibold text-sm ${tab === 'users' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            User Management
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`pb-3 font-semibold text-sm ${tab === 'audit' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            Audit Trail
          </button>
        </div>

        {tab === 'users' && <UserManagement />}

        {tab === 'audit' && <AuditLogTab />}

        {tab === 'events' && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-navy-dark">All Events</h2>
            {isLoading ? (
              <p className="text-slate-500">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-slate-500">No events found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Organizer</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy-dark">{event.title}</td>
                        <td className="px-4 py-3">{event.organizer || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' :
                            event.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {event.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {event.status === 'CANCELLED' ? (
                            <button
                              disabled={busyId === event.id}
                              onClick={() => void setStatus(event.id, 'PUBLISHED')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {busyId === event.id ? 'Restoring...' : 'Restore'}
                            </button>
                          ) : (
                            <button
                              disabled={busyId === event.id}
                              onClick={() => void setStatus(event.id, 'CANCELLED')}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {busyId === event.id ? 'Cancelling...' : 'Cancel Event'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
