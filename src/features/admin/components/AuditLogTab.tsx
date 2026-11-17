import { useCallback, useEffect, useMemo, useState } from 'react'
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
}

function parseEntries(value: unknown): AuditEntry[] {
  const rows = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? ['data', 'logs', 'items'].map((key) => (value as Record<string, unknown>)[key]).find(Array.isArray) ?? []
      : []
  return (rows as unknown[]).flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const row = item as Record<string, unknown>
    return [{
      id: String(row.id ?? index),
      createdAt: String(row.createdAt ?? row.timestamp ?? ''),
      actorName: typeof row.actorName === 'string' ? row.actorName : null,
      actorRole: typeof row.actorRole === 'string' ? row.actorRole : null,
      action: String(row.action ?? ''),
      entityType: typeof row.entityType === 'string' ? row.entityType : null,
      entityId: row.entityId === undefined || row.entityId === null ? null : String(row.entityId),
      outcome: String(row.outcome ?? 'SUCCESS').toUpperCase(),
    }]
  })
}

// The Swagger contract exposes limit for GET /admin/audit-logs.
export function AuditLogTab() {
  const [outcome, setOutcome] = useState('')
  const [rows, setRows] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(parseEntries(await api<unknown>('/admin/audit-logs?limit=100')))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load the audit trail')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])
  const visibleRows = useMemo(() => outcome ? rows.filter((row) => row.outcome === outcome) : rows, [outcome, rows])

  return (
    <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-navy-dark">Audit trail</h2>
          <p className="mt-1 text-sm text-slate-600">Latest platform activity recorded by the backend.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={outcome} onChange={(event) => setOutcome(event.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm" aria-label="Filter by outcome">
            <option value="">All outcomes</option><option value="SUCCESS">Success</option><option value="FAILURE">Failure</option>
          </select>
          <button onClick={() => void load()} disabled={loading} className="rounded-full border border-slate-200 p-2 hover:bg-slate-50 disabled:opacity-50" aria-label="Refresh audit log">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {loading && <p className="text-slate-500">Loading audit entries…</p>}
      {!loading && !error && visibleRows.length === 0 && <p className="text-slate-500">No audit entries found.</p>}
      {!error && visibleRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Who</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Outcome</th></tr></thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3">{row.createdAt ? new Date(row.createdAt).toLocaleString() : '—'}</td>
                  <td className="px-4 py-3">{row.actorName ?? 'System'}{row.actorRole ? ` (${row.actorRole})` : ''}</td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action || '—'}</td>
                  <td className="px-4 py-3">{row.entityType ?? '—'}{row.entityId ? ` #${row.entityId}` : ''}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.outcome === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{row.outcome}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
