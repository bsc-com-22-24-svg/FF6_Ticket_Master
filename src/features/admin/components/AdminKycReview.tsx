import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Modal } from '../../../components/ui/Modal'
import type { AdminKycEntry } from '../../../lib/backendAdmin'
import { useAdminKyc } from '../hooks/useAdmin'
import { useToast } from '../../toast'

function formatDate(value?: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

export function AdminKycReview() {
  const { showToast } = useToast()
  const { submissions, loading, error, refetch, review, reviewing } = useAdminKyc()
  const [selected, setSelected] = useState<AdminKycEntry | null>(null)
  const [approved, setApproved] = useState(true)
  const [notes, setNotes] = useState('')

  function openReview(entry: AdminKycEntry, decision: boolean) {
    setSelected(entry)
    setApproved(decision)
    setNotes('')
  }

  async function submitReview() {
    if (!selected) return
    try {
      await review({
        organizerId: selected.organizerId,
        input: { approved, ...(notes.trim() ? { notes: notes.trim() } : {}) },
      })
      showToast(approved ? 'Organizer verified' : 'Organizer rejected', 'success')
      setSelected(null)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not review this submission', 'error')
    }
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-end gap-3">
        <button
          onClick={() => void refetch()}
          disabled={loading}
          className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50"
          aria-label="Refresh KYC submissions"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && !loading && submissions.length === 0 && <p className="text-slate-500">No KYC submissions yet.</p>}

      {submissions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Organizer</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((entry) => (
                <tr key={entry.kycId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-navy-dark">{entry.organizerName || 'Organizer'}</div>
                    <div className="text-xs text-slate-500">{entry.organizerEmail || ''}</div>
                  </td>
                  <td className="px-4 py-3">{entry.businessName}</td>
                  <td className="px-4 py-3">
                    <div>{entry.documentType}</div>
                    <a href={entry.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-navy underline">View document</a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      entry.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                      entry.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(entry.submittedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openReview(entry, true)}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openReview(entry, false)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title={`${approved ? 'Approve' : 'Reject'} organizer verification`}
      >
        {selected && (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submitReview()
            }}
          >
            <p className="text-sm text-slate-600">
              {selected.businessName} ({selected.organizerEmail || selected.organizerName || 'organizer'})
            </p>
            <label className="mt-4 block text-sm font-semibold text-slate-700">
              Review notes
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder={approved ? 'Optional note for the organizer' : 'Reason for rejection'}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reviewing}
                className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  approved ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewing ? 'Saving...' : approved ? 'Approve' : 'Reject'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
