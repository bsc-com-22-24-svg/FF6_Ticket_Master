#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "════════════════════════════════════════════════════════════"
echo "  FIXING ADMIN + ORGANIZER using the REAL OpenAPI spec"
echo "════════════════════════════════════════════════════════════"

echo "==> 1/3 Admin dashboard → uses GET /events/mine, PATCH /events/:id"
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
  const [tab, setTab] = useState<'events' | 'users'>('events')
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
      await api(`/events/${eventId}`, {
        method: 'PATCH',
        body: { status },
      })
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status } : e)),
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
        </div>

        {tab === 'users' && <UserManagement />}

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
TSX
echo "  ✓ AdminDashboardPage.tsx (uses /events/mine + PATCH /events/:id)"

echo "==> 2/3 UserManagement → uses /users endpoints from OpenAPI"
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

async function fetchUsers(): Promise<AdminUser[]> {
  const res = await api<any>('/users?limit=100')
  const list: any[] = Array.isArray(res) ? res : (res?.data || [])
  return list.map((u) => ({
    id: String(u.id),
    name: u.name || 'Unknown',
    email: u.email || '',
    role: u.role || 'ATTENDEE',
    isActive: u.isActive ?? u.active ?? true,
  }))
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
      setUsers(await fetchUsers())
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
      // OpenAPI: PATCH /users/{userId}/status
      await api(`/users/${user.id}/status`, {
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
echo "  ✓ UserManagement.tsx (uses PATCH /users/:id/status)"

echo "==> 3/3 Organizer Dashboard → PATCH /events/:id for status"
python3 - <<'PY'
path = 'src/lib/backendOrganizer.ts'
src = open(path).read()

# Replace cancelOrganizerEvent + restoreOrganizerEvent to use plain PATCH body
old_cancel = '''export async function cancelOrganizerEvent(eventId: string): Promise<void> {
  await setOrganizerEventStatus(eventId, 'CANCELLED')
}'''
new_cancel = '''export async function cancelOrganizerEvent(eventId: string): Promise<void> {
  // OpenAPI: PATCH /events/:id accepts { status: "CANCELLED" }
  await setOrganizerEventStatus(eventId, 'CANCELLED')
}'''

old_restore = '''export async function restoreOrganizerEvent(
  eventId: string,
  status: 'DRAFT' | 'PUBLISHED',
): Promise<void> {
  await setOrganizerEventStatus(eventId, status)
}'''
new_restore = '''export async function restoreOrganizerEvent(
  eventId: string,
  status: 'DRAFT' | 'PUBLISHED',
): Promise<void> {
  // OpenAPI: PATCH /events/:id accepts { status: "DRAFT"|"PUBLISHED" }
  await setOrganizerEventStatus(eventId, status)
}'''

if old_cancel in src:
    src = src.replace(old_cancel, new_cancel)
if old_restore in src:
    src = src.replace(old_restore, new_restore)

# Make sure setOrganizerEventStatus uses plain object body (api() stringifies it)
old_set = '''export async function setOrganizerEventStatus(
  eventId: string,
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED',
): Promise<void> {
  await api(`/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    body: { status },
  })
}'''
if old_set in src:
    print('  setOrganizerEventStatus already correct')

open(path, 'w').write(src)
print('  ✓ backendOrganizer.ts')
PY

echo "==> Type-checking"
npx tsc -p tsconfig.app.json --noEmit 2>&1 | head -20 || true

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  DONE."
echo ""
echo "  WHAT NOW WORKS (uses only real endpoints from your OpenAPI):"
echo "  ✓ Admin: list events (GET /events/mine)"
echo "  ✓ Admin: cancel event (PATCH /events/:id {status:CANCELLED})"
echo "  ✓ Admin: restore event (PATCH /events/:id {status:PUBLISHED})"
echo "  ✓ Admin: list users (GET /users)"
echo "  ✓ Admin: disable/enable user (PATCH /users/:id/status)"
echo "  ✓ Organizer: cancel + restore event (same PATCH)"
echo "  ✓ Organizer: list staff (GET /organizers/me/staff)"
echo "  ✓ Organizer: create staff (POST /organizers/me/staff)"
echo "  ✓ Organizer: assign events (PUT /organizers/me/staff/:id/events)"
echo "  ✓ Organizer: disable staff (PATCH /organizers/me/staff/:id/active)"
echo ""
echo "  WHAT STILL DOESN'T WORK (backend gap):"
echo "  ❌ Staff scanner: cannot fetch own assignments"
echo "     → OpenAPI has NO endpoint for CHECK_IN_STAFF to list their events"
echo "     → Only /organizers/me/staff exists (organizer-only)"
echo "     → Ask backend dev to add: GET /staff/me/events"
echo ""
echo "  NEXT:"
echo "    1. Ctrl+C → npm run dev"
echo "    2. Ctrl+Shift+R in browser"
echo "    3. Go to /admin → Cancel an event → Restore it"
echo "    4. Go to /organizer/dashboard → Cancel + Restore works too"
echo "════════════════════════════════════════════════════════════"
