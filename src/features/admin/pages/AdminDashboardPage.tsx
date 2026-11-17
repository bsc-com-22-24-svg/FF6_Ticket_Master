import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle, Ban, RefreshCw } from 'lucide-react'
import { listAdminEvents, updateAdminEventStatus, type AdminEventRecord, type AdminEventStatus } from '../../../lib/backendAdmin'
import { useToast } from '../../toast'
import { StatCard } from '../../organizer/components/StatCard'
import { UserManagement } from '../components/UserManagement'
import { KycReviewTab } from '../components/KycReviewTab'
import { AuditLogTab } from '../components/AuditLogTab'

type AdminTab = 'events' | 'users' | 'kyc' | 'audit'

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<AdminTab>('events')
  const [events, setEvents] = useState<AdminEventRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      setEvents(await listAdminEvents())
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load events')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function setStatus(eventId: string, status: AdminEventStatus) {
    setBusyId(eventId)
    try {
      await updateAdminEventStatus(eventId, status)
      setEvents((previous) => previous.map((event) => event.id === eventId ? { ...event, status } : event))
      showToast(`Event moved to ${status.toLowerCase()}`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update event', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = events.filter((event) => event.status === 'PUBLISHED').length
  const cancelledCount = events.filter((event) => event.status === 'CANCELLED').length
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'events', label: 'Event Moderation' },
    { id: 'kyc', label: 'Organizer KYC' },
    { id: 'users', label: 'User Management' },
    { id: 'audit', label: 'Audit Log' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-dark">Admin Control Center</h1>
            <p className="mt-2 text-slate-600">Review organizers, moderate events, and manage accounts.</p>
          </div>
          {tab === 'events' && (
            <button onClick={() => void load()} disabled={isLoading} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh events
            </button>
          )}
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <StatCard label="Total Events" value={events.length.toString()} icon={ShieldAlert} />
          <StatCard label="Active Events" value={activeCount.toString()} icon={CheckCircle} />
          <StatCard label="Cancelled" value={cancelledCount.toString()} icon={Ban} />
        </div>

        <div className="mt-8 flex flex-wrap gap-6 border-b border-slate-200" role="tablist" aria-label="Admin tools">
          {tabs.map((item) => (
            <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)} className={`pb-3 font-semibold text-sm ${tab === item.id ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}>
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'users' && <UserManagement />}
        {tab === 'kyc' && <KycReviewTab />}
        {tab === 'audit' && <AuditLogTab />}

        {tab === 'events' && (
          <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-navy-dark">All Events</h2>
            {loadError && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"><b>Could not load events:</b> {loadError}</div>}
            {isLoading ? <p className="text-slate-500">Loading events…</p> : !loadError && events.length === 0 ? (
              <p className="text-slate-500">No events found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Organizer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy-dark">{event.title}</td>
                        <td className="px-4 py-3">{event.organizer || '—'}</td>
                        <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : event.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'}`}>{event.status}</span></td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            {event.status !== 'PUBLISHED' && <button disabled={busyId === event.id} onClick={() => void setStatus(event.id, 'PUBLISHED')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Publish</button>}
                            {event.status !== 'DRAFT' && <button disabled={busyId === event.id} onClick={() => void setStatus(event.id, 'DRAFT')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50">Set draft</button>}
                            {event.status !== 'CANCELLED' && <button disabled={busyId === event.id} onClick={() => void setStatus(event.id, 'CANCELLED')} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Cancel</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
