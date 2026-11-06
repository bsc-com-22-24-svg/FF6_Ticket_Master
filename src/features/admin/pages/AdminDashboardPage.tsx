import { useEffect, useMemo, useState } from 'react'
import { ShieldAlert, DollarSign, Check, X, Users, Ban, Trash2, UserPlus, ShieldCheck, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { listAllEvents, saveEvent, type StoredEvent } from '../../../lib/events'
import { listAllKYC, saveKYC, type OrganizerKYC } from '../../../lib/verification'
import {
  AUDIT_ACTION_LABELS,
  deleteAuditEntries,
  getCurrentActor,
  isAdmin,
  listAuditLogs,
  recordAudit,
  recordDeniedAccess,
  verifyAuditLog,
  type AuditAction,
  type AuditActor,
  type AuditEntry,
} from '../../../lib/audit'
import {
  changeUserRole,
  createAdmin,
  deleteUser,
  listUsers,
  setUserDisabled,
  USER_ROLES,
  type ManagedUser,
  type UserRole,
} from '../../../lib/adminUsers'
import { useToast } from '../../toast'
import {StatCard} from '../../organizer/components/StatCard'
import { UserManagement } from '../components/UserManagement'

type Tab = 'organizers' | 'events' | 'users' | 'audit'

interface WeekGroup { key: string; label: string; entries: AuditEntry[] }
interface MonthGroup { key: string; label: string; count: number; weeks: WeekGroup[] }
interface PendingDelete { ids: string[]; title: string }

const pad = (n: number) => String(n).padStart(2, '0')

function weekStartOf(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // weeks start on Monday
  return d
}

/** Groups newest-first logs into months, and weeks inside each month. */
function groupLogs(logs: AuditEntry[]): MonthGroup[] {
  const months = new Map<string, MonthGroup>()
  for (const log of logs) {
    const date = new Date(log.timestamp)
    const monthKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
    let month = months.get(monthKey)
    if (!month) {
      month = {
        key: monthKey,
        label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        count: 0,
        weeks: [],
      }
      months.set(monthKey, month)
    }
    const start = weekStartOf(date)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const weekKey = `${monthKey}|${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`
    let week = month.weeks.find((w) => w.key === weekKey)
    if (!week) {
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
      week = { key: weekKey, label: `Week of ${fmt(start)} – ${fmt(end)} ${end.getFullYear()}`, entries: [] }
      month.weeks.push(week)
    }
    week.entries.push(log)
    month.count += 1
  }
  return Array.from(months.values())
}

const tabClass = (active: boolean) =>
  `pb-3 font-semibold text-sm ${active ? 'border-b-2 border-navy text-navy' : 'text-slate-500 hover:text-slate-700'}`

export function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()

  // The signed-in user (read from the 'tm_user' session). Only administrators may use this page.
  const [actor] = useState<AuditActor | null>(() => getCurrentActor())
  const authorized = isAdmin(actor)

  const [events, setEvents] = useState<StoredEvent[]>(() => listAllEvents())
  const [kycs, setKycs] = useState<OrganizerKYC[]>(() => listAllKYC())
  const [users, setUsers] = useState<ManagedUser[]>(() => (isAdmin(actor) ? listUsers(actor) : []))
  const [logs, setLogs] = useState<AuditEntry[]>(() => (isAdmin(actor) ? listAuditLogs(actor) : []))
  const [activeTab, setActiveTab] = useState<Tab>('organizers')
  const [auditFilter, setAuditFilter] = useState<'all' | AuditAction>('all')
  const [auditSearch, setAuditSearch] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [expanded, setExpanded] = useState<Set<string> | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)

  // Log attempts by non-admins to open this page.
  useEffect(() => {
    if (actor && !authorized) recordDeniedAccess(actor, 'Admin Dashboard')
  }, [actor, authorized])

  const filteredLogs = useMemo(() => {
    const term = auditSearch.trim().toLowerCase()
    return logs.filter((log) => {
      if (auditFilter !== 'all' && log.action !== auditFilter) return false
      if (!term) return true
      return [log.actorName, log.targetLabel, log.details, AUDIT_ACTION_LABELS[log.action]]
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [logs, auditFilter, auditSearch])

  const groups = useMemo(() => groupLogs(filteredLogs), [filteredLogs])

  if (!actor || !authorized) {
    return (
      <div className="min-h-screen bg-slate-50 pb-16 pt-20">
        <div className="mx-auto max-w-xl px-4 text-center">
          <ShieldAlert className="mx-auto mb-4 text-red-600" size={40} />
          <h1 className="text-2xl font-extrabold text-navy-dark">Access denied</h1>
          <p className="mt-2 text-slate-600">
            This area is for administrators only. Sign in with an administrator account to continue.
          </p>
        </div>
      </div>
    )
  }

  // `admin` is guaranteed to be an administrator from here on.
  const admin: AuditActor = actor

  const totalRevenue = events.reduce(
    (sum, event) => sum + event.ticketTypes.reduce((tSum, type) => tSum + type.sold * type.price, 0),
    0,
  )
  const pendingEvents = events.filter((e) => e.status === 'Pending').length
  const pendingKyc = kycs.filter((k) => k.status === 'Pending').length
  const integrity = verifyAuditLog(admin)

  function refreshAll() {
    setEvents(listAllEvents())
    setKycs(listAllKYC())
    setUsers(listUsers(admin))
    setLogs(listAuditLogs(admin))
  }

  /** Runs an admin action, shows its result, and refreshes every list (including the audit log). */
  function attempt(fn: () => void, successMessage?: string, tone: 'success' | 'info' = 'success') {
    try {
      fn()
      if (successMessage) showToast(successMessage, tone)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'info')
    }
    refreshAll()
  }

  function updateEventStatus(event: StoredEvent, newStatus: 'Published' | 'Draft' | 'Pending') {
    const action: AuditAction =
      newStatus === 'Published' ? 'EVENT_APPROVED' : event.status === 'Pending' ? 'EVENT_REJECTED' : 'EVENT_UNPUBLISHED'
    attempt(
      () => {
        recordAudit(admin, {
          action,
          targetType: 'event',
          targetId: String(event.id),
          targetLabel: event.title,
          details: `${event.status} → ${newStatus}`,
        })
        saveEvent({ ...event, status: newStatus })
        queryClient.invalidateQueries({ queryKey: ['events'] })
      },
      newStatus === 'Published' ? 'Event approved and published' : newStatus === 'Draft' ? 'Event rejected' : undefined,
      newStatus === 'Published' ? 'success' : 'info',
    )
  }

  function updateKycStatus(kyc: OrganizerKYC, newStatus: 'Verified' | 'Rejected') {
    attempt(
      () => {
        recordAudit(admin, {
          action: newStatus === 'Verified' ? 'KYC_VERIFIED' : 'KYC_REJECTED',
          targetType: 'organizer',
          targetId: String(kyc.userId),
          targetLabel: kyc.businessName,
          details: `${kyc.status} → ${newStatus}`,
        })
        saveKYC({ ...kyc, status: newStatus })
      },
      newStatus === 'Verified' ? 'Organizer verified' : 'Organizer verification rejected',
      newStatus === 'Verified' ? 'success' : 'info',
    )
  }

  function handleToggleDisabled(user: ManagedUser) {
    const disabling = !user.disabled
    if (disabling && !window.confirm(`Disable the account for ${user.name}?`)) return
    attempt(() => setUserDisabled(admin, user.id, disabling), disabling ? 'Account disabled' : 'Account enabled', 'info')
  }

  function handleDelete(user: ManagedUser) {
    if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return
    attempt(() => deleteUser(admin, user.id), 'User deleted', 'info')
  }

  function handleRoleChange(user: ManagedUser, role: UserRole) {
    if (role === 'admin' && !window.confirm(`Give ${user.name} full administrator access?`)) return
    attempt(() => changeUserRole(admin, user.id, role), 'Role updated')
  }

  const defaultOpen = new Set<string>(
    [groups[0]?.key, groups[0]?.weeks[0]?.key].filter((k): k is string => !!k),
  )
  const isOpen = (key: string) => (expanded ?? defaultOpen).has(key)
  function toggleOpen(key: string) {
    const next = new Set(expanded ?? defaultOpen)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setExpanded(next)
  }

  function requestDelete(entries: AuditEntry[], title: string) {
    const deletable = entries.filter((e) => e.action !== 'LOGS_DELETED')
    if (deletable.length === 0) {
      showToast('Nothing to delete. Deletion records are protected.', 'info')
      return
    }
    setPendingDelete({ ids: deletable.map((e) => e.id), title })
  }

  function confirmDelete() {
    if (!pendingDelete) return
    const { ids, title } = pendingDelete
    setPendingDelete(null)
    attempt(() => {
      deleteAuditEntries(admin, ids, title)
    }, `${ids.length} audit record${ids.length === 1 ? '' : 's'} deleted`, 'info')
  }

  function handleCreateAdmin() {
    if (!window.confirm(`Create an administrator account for ${newAdminName.trim() || 'this user'}?`)) return
    attempt(() => {
      createAdmin(admin, { name: newAdminName, email: newAdminEmail })
      setNewAdminName('')
      setNewAdminEmail('')
    }, 'Administrator created')
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl text-navy-dark">Admin Control Center</h1>
          <p className="mt-2 text-slate-600">Verify organizers, moderate events, manage users and review the audit trail.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard title="Total Platform Revenue" value={`MK ${totalRevenue.toLocaleString()}`} icon={DollarSign as any} />

          <StatCard title="Total Events" value={events.length.toString()} icon={ShieldAlert as any} />
        </div>

        <div className="flex gap-4 mb-4 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('organizers')} className={tabClass(activeTab === 'organizers')}>Organizer Verification</button>
          <button onClick={() => setActiveTab('events')} className={tabClass(activeTab === 'events')}>Event Moderation</button>
          <button onClick={() => setActiveTab('users')} className={tabClass(activeTab === 'users')}>User Management</button>
          <button onClick={() => setActiveTab('audit')} className={tabClass(activeTab === 'audit')}>Audit Log</button>
        </div>

        {activeTab === 'users' && <UserManagement />}

        {activeTab === 'events' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold mb-4 text-navy-dark">Event Moderation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Event Name</th>
                    <th className="px-4 py-3">Organizer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No events to moderate yet.</td></tr>
                  )}
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-navy-dark">{event.title}</td>
                      <td className="px-4 py-3">{event.organizer}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${event.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{event.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {event.status === 'Published' ? (
                          <button onClick={() => toggleEventStatus(event)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 ml-auto"><Ban size={14} /> Unpublish</button>
                        ) : (
                          <button onClick={() => toggleEventStatus(event)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 ml-auto"><RotateCcw size={14} /> Publish</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold mb-4 text-navy-dark">User Management</h2>

            <div className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-end">
              <label className="flex-1 text-xs font-semibold text-slate-600">
                Administrator name
                <input value={newAdminName} onChange={(e) => setNewAdminName(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <label className="flex-1 text-xs font-semibold text-slate-600">
                Administrator email
                <input type="email" value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-normal" />
              </label>
              <button onClick={handleCreateAdmin} className="flex items-center justify-center gap-1 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                <UserPlus size={16} /> Create administrator
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No users found.</td></tr>
                  )}
                  {users.map((user) => {
                    const isSelf = user.id === admin.id
                    return (
                      <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                        <td className="px-4 py-3 font-semibold text-navy-dark">{user.name}{isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(you)</span>}</td>
                        <td className="px-4 py-3">{user.email || '—'}</td>
                        <td className="px-4 py-3">
                          <select
                            value={user.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs disabled:opacity-60"
                          >
                            {USER_ROLES.map((role) => (
                              <option key={role} value={role}>{role}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${user.disabled ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {user.disabled ? 'Disabled' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isSelf && (
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleToggleDisabled(user)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                <Ban size={14} /> {user.disabled ? 'Enable' : 'Disable'}
                              </button>
                              <button onClick={() => handleDelete(user)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-navy-dark">Audit Log</h2>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${integrity.intact ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {integrity.intact ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  {integrity.intact ? 'Log integrity verified' : 'Log has been altered'}
                </span>
                <button
                  onClick={() => requestDelete(logs, 'all audit records')}
                  disabled={logs.length === 0}
                  className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 size={14} /> Delete all
                </button>
              </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Search by administrator, target or details"
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              />
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value as 'all' | AuditAction)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All actions</option>
                {(Object.keys(AUDIT_ACTION_LABELS) as AuditAction[]).map((key) => (
                  <option key={key} value={key}>{AUDIT_ACTION_LABELS[key]}</option>
                ))}
              </select>
            </div>

            {groups.length === 0 ? (
              <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No audit records match. Administrative actions will appear here as they happen.
              </p>
            ) : (
              <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
                {groups.map((month) => {
                  const monthOpen = isOpen(month.key)
                  return (
                    <div key={month.key} className="rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                        <button onClick={() => toggleOpen(month.key)} className="flex flex-1 items-center gap-2 text-left text-sm font-bold text-navy-dark">
                          {monthOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          {month.label}
                          <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-500">{month.count}</span>
                        </button>
                        <button
                          onClick={() => requestDelete(month.weeks.flatMap((w) => w.entries), `month of ${month.label}`)}
                          className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                        >
                          <Trash2 size={13} /> Delete month
                        </button>
                      </div>

                      {monthOpen && (
                        <div className="space-y-2 p-3">
                          {month.weeks.map((week) => {
                            const weekOpen = isOpen(week.key)
                            return (
                              <div key={week.key} className="rounded-lg border border-slate-100">
                                <div className="flex items-center justify-between gap-2 px-3 py-2">
                                  <button onClick={() => toggleOpen(week.key)} className="flex flex-1 items-center gap-2 text-left text-sm font-semibold text-slate-700">
                                    {weekOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    {week.label}
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">{week.entries.length}</span>
                                  </button>
                                  <button
                                    onClick={() => requestDelete(week.entries, week.label.toLowerCase())}
                                    className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                                  >
                                    <Trash2 size={13} /> Delete week
                                  </button>
                                </div>

                                {weekOpen && (
                                  <div className="max-h-72 overflow-auto border-t border-slate-100">
                                    <table className="w-full text-left text-sm text-slate-600">
                                      <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                          <th className="px-4 py-2">Date and time</th>
                                          <th className="px-4 py-2">Administrator</th>
                                          <th className="px-4 py-2">Action</th>
                                          <th className="px-4 py-2">Affected</th>
                                          <th className="px-4 py-2">Details</th>
                                          <th className="px-4 py-2 text-right">Delete</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {week.entries.map((log) => (
                                          <tr key={log.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                            <td className="px-4 py-2 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-4 py-2 font-semibold text-navy-dark">{log.actorName}</td>
                                            <td className="px-4 py-2">{AUDIT_ACTION_LABELS[log.action] ?? log.action}</td>
                                            <td className="px-4 py-2">{log.targetLabel} <span className="text-xs text-slate-400">({log.targetType})</span></td>
                                            <td className="px-4 py-2">{log.details || '—'}</td>
                                            <td className="px-4 py-2 text-right">
                                              {log.action === 'LOGS_DELETED' ? (
                                                <span className="text-xs text-slate-400">Protected</span>
                                              ) : (
                                                <button
                                                  onClick={() => requestDelete([log], 'a single record')}
                                                  aria-label="Delete this record"
                                                  className="text-red-600 hover:text-red-700"
                                                >
                                                  <Trash2 size={15} />
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
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2 text-red-600"><AlertTriangle size={20} /></div>
              <div>
                <h3 className="text-lg font-bold text-navy-dark">Delete audit records?</h3>
                <p className="mt-1 text-sm text-slate-600">
                  You are about to permanently delete <strong>{pendingDelete.ids.length}</strong> record{pendingDelete.ids.length === 1 ? '' : 's'} ({pendingDelete.title}). This cannot be undone.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Deleting audit records reduces accountability. This deletion will be recorded in the log with your name and the time.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setPendingDelete(null)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={confirmDelete} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Yes, delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
