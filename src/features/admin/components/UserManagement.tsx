import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus, UserRoundX } from 'lucide-react'
import { useAuth } from '../../authentication'
import { useToast } from '../../toast'
import {
  createManagedUser,
  fetchManagedUsers,
  setManagedUserActive,
  updateManagedUserRole,
  type BackendManagedUser,
  type ManagedRole,
} from '../../../lib/backendUsers'
import { ConfirmDialog } from '../../../components/ConfirmDialog'

const PAGE_SIZE = 8
const ROLES: ManagedRole[] = ['customer', 'organizer', 'staff', 'admin']
const filterClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy'
const emptyForm = { name: '', email: '', password: '', role: 'customer' as ManagedRole }

function formatDate(value?: string): string {
  if (!value) return '—'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? '—'
    : parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function UserManagement() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<ManagedRole | 'all'>('all')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [statusChange, setStatusChange] = useState<{ user: BackendManagedUser; isActive: boolean } | null>(null)

  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchManagedUsers,
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ManagedRole }) =>
      updateManagedUserRole(userId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      showToast('User role updated', 'success')
    },
    onError: (error) => showToast(error instanceof Error ? error.message : 'Could not update user role', 'error'),
  })

  const createMutation = useMutation({
    mutationFn: createManagedUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setForm(emptyForm)
      setCreating(false)
      showToast('User created', 'success')
    },
    onError: (error) => setFormError(error instanceof Error ? error.message : 'Could not create user'),
  })

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      setManagedUserActive(userId, isActive),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setStatusChange(null)
      showToast(variables.isActive ? 'Account activated' : 'Account deactivated', 'success')
    },
    onError: (error) => {
      setStatusChange(null)
      showToast(error instanceof Error ? error.message : 'Could not change account status', 'error')
    },
  })

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return (usersQuery.data ?? [])
      .filter((item) => role === 'all' || item.role === role)
      .filter((item) => !term || item.name.toLowerCase().includes(term) || item.email.toLowerCase().includes(term))
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  }, [usersQuery.data, role, search])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function submitCreate(event: FormEvent) {
    event.preventDefault()
    setFormError(null)
    if (form.name.trim().length < 2) {
      setFormError('Name must contain at least 2 characters.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError('Enter a valid email address.')
      return
    }
    if (form.password.length < 10 || form.password.length > 72) {
      setFormError('Password must be between 10 and 72 characters.')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-dark">
          Backend users{usersQuery.data ? ` (${usersQuery.data.length})` : ''}
        </h2>
        <button
          type="button"
          onClick={() => { setFormError(null); setCreating((value) => !value) }}
          className="flex items-center gap-2 rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
        >
          <UserPlus size={16} aria-hidden="true" /> {creating ? 'Close form' : 'Create user'}
        </button>
      </div>

      {creating && (
        <form onSubmit={submitCreate} className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-semibold text-navy-dark">Create backend user</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-slate-700">
              Name
              <input className={`${filterClass} mt-1 w-full`} required minLength={2} maxLength={150} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Email
              <input className={`${filterClass} mt-1 w-full`} type="email" required maxLength={255} value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Temporary password
              <input className={`${filterClass} mt-1 w-full`} type="password" required minLength={10} maxLength={72} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            </label>
            <label className="text-sm font-medium text-slate-700">
              Role
              <select className={`${filterClass} mt-1 w-full`} value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as ManagedRole })}>
                {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
          </div>
          {formError && <p role="alert" className="mt-3 text-sm text-red-600">{formError}</p>}
          <button type="submit" disabled={createMutation.isPending} className="mt-3 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {createMutation.isPending ? 'Creating…' : 'Create user'}
          </button>
        </form>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            aria-label="Search users"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search name or email"
            className={`${filterClass} w-full pl-9`}
          />
        </label>
        <select
          aria-label="Filter by role"
          value={role}
          onChange={(event) => {
            setRole(event.target.value as ManagedRole | 'all')
            setPage(1)
          }}
          className={filterClass}
        >
          <option value="all">All roles</option>
          {ROLES.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      {usersQuery.isLoading && <p role="status" className="py-8 text-center text-slate-500">Loading users from the backend…</p>}
      {usersQuery.isError && (
        <div role="alert" className="py-8 text-center text-red-600">
          <p>{usersQuery.error instanceof Error ? usersQuery.error.message : 'Could not load users.'}</p>
          <button type="button" className="mt-2 underline" onClick={() => void usersQuery.refetch()}>Try again</button>
        </div>
      )}

      {!usersQuery.isLoading && !usersQuery.isError && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No backend users match your search.</td></tr>
                )}
                {visible.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-navy-dark">{item.name}</div>
                      <div className="text-xs">{item.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Role for ${item.name}`}
                        value={item.role}
                        disabled={!user || user.id === item.id || roleMutation.isPending}
                        onChange={(event) => roleMutation.mutate({
                          userId: item.id,
                          role: event.target.value as ManagedRole,
                        })}
                        className={filterClass}
                      >
                        {ROLES.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-xs capitalize">
                      <span>{item.status ?? 'unknown'}</span>
                    </td>
                    <td className="px-4 py-3 text-xs">{formatDate(item.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {item.status && (
                        <button
                          type="button"
                          disabled={!user || user.id === item.id || statusMutation.isPending}
                          onClick={() => setStatusChange({ user: item, isActive: item.status !== 'active' })}
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 ${
                            item.status === 'active'
                              ? 'border-red-200 text-red-700 hover:bg-red-50'
                              : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <UserRoundX size={14} aria-hidden="true" />
                          {item.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <span>Page {current} of {pages}</span>
            <div className="flex gap-2">
              <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
              <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={!!statusChange}
        onClose={() => setStatusChange(null)}
        onConfirm={() => {
          if (statusChange) statusMutation.mutate({
            userId: statusChange.user.id,
            isActive: statusChange.isActive,
          })
        }}
        title={`${statusChange?.isActive ? 'Activate' : 'Deactivate'} this account?`}
        description={statusChange ? `This changes the backend account status for ${statusChange.user.name} (${statusChange.user.email}).` : ''}
        confirmLabel={statusMutation.isPending ? 'Saving…' : statusChange?.isActive ? 'Activate account' : 'Deactivate account'}
        variant={statusChange?.isActive ? 'default' : 'danger'}
      />
    </section>
  )
}
