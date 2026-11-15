#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo "════════════════════════════════════════════════════════════"
echo "  REMOVING FAKE localStorage FROM THE FRONTEND"
echo "  (keeping only: auth token, cached user, payment refs, KYC)"
echo "════════════════════════════════════════════════════════════"

echo ""
echo "==> 1. Finding every localStorage read/write in src/"
grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx" || echo "   (none found)"
echo ""

echo "==> 2. Removing fake admin cache from AdminDashboardPage.tsx"
python3 - <<'PY'
import re, sys
path = 'src/features/admin/pages/AdminDashboardPage.tsx'
try:
    src = open(path).read()
except FileNotFoundError:
    print('  (file not found, skipping)')
    sys.exit(0)

# Remove the cache-key constant and any helper that used it
src = re.sub(r"const CACHE_KEY = 'tm_admin_events_cache_v2'\s*\n", "", src)
src = re.sub(r"function loadCache\(\)[\s\S]*?\n\}\s*\n", "", src)
src = re.sub(r"function saveCache\([^)]*\)[\s\S]*?\n\}\s*\n", "", src)

# Remove any line that touches localStorage
src = re.sub(r"^.*localStorage.*\n", "", src, flags=re.MULTILINE)

# Remove references to now-missing functions
src = src.replace("setEvents(loadCache())", "setEvents([])")
src = src.replace("saveCache(merged)", "")
src = src.replace("saveCache(updated)", "")
src = src.replace("saveCache", "")

open(path, 'w').write(src)
print('  ✓ cleaned ' + path)
PY

echo "==> 3. Removing fake staff-assignment cache from StaffManagementPage.tsx"
python3 - <<'PY'
import re, sys
path = 'src/features/organizer/pages/StaffManagementPage.tsx'
try:
    src = open(path).read()
except FileNotFoundError:
    print('  (file not found, skipping)')
    sys.exit(0)

# Remove every localStorage line
src = re.sub(r"^.*localStorage.*\n", "", src, flags=re.MULTILINE)

# Remove leftover comments about the fake sync
src = src.replace("// Sync the FIRST staff member's assignments to local storage\n", "")
src = src.replace("// (So if the organizer refreshes the page, the staff app still knows)\n", "")
src = src.replace("// Write to local storage so the staff member can see their assignments (fallback)\n", "")

open(path, 'w').write(src)
print('  ✓ cleaned ' + path)
PY

echo "==> 4. Removing fake staff-assignment cache from ScannerPage.tsx"
python3 - <<'PY'
import re, sys
path = 'src/features/validation/pages/ScannerPage.tsx'
try:
    src = open(path).read()
except FileNotFoundError:
    print('  (file not found, skipping)')
    sys.exit(0)

