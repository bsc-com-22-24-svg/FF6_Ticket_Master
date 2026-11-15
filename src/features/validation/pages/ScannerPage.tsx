import { useCallback, useRef, useState } from 'react'
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
