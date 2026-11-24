import { useEffect, useState, type FormEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { useAuth } from '../../authentication'
import { useOrganizerKyc } from '../hooks/useOrganizerKyc'

export function OrganizerKycPage() {
  const { user } = useAuth()
  const { kyc, loading, error, saving, submit } = useOrganizerKyc()
  const [businessName, setBusinessName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [documentType, setDocumentType] = useState('National ID')
  const [documentUrl, setDocumentUrl] = useState('')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!kyc) return
    setBusinessName(kyc.businessName)
    setRegistrationNumber(kyc.registrationNumber ?? '')
    setDocumentType(kyc.documentType || 'National ID')
    setDocumentUrl(kyc.documentUrl)
  }, [kyc])

  if (!user) return null

  async function submitForm(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    if (!businessName.trim()) return setFormError('Enter your business or organization name.')
    if (!documentType.trim() || documentType.trim().length > 50) return setFormError('Choose a valid document type.')
    try {
      const parsedUrl = new URL(documentUrl.trim())
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') throw new Error('Invalid protocol')
    } catch {
      return setFormError('Enter a valid link to your verification document.')
    }
    setFormError('')
    try {
      await submit({
        businessName: businessName.trim(),
        registrationNumber: registrationNumber.trim() || undefined,
        documentType: documentType.trim(),
        documentUrl: documentUrl.trim(),
      })
    } catch (caught) {
      setFormError(caught instanceof Error ? caught.message : 'Could not save your details. Try again.')
    }
  }

  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20'

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
      <form onSubmit={submitForm} className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-extrabold text-navy-dark">Confirm your details</h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome, {user.name}. Add your business details and a link to your verification document. An administrator reviews every submission before you can manage events.
        </p>

        {loading && <p className="mt-5 text-sm text-slate-500">Loading your verification status...</p>}
        {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {kyc?.status === 'Pending' && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your submission is pending admin review. Event management unlocks after approval.
          </div>
        )}
        {kyc?.status === 'Verified' && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Your organizer profile is verified. <Link to="/organizer/dashboard" className="font-semibold underline">Go to dashboard</Link>
          </div>
        )}
        {kyc?.status === 'Rejected' && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Your previous submission was rejected. {kyc.reviewerNotes || 'Update the details below and resubmit.'}
          </div>
        )}

        {formError && (
          <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>
        )}

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Business or organization name
          <input className={field} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Nyasa Events" autoComplete="organization" required />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Registration number (optional)
          <input className={field} value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="e.g. REG-2026-88412" />
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
          {saving ? 'Saving…' : kyc?.status === 'Verified' ? 'Update details' : 'Submit for review'}
        </button>
      </form>
    </div>
  )
}
