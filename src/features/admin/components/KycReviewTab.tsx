import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { listAdminKyc, reviewAdminKyc, type AdminKycSubmission } from '../../../lib/backendKyc'
import { useToast } from '../../toast'

function dateLabel(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function KycReviewTab() {
  const { showToast } = useToast()
  const [rows, setRows] = useState<AdminKycSubmission[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await listAdminKyc())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load KYC submissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function review(row: AdminKycSubmission, approved: boolean) {
    setBusyId(row.organizerId)
    try {
      await reviewAdminKyc(row.organizerId, approved, notes[row.organizerId] ?? '')
      showToast(approved ? 'Organizer verification approved' : 'Organizer verification rejected', 'success')
      await load()
    } catch (caught) {
      showToast(caught instanceof Error ? caught.message : 'Could not review this submission.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  const pending = rows.filter((row) => row.status === 'PENDING')

  return (
    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy-dark">Organizer verification</h2>
          <p className="mt-1 text-sm text-slate-600">Review submitted business details and supporting documents.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} aria-label="Refresh KYC submissions" className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading ? <p className="text-sm text-slate-500">Loading submissions…</p> : !error && rows.length === 0 ? (
        <p className="text-sm text-slate-500">No verification submissions yet.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-500">{pending.length} pending · {rows.length} total</p>
          {rows.map((row) => (
            <article key={row.organizerId} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-navy-dark">{row.businessName || 'Business name not provided'}</h3>
                  <p className="mt-1 text-sm text-slate-600">{row.organizerName}{row.organizerEmail ? ` · ${row.organizerEmail}` : ''}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{row.status}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-slate-500">Registration number</dt><dd>{row.registrationNumber || '—'}</dd></div>
                <div><dt className="text-slate-500">Document type</dt><dd>{row.documentType || '—'}</dd></div>
                <div><dt className="text-slate-500">Submitted</dt><dd>{dateLabel(row.submittedAt)}</dd></div>
                <div><dt className="text-slate-500">Organizer ID</dt><dd>{row.organizerId}</dd></div>
              </dl>
              {row.documentUrl && (
                <a href={row.documentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-blue-700 underline">
                  Open verification document
                </a>
              )}
              {row.status === 'PENDING' && (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    aria-label={`Review notes for ${row.businessName}`}
                    className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    value={notes[row.organizerId] ?? ''}
                    onChange={(event) => setNotes((previous) => ({ ...previous, [row.organizerId]: event.target.value }))}
                    placeholder="Optional review note"
                  />
                  <button disabled={busyId === row.organizerId} onClick={() => void review(row, false)} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    {busyId === row.organizerId ? 'Saving…' : 'Reject'}
                  </button>
                  <button disabled={busyId === row.organizerId} onClick={() => void review(row, true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                    {busyId === row.organizerId ? 'Saving…' : 'Approve'}
                  </button>
                </div>
              )}
              {row.notes && row.status !== 'PENDING' && <p className="mt-3 text-sm text-slate-600">Review note: {row.notes}</p>}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
