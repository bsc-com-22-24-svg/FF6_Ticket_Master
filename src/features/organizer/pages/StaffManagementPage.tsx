import { useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { UserPlus, CalendarCheck, Trash2, Power, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../authentication'
import {
  createStaff, deleteAccount, listStaffOf, setAccountStatus, setStaffEvents,
  type ManagedUser,
} from '../../authentication/authStore'
import { listAllEvents, isEventOwnedBy } from '../../../lib/events'
import { Modal } from '../../../components/ui/Modal'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useToast } from '../../toast'

const input = 'mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy'

export function StaffManagementPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [, setVersion] = useState(0) // bump to re-read the store after a change
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<ManagedUser | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [removing, setRemoving] = useState<ManagedUser | null>(null)

  if (!user) return null
  // read fresh on every render; setVersion forces one after each change
  const staff = listStaffOf(user.id)
  const myEvents = listAllEvents().filter((e) => isEventOwnedBy(e, user))

  const refresh = () => setVersion((v) => v + 1)

  function run(action: () => void, success: string) {
    try {
      action()
      refresh()
      showToast(success, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    }
  }

  function add(e: FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      createStaff(user!, form)
      setForm({ name: '', email: '', password: '' })
      refresh()
      showToast('Staff account created', 'success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the account')
    }
  }

  function openAssign(member: ManagedUser) {
    setAssigning(member)
    setPicked(member.assignedEventIds)
  }

  function eventTitle(id: string) {
    return myEvents.find((e) => e.id === id)?.title ?? id
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <Link to="/organizer/dashboard" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-navy">
          <ArrowLeft size={16} /> Dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">Staff</h1>
        <p className="mt-2 text-slate-600">Create gate staff and choose which of your events each person can scan.</p>

        <form onSubmit={add} className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-lg font-bold"><UserPlus size={18} /> Add a staff member</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-medium">Full name
              <input className={input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="text-sm font-medium">Email
              <input type="email" className={input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label className="text-sm font-medium">Temporary password
              <input type="password" className={input} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
            </label>
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{error}</p>}
          <button type="submit" className="mt-4 rounded-full bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-dark">Create staff account</button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Your staff ({staff.length})</h2>
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Assigned events</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">You have not added any staff yet.</td></tr>
              )}
              {staff.map((member) => (
                <tr key={member.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-dark">{member.name}</div>
                    <div className="text-xs">{member.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                      {member.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {member.assignedEventIds.length === 0 ? 'None yet' : member.assignedEventIds.map(eventTitle).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button onClick={() => openAssign(member)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"><CalendarCheck size={14} /> Events</button>
                      <button
                        onClick={() => run(() => setAccountStatus(user, member.id, member.status === 'active' ? 'disabled' : 'active'), member.status === 'active' ? 'Staff disabled' : 'Staff enabled')}
                        className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
                      ><Power size={14} /> {member.status === 'active' ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => setRemoving(member)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"><Trash2 size={14} /> Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!assigning} onClose={() => setAssigning(null)} title={assigning ? `Events for ${assigning.name}` : ''}>
        {myEvents.length === 0 ? (
          <p className="text-sm text-slate-600">You have no events yet. Create an event first.</p>
        ) : (
          <div className="space-y-2">
            {myEvents.map((event) => (
              <label key={event.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={picked.includes(event.id)}
                  onChange={(e) => setPicked((old) => (e.target.checked ? [...old, event.id] : old.filter((id) => id !== event.id)))}
                />
                <span className="font-medium">{event.title}</span>
                <span className="ml-auto text-xs text-slate-500">{event.status}</span>
              </label>
            ))}
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setAssigning(null)} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => { if (assigning) run(() => setStaffEvents(user, assigning.id, picked), 'Events updated'); setAssigning(null) }}
            className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >Save</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => { if (removing) run(() => deleteAccount(user, removing.id), 'Staff removed') }}
        title="Remove this staff member?"
        description={removing ? `${removing.name} will no longer be able to sign in or scan tickets. Tickets they already scanned stay recorded.` : ''}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  )
}
