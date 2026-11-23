import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { api } from '../../../lib/backend'

interface AuditEntry {
  id: string
  createdAt: string
  actorName: string | null
  actorRole: string | null
  action: string
  entityType: string | null
  entityId: string | null
  outcome: 'SUCCESS' | 'FAILURE' | string
  statusCode?: number
}

interface AuditPage {
  data: AuditEntry[]
  meta?: { page: number; totalPages: number }
}

// The platform audit trail, read from GET /admin/audit-logs (administrators only).
export function AuditLogTab() {
  const [page, setPage] = useState(1)
  const [outcome, setOutcome] = useState('')
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const query = `page=${page}&limit=25${outcome ? `&outcome=${outcome}` : ''}`
      const res = await api<AuditPage>(`/admin/audit-logs?${query}`)
      setRows(res.data ?? [])
      setTotalPages(res.meta?.totalPages ?? 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the audit trail')
    } finally {
      setLoading(false)
    }
  }, [page, outcome])

  useEffect(() => { void load() }, [load])

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <div className="flex items-center gap-2">
          <select
            value={outcome}
            onChange={(e) => { setPage(1); setOutcome(e.target.value) }}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            aria-label="Filter by outcome"
          >
            <option value="">All outcomes</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILURE">Failure</option>
          </select>
          <button onClick={() => void load()} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50" aria-label="Refresh">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && !loading && rows.length === 0 && <p className="text-slate-500">No audit entries yet.</p>}
      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Outcome</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{row.actorName ?? 'System'}{row.actorRole ? ` (${row.actorRole})` : ''}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3">{row.entityType ?? '—'}{row.entityId ? ` #${row.entityId}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.outcome === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {row.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Previous</button>
        <span className="text-slate-500">Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">Next</button>
      </div>
    </div>
  )
}
