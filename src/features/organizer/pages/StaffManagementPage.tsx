import { useState, useEffect, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { api } from '../../../lib/backend'
import { createMyStaff } from '../../../lib/backendUsers'
import { useAllEvents } from '../../events/hooks/useEvents'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useToast } from '../../toast'

const field = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy'
const emptyForm = { name: '', email: '', password: '' }

interface SafeStaffMember {
  id: string
  name: string
  email: string
  assignedEventIds: string[]
  isActive: boolean
}

export function StaffManagementPage() {
  const { showToast } = useToast()
  const { data: events = [] } = useAllEvents()

  const [staff, setStaff] = useState<SafeStaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<SafeStaffMember | null>(null)

  async function loadStaff() {
    setIsLoading(true)
    setLoadError(null)
    try {
      const result = await api<any>('/organizers/me/staff')
      const list = Array.isArray(result) ? result : (result?.data || result?.staff || [])
      
      const cleaned = list.map((raw: any) => {
        // 1. Grab the staffId, fallback to id
        const rawId = raw.staffId ?? raw.id ?? raw.userId
        const safeId = rawId !== undefined && rawId !== null ? String(rawId) : ''

        // 2. Extract the event IDs from the array of objects: [{ eventId: "4", title: "..." }]
        let ids: string[] = []
        if (Array.isArray(raw.events)) {
          ids = raw.events.map((e: any) => String(e.eventId ?? e.id ?? e))
        } else if (Array.isArray(raw.assignedEventIds)) {
          ids = raw.assignedEventIds.map(String)
        }

        return {
          id: safeId,
          name: raw.name ?? 'Unknown',
          email: raw.email ?? '',
          assignedEventIds: ids, // Now contains ["4"]
          isActive: raw.isActive ?? raw.active ?? true
        }
      })

      // We filter out any staff where the ID came back as empty/undefined
      const validStaff = cleaned.filter((s: SafeStaffMember) => s.id !== '')
      setStaff(validStaff)
      
                  if (validStaff.length > 0 && validStaff[0].assignedEventIds.length > 0) {
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load staff.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStaff()
  }, [])

  async function run(action: () => Promise<unknown>, success: string) {
    try {
      await action()
      await loadStaff()
      showToast(success, 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Something went wrong', 'error')
    }
  }

  async function create(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.name.trim()) return setFormError('Enter the staff member’s name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setFormError('Enter a valid email address.')
    if (form.password.length < 8) return setFormError('The password needs at least 8 characters.')
    setSaving(true)
    try {
      await createMyStaff(form)
      setForm(emptyForm)
      await loadStaff()
      showToast('Staff account created', 'success')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setSaving(false)
    }
  }

  function toggleEvent(member: SafeStaffMember, eventId: string) {
    const current = member.assignedEventIds
    const stringIds = current.includes(eventId)
      ? current.filter((id) => id !== eventId)
      : [...current, eventId]
    
    const numericIds = stringIds.map(Number).filter(id => !isNaN(id) && id > 0)

    
    void run(() => api(`/organizers/me/staff/${encodeURIComponent(member.id)}/events`, { 
      method: 'PUT', 
      body: { eventIds: numericIds } 
    }), 'Assignments saved')
  }

  function toggleActive(member: SafeStaffMember) {
    void run(() => api(`/organizers/me/staff/${encodeURIComponent(member.id)}/active`, { method: 'PATCH', body: { isActive: !member.isActive } }), member.isActive ? 'Staff disabled' : 'Staff enabled')
  }

  function remove(member: SafeStaffMember) {
    void run(() => api(`/organizers/me/staff/${encodeURIComponent(member.id)}`, { method: 'DELETE' }), 'Staff removed')
  }

  return (
    <main className="mx-auto min-h-[60vh] max-w-4xl px-4 py-20 sm:px-6">
      <Link to="/organizer/dashboard" className="text-sm font-semibold text-slate-600 hover:text-navy">
        ← Organizer dashboard
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold text-navy-dark">Staff</h1>
      <p className="mt-2 text-sm text-slate-600">
        Staff scan tickets at the door. They can only scan the events you assign to them.
      </p>

      <form onSubmit={create} className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm" noValidate>
        <h2 className="text-lg font-bold text-navy-dark">Add a staff member</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium">Name
            <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Email
            <input type="email" className={field} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block text-sm font-medium">Temporary password
            <input type="password" className={field} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
          </label>
        </div>
        {formError && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{formError}</p>}
        <button type="submit" disabled={saving} className="mt-4 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-60">
          {saving ? 'Creating…' : 'Create staff account'}
        </button>
      </form>

      <section className="mt-6 space-y-4" aria-label="Your staff">
        {isLoading && <p className="text-sm text-slate-500">Loading staff…</p>}
        {loadError && <p role="alert" className="text-sm text-red-600">{loadError}</p>}
        {!isLoading && !loadError && staff.length === 0 && (
          <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">You have no staff yet.</p>
        )}
        
        {staff.map((member) => (
          <article key={member.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-bold text-navy-dark">{member.name}</h3>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${member.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                  {member.isActive ? 'Active' : 'Disabled'}
                </span>
                <button onClick={() => toggleActive(member)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50">
                  {member.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => setRemoving(member)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                  Remove
                </button>
              </div>
            </div>
            <fieldset className="mt-4" disabled={!member.isActive}>
              <legend className="text-xs font-semibold uppercase text-slate-500">Events they can scan</legend>
              {events.length === 0 && <p className="mt-2 text-sm text-slate-500">Create an event first.</p>}
              <div className="mt-2 flex flex-wrap gap-2">
                {events.map((event) => (
                  <label key={event.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm">
                    <input
                      type="checkbox"
                      checked={(member.assignedEventIds ?? []).includes(String(event.id))}
                      onChange={() => toggleEvent(member, String(event.id))}
                    />
                    {event.name}
                  </label>
                ))}
              </div>
            </fieldset>
          </article>
        ))}
      </section>

      <ConfirmDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() => { if (removing) remove(removing) }}
        title={removing ? `Remove ${removing.name}?` : 'Remove staff?'}
        description="Their login is switched off and they can no longer scan tickets."
        confirmLabel="Remove"
        variant="danger"
      />
    </main>
  )
}
