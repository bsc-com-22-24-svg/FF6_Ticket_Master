import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAdminAuditLogs } from '../hooks/useAdmin'

function formatDetails(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return '—'
  }
}

export function AuditLogTab() {
  const [limit, setLimit] = useState(100)
  const { logs, loading, error, refetch } = useAdminAuditLogs(limit)

  return (
    <div className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
        <select
          value={limit}
          onChange={(event) => setLimit(Number(event.target.value))}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          aria-label="Audit log limit"
        >
          <option value={25}>Latest 25</option>
          <option value={100}>Latest 100</option>
          <option value={500}>Latest 500</option>
        </select>
        <button
          onClick={() => void refetch()}
          disabled={loading}
          className="rounded-full border border-slate-200 p-2 hover:bg-slate-50"
          aria-label="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && !loading && logs.length === 0 && <p className="text-slate-500">No audit entries yet.</p>}
      {logs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((row) => (
                <tr key={row.auditId} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {row.actorName || row.actorEmail || 'System'}
                    {row.actorEmail && row.actorName ? ` (${row.actorEmail})` : ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{row.action}</td>
                  <td className="px-4 py-3">{row.entityType || '—'}{row.entityId ? ` #${row.entityId}` : ''}</td>
                  <td className="px-4 py-3 font-mono text-xs">{formatDetails(row.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
