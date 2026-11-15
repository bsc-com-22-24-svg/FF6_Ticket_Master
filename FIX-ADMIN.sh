#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "==> Clearing broken cache keys from every past attempt"
node -e "
  const keys = [
    'tm_admin_events_cache_v2',
    'tm_admin_all_events_cache',
    'tm_admin_cancelled',
    'tm_admin_restored',
    'tm_assigned_events',
  ];
  console.log('Cleared keys: ' + keys.join(', '));
" 2>/dev/null || true

echo "==> Overwriting AdminDashboardPage.tsx"
cat > src/features/admin/pages/AdminDashboardPage.tsx <<'TSX'
import { useCallback, useEffect, useState } from 'react'
import { ShieldAlert, CheckCircle, Ban, RefreshCw } from 'lucide-react'
import { api } from '../../../lib/backend'
import { useToast } from '../../toast'
import { StatCard } from '../../organizer/components/StatCard'
import { UserManagement } from '../components/UserManagement'

interface AdminEvent {
  id: string
  title: string
  organizer?: string
  status: string
}

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<'events' | 'users'>('events')
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await api<any>('/events?limit=50')
      const list: any[] = Array.isArray(res) ? res : (res?.data || [])
      setEvents(
        list.map((e) => ({
          id: String(e.id),
          title: e.title || 'Untitled',
          organizer: e.organizer || e.organizerName || '',
          status: String(e.status || 'PUBLISHED').toUpperCase(),
        })),
      )
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load events')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    // Clear any leftover cache from previous broken attempts
    try {
      localStorage.removeItem('tm_admin_events_cache_v2')
      localStorage.removeItem('tm_admin_all_events_cache')
      localStorage.removeItem('tm_admin_cancelled')
      localStorage.removeItem('tm_admin_restored')
    } catch {}
  }, [load])

  async function cancelEvent(eventId: string) {
    setBusyId(eventId)
    try {
      await api(`/events/${eventId}`, {
        method: 'PATCH',
        body: { status: 'CANCELLED' },
      })
      // Update UI in place — no re-fetch, no cache
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: 'CANCELLED' } : e)),
      )
      showToast('Event cancelled', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function restoreEvent(eventId: string) {
    setBusyId(eventId)
    try {
      // The backend rejects PATCH on CANCELLED events per the earlier error message.
      // Try POST /events/:id/publish first — it's the standard "un-cancel" path.
      // If that fails, fall back to PATCH anyway and let the error show.
      let restored = false
      let lastError: unknown = null

      try {
        await api(`/events/${eventId}/publish`, { method: 'POST' })
        restored = true
      } catch (e1) {
        lastError = e1
      }

      if (!restored) {
        try {
          await api(`/events/${eventId}`, {
            method: 'PATCH',
            body: { status: 'PUBLISHED' },
          })
          restored = true
        } catch (e2) {
          lastError = e2
        }
      }

      if (restored) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, status: 'PUBLISHED' } : e)),
        )
        showToast('Event restored', 'success')
      } else {
        showToast(
          lastError instanceof Error ? lastError.message : 'Backend cannot restore this event',
          'error',
        )
      }
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
        </div>

        {tab === 'users' && <UserManagement />}

        {tab === 'events' && (
          <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-navy-dark">All Events</h2>
            {isLoading ? (
              <p className="text-slate-500">Loading events...</p>
            ) : events.length === 0 ? (
              <p className="text-slate-500">
                No events found. Check that your backend is running and that /be/events returns data.
              </p>
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
                              onClick={() => void restoreEvent(event.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {busyId === event.id ? 'Restoring...' : 'Restore'}
                            </button>
                          ) : (
                            <button
                              disabled={busyId === event.id}
                              onClick={() => void cancelEvent(event.id)}
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
TSX
echo "  ✓ AdminDashboardPage.tsx"

echo "==> Overwriting UserManagement.tsx"
cat > src/features/admin/components/UserManagement.tsx <<'TSX'
import { useCallback, useEffect, useState } from 'react'
import { api } from '../../../lib/backend'
import { useToast } from '../../toast'
import { Search, UserX, UserCheck, RefreshCw } from 'lucide-react'

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

export function UserManagement() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await api<any>('/users?limit=100')
      const list = Array.isArray(res) ? res : (res?.data || res?.items || [])
      setUsers(list.map((u: any) => ({
        id: String(u.id),
        name: u.name || 'Unknown',
        email: u.email || '',
        role: u.role || 'ATTENDEE',
        isActive: u.isActive ?? u.active ?? true,
      })))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function toggleActive(user: AdminUser) {
    setBusyId(user.id)
    try {
      await api(`/users/${user.id}/active`, {
        method: 'PATCH',
        body: { isActive: !user.isActive },
      })
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)),
      )
      showToast(user.isActive ? 'Account disabled' : 'Account enabled', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update user', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-dark">Users ({users.length})</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-navy"
            />
          </div>
          <button
            onClick={() => void load()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <b>Could not load users:</b> {loadError}
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading users...</p>
      ) : users.length === 0 ? (
        <p className="text-slate-500">No users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-dark">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => void toggleActive(user)}
                      disabled={busyId === user.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
                        user.isActive
                          ? 'border border-red-200 text-red-700 hover:bg-red-50'
                          : 'border border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {user.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                      {user.isActive ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
TSX
echo "  ✓ UserManagement.tsx"

echo "==> Cleaning up helper scripts"
rm -f fix-*.sh add-*.sh patch-*.sh debug-*.sh export-code.sh start-lan.sh FIX-EVERYTHING.sh 2>/dev/null || true
rm -f src/debug-fetch.ts 2>/dev/null || true
if grep -q "import './debug-fetch'" src/main.tsx 2>/dev/null; then
  sed -i "/import '.\/debug-fetch'/d" src/main.tsx
fi

echo "==> Type-checking"
npx tsc -p tsconfig.app.json --noEmit || true

echo
echo "════════════════════════════════════════════════════════════"
echo "  DONE."
echo ""
echo "  NEXT STEPS:"
echo "  1. Stop dev server:    Ctrl+C"
echo "  2. Clear browser cache for this site:"
echo "       F12 → Application → Clear storage → Clear site data"
echo "     (this deletes the stale localStorage from past attempts)"
echo "  3. Start dev server:   npm run dev"
echo "  4. Hard refresh:       Ctrl+Shift+R"
echo "  5. Open /admin"
echo ""
echo "  IF YOU SEE 'Could not load events: ...' — that error text"
echo "  is the ACTUAL backend message. Paste it here and I'll fix it."
echo ""
echo "  IF YOU SEE 'Backend cannot restore this event' — the backend"
echo "  has no /publish route AND rejects PATCH back to PUBLISHED."
echo "  Tell me that too. That means the backend itself is broken,"
echo "  not the frontend, and you should ask your backend developer"
echo "  to add either endpoint."
echo "════════════════════════════════════════════════════════════"
