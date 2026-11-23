import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../authentication'
import { getKYC, submitKyc } from '../../../lib/verification'

// Organizer details are saved directly to the backend. Submission does not wait for
// an admin review or approval before the organizer can use the platform.
export function OrganizerKycPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const existing = user ? getKYC(user.id) : null

  const [businessName, setBusinessName] = useState(existing?.businessName ?? '')
  const [documentType, setDocumentType] = useState(existing?.documentType ?? 'National ID')
  const [documentUrl, setDocumentUrl] = useState(existing?.documentUrl ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!user || saving) return
    if (!businessName.trim()) return setError('Enter your business or organization name.')
    if (!documentType.trim() || documentType.trim().length > 50) return setError('Choose a valid document type.')
    try {
      const parsedUrl = new URL(documentUrl.trim())
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') throw new Error('Invalid protocol')
    } catch {
      return setError('Enter a valid link to your verification document.')
    }
    setError('')
    setSaving(true)
    try {
      await submitKyc(user.id, {
        businessName: businessName.trim(),
        documentType: documentType.trim(),
        documentUrl: documentUrl.trim(),
      })
      void navigate({ to: '/organizer/dashboard' })
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save your details. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20'

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
      <form onSubmit={submit} className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-extrabold text-navy-dark">Confirm your details</h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome, {user.name}. Add your business details and a link to your verification document. You can create and manage events as soon as you save; no admin approval is required.
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Business or organization name
          <input className={field} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Nyasa Events" autoComplete="organization" required />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Verification document type
          <select className={field} value={documentType} onChange={(e) => setDocumentType(e.target.value)} required>
            <option>National ID</option>
            <option>Passport</option>
            <option>Business registration</option>
          </select>
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Verification document link
          <input className={field} type="url" value={documentUrl} onChange={(e) => setDocumentUrl(e.target.value)} placeholder="https://…" autoComplete="url" required />
          <span className="mt-1 block text-xs font-normal text-slate-500">Use a link to an online copy of your selected document.</span>
        </label>

        <button type="submit" disabled={saving} className="mt-6 w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-navy-dark disabled:opacity-60">
          {saving ? 'Saving…' : 'Save and continue'}
        </button>
      </form>
    </div>
  )
}


