import { useState } from 'react'
import { ShieldAlert, CheckCircle, Ban, RefreshCw } from 'lucide-react'
import type { AdminEventStatus } from '../../../lib/backendAdmin'
import { useAdminEvents } from '../hooks/useAdmin'
import { useToast } from '../../toast'
import { StatCard } from '../../organizer/components/StatCard'
import { UserManagement } from '../components/UserManagement'
import { AuditLogTab } from '../components/AuditLogTab'
import { AdminKycReview } from '../components/AdminKycReview'

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'events' | 'users' | 'kyc' | 'audit'>('events')
  const [statusFilter, setStatusFilter] = useState<'' | AdminEventStatus>('')
  const { events, loading, error, refetch, setStatus, settingStatus } = useAdminEvents(statusFilter || undefined)

  async function changeStatus(eventId: string, status: 'PUBLISHED' | 'CANCELLED') {
    try {
      await setStatus({ eventId, status })
      showToast(`Event ${status === 'PUBLISHED' ? 'restored' : 'cancelled'}`, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update event', 'error')
    }
  }

  const activeCount = events.filter((event) => event.status === 'PUBLISHED').length
  const cancelledCount = events.filter((event) => event.status === 'CANCELLED').length

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-dark">Admin Control Center</h1>
            <p className="mt-2 text-slate-600">Manage platform events, organizer verification, and user accounts.</p>
          </div>
          <button
            onClick={() => void refetch()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <b>Could not load events:</b> {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <StatCard label="Total Events" value={events.length.toString()} icon={ShieldAlert} />
          <StatCard label="Active Events" value={activeCount.toString()} icon={CheckCircle} />
          <StatCard label="Cancelled" value={cancelledCount.toString()} icon={Ban} />
        </div>

        <div className="mt-8 flex flex-wrap gap-6 border-b border-slate-200">
          <button
            onClick={() => setTab('events')}
            className={`pb-3 font-semibold text-sm ${tab === 'events' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            Events
          </button>
          <button
            onClick={() => setTab('users')}
            className={`pb-3 font-semibold text-sm ${tab === 'users' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            Users
          </button>
          <button
            onClick={() => setTab('kyc')}
            className={`pb-3 font-semibold text-sm ${tab === 'kyc' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            Organizer KYC
          </button>
          <button
            onClick={() => setTab('audit')}
            className={`pb-3 font-semibold text-sm ${tab === 'audit' ? 'border-b-2 border-navy text-navy' : 'text-slate-500'}`}
          >
            Logs
          </button>
        </div>

        {tab === 'users' && <UserManagement />}
        {tab === 'kyc' && <AdminKycReview />}
        {tab === 'audit' && <AuditLogTab />}

        {tab === 'events' && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex justify-end">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as '' | AdminEventStatus)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                aria-label="Filter events by status"
              >
                <option value="">All statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            {loading ? (
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
                      <tr key={event.eventId} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-semibold text-navy-dark">{event.title}</td>
                        <td className="px-4 py-3">{event.organizerName || '—'}</td>
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
                              disabled={settingStatus}
                              onClick={() => void changeStatus(event.eventId, 'PUBLISHED')}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {settingStatus ? 'Restoring...' : 'Restore'}
                            </button>
                          ) : (
                            <button
                              disabled={settingStatus}
                              onClick={() => void changeStatus(event.eventId, 'CANCELLED')}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {settingStatus ? 'Cancelling...' : 'Cancel Event'}
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
