import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Modal } from '../../../components/ui/Modal'
import { StatCard } from '../components/StatCard'
import { useEvents } from '../hooks/useEventStats'
import { useStaff } from '../hooks/useStaff'
import type { StaffMember } from '../../../lib/backendStaff'

const emptyForm = { name: '', email: '', password: '' }

const field =
  'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy'
const primaryButton =
  'rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:cursor-not-allowed disabled:opacity-60'
const secondaryButton =
  'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60'
function messageFor(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function StaffManagementPage() {
  const { events, loadError: eventsError } = useEvents()
  const {
    staff,
    totalStaff,
    activeStaff,
    disabledStaff,
    search,
    setSearch,
    loading,
    error,
    unsupported,
    saving,
    createStaff,
    assignEvents,
    setActive,
    removeStaff,
  } = useStaff()

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState('')

  function openCreate() {
    setForm(emptyForm)
    setFormError('')
    setCreating(true)
  }

  async function submitCreate(e: FormEvent) {
    e.preventDefault()
    setFormError('')
    if (form.name.trim().length < 2) {
      setFormError('Enter the staff member’s full name.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      setFormError('Enter a valid email address.')
      return
    }
    if (form.password.length < 10) {
      setFormError('The temporary password must be at least 10 characters.')
      return
    }

    try {
      await createStaff(form)
      setCreating(false)
      setForm(emptyForm)
      setNotice('Staff account created. Assign at least one event before they can scan tickets.')
    } catch (err) {
      setFormError(messageFor(err, 'Could not create the staff account.'))
    }
  }

  function openAssign(member: StaffMember) {
    setEditing(member)
    setSelectedEventIds(member.events.map((event) => event.eventId))
    setActionError('')
  }

  function toggleEvent(eventId: string) {
    setSelectedEventIds((current) =>
      current.includes(eventId)
        ? current.filter((id) => id !== eventId)
        : [...current, eventId],
    )
  }

  async function saveAssignments() {
    if (!editing) return
    setBusyId(editing.staffId)
    setActionError('')
    try {
      await assignEvents(editing.staffId, selectedEventIds)
      setEditing(null)
      setNotice('Event assignments updated.')
    } catch (err) {
      setActionError(messageFor(err, 'Could not update the event assignments.'))
    } finally {
      setBusyId('')
    }
  }

  async function toggleActive(member: StaffMember) {
    setBusyId(member.staffId)
    setActionError('')
    try {
      await setActive(member.staffId, !member.isActive)
      setNotice(member.isActive ? 'Staff account disabled.' : 'Staff account enabled.')
    } catch (err) {
      setActionError(messageFor(err, 'Could not change the staff account status.'))
    } finally {
      setBusyId('')
    }
  }

  async function deleteMember(member: StaffMember) {
    if (!window.confirm(`Remove ${member.name}? Their login will stop working and their event assignments will be deleted.`)) {
      return
    }
    setBusyId(member.staffId)
    setActionError('')
    try {
      await removeStaff(member.staffId)
      setNotice('Staff member removed.')
    } catch (err) {
      setActionError(messageFor(err, 'Could not remove the staff member.'))
    } finally {
      setBusyId('')
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16 pt-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Link to="/organizer/dashboard" className="text-sm font-semibold text-slate-600 hover:text-navy">
          ← Organizer dashboard
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-navy-dark">Staff Roster</h1>
            <p className="mt-2 text-slate-600">
              Create check-in staff, assign them to your events, and control whether they can scan.
            </p>
          </div>
          <button type="button" onClick={openCreate} className={primaryButton}>
            + Create staff
          </button>
        </div>

        <div
          role="status"
          className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <strong>Backend support:</strong> Staff management uses the organizer-staff endpoints
          added in backend 1.3. If you are connected to backend 1.2, this section is not supported
          and the staff list will fail. Staff must be assigned to an event before they can scan.
        </div>

        {notice && (
          <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            {notice}
          </div>
        )}

        {unsupported && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            The connected backend does not expose `/organizers/me/staff`. Start backend 1.3 and
            try again.
          </div>
        )}

        {error && !unsupported && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {eventsError && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Could not load your events: {eventsError}
          </div>
        )}

        <div className="metrics-grid mt-6">
          <StatCard title="Total Staff" value={totalStaff} icon="👥" color="#3b82f6" />
          <StatCard title="Active" value={activeStaff} icon="✅" color="#10b981" />
          <StatCard title="Disabled" value={disabledStaff} icon="⛔" color="#64748b" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-navy-dark">Staff accounts</h2>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or event"
              aria-label="Search staff"
              className="w-full max-w-sm rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
            />
          </div>

          {actionError && (
            <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {actionError}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-slate-500">Loading staff...</p>
          ) : staff.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              {search ? 'No staff match your search.' : 'No staff accounts yet. Create one to get started.'}
            </p>
          ) : (
            <div className="table-responsive">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Assigned events</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.staffId}>
                      <td className="font-semibold">{member.name}</td>
                      <td>{member.email}</td>
                      <td>
                        {member.events.length === 0 ? (
                          <span className="text-amber-700">None — cannot scan yet</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {member.events.map((event) => (
                              <span
                                key={event.eventId}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700"
                              >
                                {event.title}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${member.isActive ? 'published' : 'draft'}`}>
                          {member.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openAssign(member)}
                            className="btn-action"
                            disabled={busyId === member.staffId}
                          >
                            Assign events
                          </button>
                          <button
                            type="button"
                            onClick={() => void toggleActive(member)}
                            className="btn-action"
                            disabled={busyId === member.staffId}
                          >
                            {member.isActive ? 'Disable' : 'Enable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteMember(member)}
                            className="btn-action text-red-700"
                            disabled={busyId === member.staffId}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={creating} onClose={() => setCreating(false)} title="Create staff account">
        <form onSubmit={(e) => void submitCreate(e)} className="space-y-3">
          {formError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {formError}
            </p>
          )}
          <label className="block text-sm font-medium">
            Full name
            <input
              className={field}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoComplete="name"
            />
          </label>
          <label className="block text-sm font-medium">
            Email
            <input
              type="email"
              className={field}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-medium">
            Temporary password
            <input
              type="password"
              className={field}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              placeholder="At least 10 characters"
            />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setCreating(false)} className={secondaryButton}>
              Cancel
            </button>
            <button type="submit" className={primaryButton} disabled={saving}>
              {saving ? 'Creating...' : 'Create staff'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing ? `Assign events to ${editing.name}` : 'Assign events'}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Select every event this staff member may scan. Sending an empty selection removes all
            their assignments.
          </p>

          {actionError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {actionError}
            </p>
          )}

          {events.length === 0 ? (
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
              You have no events yet. Create an event first.
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
              {events.map((event) => (
                <label key={event.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={selectedEventIds.includes(event.id)}
                    onChange={() => toggleEvent(event.id)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">{event.name}</span>
                    <span className="block text-xs text-slate-500">
                      {event.date} · {event.venue} · {event.status}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setEditing(null)} className={secondaryButton}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void saveAssignments()}
              className={primaryButton}
              disabled={!!busyId}
            >
              {busyId ? 'Saving...' : 'Save assignments'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}
