import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { api } from '../../../lib/backend'
import { useToast } from '../../toast'
import { Search, UserX, UserCheck, RefreshCw, UserPlus } from 'lucide-react'

type BackendRole = 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN'

const ROLES: { value: BackendRole; label: string }[] = [
  { value: 'ATTENDEE', label: 'Attendee' },
  { value: 'ORGANIZER', label: 'Organizer' },
  { value: 'CHECK_IN_STAFF', label: 'Check-in staff' },
  { value: 'ADMIN', label: 'Admin' },
]

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  isActive: boolean
}

interface UsersPage {
  data?: Record<string, unknown>[]
  meta?: { totalPages?: number }
}

// Every user, read from GET /users (administrators only). Nothing is stored in the browser.
async function fetchUsers(): Promise<AdminUser[]> {
  const all: AdminUser[] = []
  let page = 1
  let totalPages = 1
  do {
    const res = await api<UsersPage | Record<string, unknown>[]>(`/users?page=${page}&limit=100`)
    const list = Array.isArray(res) ? res : (res.data ?? [])
    all.push(...list.map((u) => ({
      id: String(u.id),
      name: String(u.name || 'Unknown'),
      email: String(u.email || ''),
      role: String(u.role || 'ATTENDEE'),
      isActive: (u.isActive ?? u.active ?? true) as boolean,
    })))
    totalPages = Array.isArray(res) ? 1 : (res.meta?.totalPages ?? 1)
    page += 1
  } while (page <= totalPages)
  return all
}

// PATCH /users/{userId}/status. Some backend builds name the route /active instead.
async function setStatus(userId: string, isActive: boolean): Promise<void> {
  const body = { isActive }
  try {
    await api(`/users/${encodeURIComponent(userId)}/status`, { method: 'PATCH', body })
  } catch (err) {
    if ((err as { status?: number }).status !== 404) throw err
    await api(`/users/${encodeURIComponent(userId)}/active`, { method: 'PATCH', body })
  }
}

const emptyForm = { name: '', email: '', password: '', role: 'ATTENDEE' as BackendRole }
const field = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy'

export function UserManagement() {
  const { showToast } = useToast()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
      await setStatus(user.id, !user.isActive)
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u)))
      showToast(user.isActive ? 'Account disabled' : 'Account enabled', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update user', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function changeRole(user: AdminUser, role: BackendRole) {
    if (role === user.role) return
    setBusyId(user.id)
    try {
      await api(`/users/${encodeURIComponent(user.id)}/role`, { method: 'PATCH', body: { role } })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)))
      showToast('Role updated', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not change the role', 'error')
    } finally {
      setBusyId(null)
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (form.name.trim().length < 2) return setFormError('Enter the name (at least 2 characters).')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setFormError('Enter a valid email address.')
    if (form.password.length < 10) return setFormError('The password needs at least 10 characters.')
    setSaving(true)
    try {
      await api('/users', {
        method: 'POST',
        body: { name: form.name.trim(), email: form.email.trim(), password: form.password, role: form.role },
      })
      setForm(emptyForm)
      setShowForm(false)
      showToast('User created', 'success')
      await load()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the user.')
    } finally {
      setSaving(false)
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
        <div className="flex flex-wrap gap-2">
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
            aria-label="Refresh"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowForm((open) => !open)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-3 py-2 text-xs font-semibold text-white hover:bg-navy-dark"
          >
            <UserPlus size={14} />
            {showForm ? 'Close' : 'Create user'}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={create} noValidate className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Name
              <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Email
              <input type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Password (10+ characters)
              <input type="password" autoComplete="new-password" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Role
              <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as BackendRole })}>
                {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </label>
          </div>
          {formError && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</p>}
          <div className="mt-4 flex justify-end">
            <button type="submit" disabled={saving} className="rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60">
              {saving ? 'Creating...' : 'Create account'}
            </button>
          </div>
        </form>
      )}

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
                    <select
                      aria-label={`Role of ${user.name}`}
                      value={user.role}
                      disabled={busyId === user.id}
                      onChange={(e) => void changeRole(user, e.target.value as BackendRole)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold"
                    >
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.value}</option>)}
                    </select>
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
