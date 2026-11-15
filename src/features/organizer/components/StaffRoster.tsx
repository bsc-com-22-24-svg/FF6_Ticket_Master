import { useState, useEffect, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { api } from '../../../lib/backend'
import { createMyStaff } from '../../../lib/backendUsers'

interface StaffMember {
  id: string
  name: string
  email: string
  assignedEventIds: string[]
  isActive: boolean
}

const emptyForm = { name: '', email: '', password: '' }

// Safely extract whatever ID field the backend actually provided.
function extractId(raw: Record<string, unknown>): string {
  return String(raw.id ?? raw.userId ?? raw.user_id ?? raw.staffId ?? raw.staff_id ?? '')
}

// The organizer's own staff: listed from the backend, and new staff accounts are created there.
export function StaffRoster() {
  const [data, setData] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function loadStaff() {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api<any>('/organizers/me/staff')
      let list: any[] = []
      if (Array.isArray(result)) list = result
      else if (result && Array.isArray(result.data)) list = result.data
      else if (result && Array.isArray(result.staff)) list = result.staff

      const cleaned = list.map((raw) => ({
        id: extractId(raw),
        name: raw.name ?? 'Unnamed Staff',
        email: raw.email ?? '',
        assignedEventIds: Array.isArray(raw.assignedEventIds) ? raw.assignedEventIds.map(String) : 
                          Array.isArray(raw.eventIds) ? raw.eventIds.map(String) : 
                          Array.isArray(raw.events) ? raw.events.map(String) : [],
        isActive: raw.isActive ?? raw.active ?? raw.status !== 'DISABLED',
      }))

      setData(cleaned)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load staff.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadStaff()
  }, [])

  async function create(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setNotice(null)
    if (!form.name.trim()) return setFormError('Enter the staff member’s name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setFormError('Enter a valid email address.')
    if (form.password.length < 8) return setFormError('The password needs at least 8 characters.')
    setSaving(true)
    try {
      await createMyStaff(form)
      setForm(emptyForm)
      await loadStaff()
      setNotice('Staff account created.')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create the account.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <form onSubmit={create} noValidate style={{ marginBottom: '1.5rem' }}>
        <h3>Add a staff member</h3>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="staff-name">Name</label>
            <input id="staff-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="staff-email">Email</label>
            <input id="staff-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label htmlFor="staff-password">Password</label>
            <input id="staff-password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
        </div>
        {formError && <div className="form-error-banner">{formError}</div>}
        {notice && <p className="form-hint">{notice}</p>}
        <div className="form-actions">
          <button type="submit" className="btn-primary-header" disabled={saving}>
            {saving ? 'Creating...' : 'Create staff account'}
          </button>
        </div>
      </form>

      {isLoading && <p className="view-subtitle">Loading your staff...</p>}
      {error && <div className="form-error-banner">{error}</div>}
      {!isLoading && !error && data.length === 0 && (
        <p className="view-subtitle">You have no staff yet. Add one above.</p>
      )}
      {data.length > 0 && (
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Events</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map((member, i) => (
                <tr key={member.id || i}>
                  <td>{member.name}</td>
                  <td>{member.email}</td>
                  <td>{member.assignedEventIds.length}</td>
                  <td>
                    <span className={`status-badge ${member.isActive ? 'published' : 'cancelled'}`}>
                      {member.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="form-hint">
        To choose which events a staff member may scan, switch them off or remove them, open{' '}
        <Link to="/organizer/staff">staff management</Link>.
      </p>
    </div>
  )
}
