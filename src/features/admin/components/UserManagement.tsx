import { useState, type FormEvent } from 'react'
import { Search, UserPlus, Power, Trash2, Eye } from 'lucide-react'
import { useAuth } from '../../authentication'
import {
  createAccount, deleteAccount, listManagedUsers, setAccountStatus,
  type AccountStatus, type ManagedUser, type Role,
} from '../../authentication/authStore'
import { listAllEvents, isEventOwnedBy } from '../../../lib/events'
import { listBookingsForUser, listTicketsForUser } from '../../../lib/tickets'
import { getKYC } from '../../../lib/verification'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useToast } from '../../toast'

const PAGE_SIZE = 8
const ROLES: Role[] = ['customer', 'organizer', 'staff', 'admin']
const field = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy'
const emptyForm = { name: '', email: '', password: '', role: 'customer' as Role, organizerId: '', actorPassword: '' }

const date = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function Activity({ target, everyone }: { target: ManagedUser; everyone: ManagedUser[] }) {
  const rows: [string, string][] = []
  if (target.role === 'customer') {
    rows.push(['Tickets', String(listTicketsForUser(target.id).length)])
    rows.push(['Bookings', String(listBookingsForUser(target.id).length)])
  }
  if (target.role === 'organizer') {
    rows.push(['Events', String(listAllEvents().filter((e) => isEventOwnedBy(e, target)).length)])
    rows.push(['Staff', String(everyone.filter((u) => u.organizerId === target.id).length)])
    rows.push(['Verification', getKYC(target.id)?.status ?? 'Unverified'])
  }
  if (target.role === 'staff') {
    rows.push(['Organizer', everyone.find((u) => u.id === target.organizerId)?.name ?? 'None'])
    rows.push(['Assigned events', String(target.assignedEventIds.length)])
  }
  return (
    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="rounded-lg bg-slate-50 px-3 py-2">
          <dt className="text-xs text-slate-500">{label}</dt>
          <dd className="font-semibold text-navy-dark">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function UserManagement() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [, setVersion] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | 'all'>('all')
  const [status, setStatus] = useState<AccountStatus | 'all'>('all')
  const [page, setPage] = useState(1)
  const [viewing, setViewing] = useState<ManagedUser | null>(null)
  const [deleting, setDeleting] = useState<ManagedUser | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)

  const everyone = listManagedUsers() // read fresh each render; setVersion forces one after a change
  const organizers = everyone.filter((u) => u.role === 'organizer')

  const q = search.trim().toLowerCase()
  const filtered = everyone
    .filter((u) => (role === 'all' || u.role === role) && (status === 'all' || u.status === status))
    .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  if (!user) return null

  function run(action: () => void, success: string) {
    try {
      action()
      setVersion((v) => v + 1)
      showToast(success, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    }
  }

  function create(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      createAccount(user!, { ...form, organizerId: form.organizerId || undefined })
      setVersion((v) => v + 1)
      setCreating(false)
      setForm(emptyForm)
      showToast('Account created', 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account')
    }
  }

  const filterClass = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-navy'

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-navy-dark">Users ({filtered.length})</h2>
        <button onClick={() => { setError(null); setCreating(true) }} className="flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
          <UserPlus size={16} /> Create user
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <label className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input aria-label="Search users" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name or email" className={`${filterClass} w-full pl-9`} />
        </label>
        <select aria-label="Filter by role" value={role} onChange={(e) => { setRole(e.target.value as Role | 'all'); setPage(1) }} className={filterClass}>
          <option value="all">All roles</option>
          {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as AccountStatus | 'all'); setPage(1) }} className={filterClass}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

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
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users match your search.</td></tr>
            )}
            {visible.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-semibold text-navy-dark">{u.name}</div>
                  <div className="text-xs">{u.email}</div>
                </td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                    {u.status === 'active' ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{date(u.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <button onClick={() => setViewing(u)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"><Eye size={14} /> View</button>
                    <button
                      onClick={() => run(() => setAccountStatus(user, u.id, u.status === 'active' ? 'disabled' : 'active'), u.status === 'active' ? 'Account disabled' : 'Account enabled')}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                    ><Power size={14} /> {u.status === 'active' ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => setDeleting(u)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"><Trash2 size={14} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
        <span>Page {current} of {pages}</span>
        <div className="flex gap-2">
          <button disabled={current <= 1} onClick={() => setPage(current - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Previous</button>
          <button disabled={current >= pages} onClick={() => setPage(current + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 font-semibold disabled:opacity-40">Next</button>
        </div>
      </div>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title={viewing?.name ?? ''}>
        {viewing && (
          <div className="text-sm text-slate-600">
            <p>{viewing.email}</p>
            <p className="mt-1 capitalize">{viewing.role} · {viewing.status} · registered {date(viewing.createdAt)}</p>
            <Activity target={viewing} everyone={everyone} />
          </div>
        )}
      </Modal>

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Create user">
        <form onSubmit={create} className="space-y-3">
          <label className="block text-sm font-medium">Full name
            <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Email
            <input type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Temporary password
            <input type="password" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </label>
          <label className="block text-sm font-medium">Role
            <select className={field} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
              {ROLES.map((r) => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </label>
          {form.role === 'staff' && (
            <label className="block text-sm font-medium">Organizer
              <select className={field} value={form.organizerId} onChange={(e) => setForm({ ...form, organizerId: e.target.value })}>
                <option value="">Choose an organizer</option>
                {organizers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </label>
          )}
          {form.role === 'admin' && (
            <label className="block text-sm font-medium">Your password (to confirm)
              <input type="password" className={field} value={form.actorPassword} onChange={(e) => setForm({ ...form, actorPassword: e.target.value })} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Administrators can manage every account, so we ask for your password again.</span>
            </label>
          )}
          {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark">Create</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) run(() => deleteAccount(user, deleting.id), 'Account deleted') }}
        title={deleting ? `Delete ${deleting.name}?` : 'Delete account?'}
        description={deleting?.role === 'organizer'
          ? 'Their login and all their staff logins will be removed. Their events, tickets and bookings stay on record. This cannot be undone.'
          : 'Their login will be removed. Any tickets and bookings stay on record. This cannot be undone.'}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