# The scanner was trying /staff/me/events, then falling back to
# 'tm_assigned_events' localStorage. Since the backend doesn't have
# /staff/me/events, we need to show an honest message instead of fake data.
new_page = '''import { useCallback, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { TicketValidationResult } from '../../../lib/tickets'
import { ScanResult } from '../components/ScanResult'
import { useQrScanner } from '../hooks/useQrScanner'
import { validateTicket } from '../hooks/useTicketValidator'

export function ScannerPage(): ReactNode {
  const [result, setResult] = useState<TicketValidationResult | null>(null)
  const [history, setHistory] = useState<TicketValidationResult[]>([])
  const [manualCode, setManualCode] = useState('')
  const [eventIdInput, setEventIdInput] = useState('')
  const [checking, setChecking] = useState(false)
  const checkingRef = useRef(false)
  const queryClient = useQueryClient()

  const handleCode = useCallback(
    async (rawCode: string) => {
      if (!eventIdInput.trim()) {
        setResult({
          status: 'invalid',
          title: 'No event selected',
          message: 'Ask your organizer for the event ID, then enter it above.',
        })
        return
      }
      const outcome = await (async (): Promise<TicketValidationResult> => {
        try {
          return await validateTicket(rawCode, eventIdInput.trim())
        } catch (caught) {
          return {
            status: 'invalid',
            title: 'Could not check ticket',
            message: caught instanceof Error ? caught.message : 'The ticket could not be checked.',
          }
        }
      })()
      setResult(outcome)
      setHistory((previous) => [outcome, ...previous].slice(0, 6))
      setManualCode('')
      if (outcome.status === 'valid') {
        queryClient.invalidateQueries({ queryKey: ['event-stats'] })
      }
    },
    [queryClient, eventIdInput],
  )

  const checkCode = useCallback(
    (rawCode: string) => {
      if (checkingRef.current) return
      checkingRef.current = true
      setChecking(true)
      void handleCode(rawCode).finally(() => {
        checkingRef.current = false
        setChecking(false)
      })
    },
    [handleCode],
  )

  const { videoRef, status, error, start, stop } = useQrScanner(checkCode)
  const scanning = status === 'scanning'
  const checkedIn = history.filter((item) => item.status === 'valid').length

  return (
    <div>
      <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
        <b>Backend limitation:</b> Your backend has no <code>/staff/me/events</code> endpoint,
        so the scanner cannot auto-load your assigned events. Ask your organizer for the
        <b> event ID</b> and enter it below before scanning.
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <div>
          <h1>Scan tickets</h1>
          <label className="m" style={{ display: 'block', marginTop: 8 }}>
            Event ID (from your organizer)
            <input
              className="in"
              style={{ marginTop: 4 }}
              value={eventIdInput}
              onChange={(e) => setEventIdInput(e.target.value)}
              placeholder="e.g. 42"
            />
          </label>
        </div>
        <div className="card stat" style={{ minWidth: 160 }}>
          <span className="m">Checked in this session</span>
          <b>{checkedIn}</b>
        </div>
      </div>

      <div className="split" style={{ marginTop: 14 }}>
        <div className="g">
          <div className="cam">
            <video ref={videoRef} playsInline muted className="cam-video" />
            {!scanning && (
              <div className="cam-hint">
                <div className="cam-frame" />
                <p>Point the camera at a ticket QR code.</p>
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 10 }}>
            {scanning ? (
              <button type="button" className="btn o" onClick={stop}>Stop camera</button>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={start}
                disabled={status === 'starting' || checking}
              >
                {status === 'starting' ? 'Starting camera…' : 'Start camera'}
              </button>
            )}
          </div>

          {error && <div className="alert error">{error}</div>}

          <form
            className="row"
            style={{ gap: 8 }}
            onSubmit={(e: FormEvent) => { e.preventDefault(); checkCode(manualCode) }}
          >
            <input
              className="in"
              style={{ margin: 0 }}
              placeholder="Paste or scan ticket QR token"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button type="submit" className="btn" disabled={!manualCode.trim() || checking}>
              {checking ? 'Checking…' : 'Validate'}
            </button>
          </form>
        </div>

        <div>
          {result ? <ScanResult result={result} /> : (
            <div className="alert info">Scan or enter a ticket to see the result.</div>
          )}
          <h4>Other results</h4>
          {history.length === 0 ? (
            <p className="m">No scans yet.</p>
          ) : (
            history.map((item, index) => (
              <ScanResult key={`${item.status}-${index}`} result={item} compact />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
'''
open(path, 'w').write(new_page)
print('  ✓ rewrote ' + path + ' (honest: manual event ID, no fake cache)')
PY

echo "==> 5. Verifying no fake localStorage remains"
echo ""
echo "   Searching for the keys we removed:"
for key in tm_admin_events_cache_v2 tm_admin_all_events_cache tm_admin_cancelled tm_admin_restored tm_assigned_events; do
  hits=$(grep -rn "$key" src/ 2>/dev/null | wc -l)
  if [ "$hits" -gt 0 ]; then
    echo "   ❌ $key still used in $hits place(s)"
    grep -rn "$key" src/ 2>/dev/null | sed 's/^/      /'
  else
    echo "   ✓ $key — removed"
  fi
done

echo ""
echo "   Remaining localStorage keys (all legitimate):"
grep -rn "localStorage" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "test\.\|\.test\." \
  | sed 's/^/   /' || echo "   (none)"

echo ""
echo "==> Type-checking"
npx tsc -p tsconfig.app.json --noEmit 2>&1 | head -20 || true

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  DONE."
echo ""
echo "  Removed from localStorage (were fake data):"
echo "    ❌ tm_admin_events_cache_v2"
echo "    ❌ tm_admin_all_events_cache"
echo "    ❌ tm_admin_cancelled"
echo "    ❌ tm_admin_restored"
echo "    ❌ tm_assigned_events"
echo ""
echo "  Kept (real, needed):"
echo "    ✓ tm_token                  (JWT — you stay logged in)"
echo "    ✓ tm_user                   (cached profile for fast reload)"
echo "    ✓ tm.ticket-master.kyc      (organizer KYC copy for route guards)"
echo "    ✓ tm.ticket-master.pending-payments  (PayChangu return matching)"
echo ""
echo "  NEXT STEPS:"
echo "    1. Ctrl+C → npm run dev"
echo "    2. In browser DevTools → Application → Clear site data"
echo "    3. Ctrl+Shift+R"
echo "    4. Log in again (token was cleared)"
echo ""
echo "  The staff scanner now shows an honest message asking for"
echo "  the Event ID manually — no more fake \"assigned events\""
echo "  that don't exist on the backend."
echo "════════════════════════════════════════════════════════════"
