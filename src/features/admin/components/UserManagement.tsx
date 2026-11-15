import { useCallback, useEffect, useState } from 'react'
import { api } from '../../../lib/backend'
import { setUserActive } from '../../../lib/backendUsers'
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
      await setUserActive(user.id, !user.isActive)
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
