import { useEffect, useState, type FormEvent } from 'react'
import { RefreshCw } from 'lucide-react'
import { getMyKyc, submitKyc, type OrganizerKYC } from '../../../lib/verification'

const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20'

function statusLabel(status: string): string {
  switch (status.toUpperCase()) {
    case 'APPROVED':
    case 'VERIFIED': return 'Approved'
    case 'REJECTED': return 'Needs changes'
    case 'PENDING': return 'Under review'
    default: return 'Not submitted'
  }
}

export function OrganizerKycPage() {
  const [kyc, setKyc] = useState<OrganizerKYC | null>(null)
  const [businessName, setBusinessName] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [documentType, setDocumentType] = useState('NATIONAL_ID')
  const [documentUrl, setDocumentUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    let active = true
    void getMyKyc()
      .then((current) => {
        if (!active) return
        setKyc(current)
        if (current) {
          setBusinessName(current.businessName)
          setRegistrationNumber(current.registrationNumber ?? '')
          setDocumentType(current.documentType || 'NATIONAL_ID')
          setDocumentUrl(current.documentUrl)
        }
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Could not load your verification status.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    setError('')
    setSuccess('')
    if (!businessName.trim()) return setError('Enter your business or organization name.')
    if (!documentType.trim()) return setError('Choose the type of verification document.')
    try {
      const parsedUrl = new URL(documentUrl.trim())
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') throw new Error()
    } catch {
      return setError('Enter a valid HTTP or HTTPS link to your verification document.')
    }

    setSaving(true)
    try {
      const updated = await submitKyc({ businessName, registrationNumber, documentType, documentUrl })
      setKyc(updated)
      setSuccess('Your verification details were submitted to the backend for review.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not submit your details. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-extrabold text-navy-dark">Organizer verification</h1>
        <p className="mt-2 text-sm text-slate-600">
          Submit your organization details and a link to a verification document. An administrator reviews the submission before verification is complete.
        </p>

        {kyc && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>Current status</strong>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-navy">{statusLabel(kyc.status)}</span>
            </div>
            {kyc.submittedAt && <p className="mt-2 text-xs text-slate-500">Submitted {new Date(kyc.submittedAt).toLocaleString()}</p>}
            {kyc.notes && <p className="mt-2 text-sm text-slate-700">Review note: {kyc.notes}</p>}
          </div>
        )}

        {loading && <p className="mt-5 text-sm text-slate-500">Loading your verification status…</p>}
        {error && <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {success && <div role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

        <form onSubmit={submit} className="mt-5" noValidate>
          <label className="block text-sm font-semibold text-slate-700">
            Business or organization name
            <input className={field} maxLength={200} value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="e.g. Nyasa Events Ltd" autoComplete="organization" required />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Registration number <span className="font-normal text-slate-500">(optional)</span>
            <input className={field} maxLength={100} value={registrationNumber} onChange={(event) => setRegistrationNumber(event.target.value)} placeholder="Business registration number" />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Document type
            <select className={field} value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              <option value="NATIONAL_ID">National ID</option>
              <option value="BUSINESS_REGISTRATION">Business registration</option>
              <option value="PASSPORT">Passport</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Verification document URL
            <input className={field} type="url" value={documentUrl} onChange={(event) => setDocumentUrl(event.target.value)} placeholder="https://…" autoComplete="url" required />
          </label>
          <p className="mt-2 text-xs text-slate-500">The current API accepts a document URL; it does not provide a KYC file-upload endpoint. Use a secure link that the review team can access.</p>
          <button type="submit" disabled={saving || loading} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-navy-dark disabled:opacity-60">
            {saving && <RefreshCw size={16} className="animate-spin" />}
            {saving ? 'Submitting…' : kyc ? 'Resubmit verification' : 'Submit for review'}
          </button>
        </form>
      </section>
    </main>
  )
}
