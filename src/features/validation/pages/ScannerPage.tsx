import { useCallback, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listTickets, type TicketValidationResult } from '../../../lib/tickets'
import { listEvents } from '../../../lib/events'
import { ScanResult } from '../components/ScanResult'
import { SCAN_EVENT } from '../mockData'
import { useQrScanner } from '../hooks/useQrScanner'
import { validateTicket } from '../hooks/useTicketValidator'

export function ScannerPage(): ReactNode {
  const [result, setResult] = useState<TicketValidationResult | null>(null)
  const [history, setHistory] = useState<TicketValidationResult[]>([])
  const [manualCode, setManualCode] = useState('')
  const queryClient = useQueryClient()
  const events = listEvents()
  const [selectedEventId, setSelectedEventId] = useState(SCAN_EVENT.id)
  const selectedEvent =
    events.find((e) => e.id === selectedEventId) ?? { id: SCAN_EVENT.id, title: SCAN_EVENT.name }

  const handleCode = useCallback(
    (rawCode: string) => {
      const outcome = validateTicket(rawCode, selectedEventId)
      setResult(outcome)
      setHistory((previous) => [outcome, ...previous].slice(0, 6))
      setManualCode('')
      if (outcome.status === 'valid') {
        queryClient.invalidateQueries({ queryKey: ['event-stats'] })
      }
    },
    [queryClient, selectedEventId],
  )

  const { videoRef, status, error, start, stop } = useQrScanner(handleCode)

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    handleCode(manualCode)
  }

  const checkedIn = listTickets().filter(
    (ticket) => ticket.eventId === selectedEventId && ticket.status === 'used',
  ).length

  const scanning = status === 'scanning'

  return (
    <div>
      <div className="row">
        <div>
          <h1>Scan tickets</h1>
          <p className="m">{SCAN_EVENT.gate}</p>
          <label className="m" style={{ display: 'block', marginTop: 8 }}>
            Event gate
            <select
              className="in"
              style={{ marginTop: 4 }}
              value={selectedEventId}
              onChange={(event) => {
                setSelectedEventId(event.target.value)
                setResult(null)
                setHistory([])
              }}
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="card stat" style={{ minWidth: 160 }}>
          <span className="m">Checked in · {selectedEvent.title}</span>
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
                <p>Point the camera at a ticket QR code to validate it.</p>
              </div>
            )}
          </div>

          <div className="row" style={{ gap: 10 }}>
            {scanning ? (
              <button type="button" className="btn o" onClick={stop}>
                Stop camera
              </button>
            ) : (
              <button
                type="button"
                className="btn"
                onClick={start}
                disabled={status === 'starting'}
              >
                {status === 'starting' ? 'Starting camera…' : 'Start camera'}
              </button>
            )}
          </div>

          {error && <div className="alert error">{error}</div>}

          <form className="row" style={{ gap: 8 }} onSubmit={handleManualSubmit}>
            <input
              className="in"
              style={{ margin: 0 }}
              placeholder="Enter ticket ID, e.g. TM-2026-004871"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
            />
            <button type="submit" className="btn" disabled={!manualCode.trim()}>
              Validate
            </button>
          </form>

          <div className="alert info">
            <b>Demo tickets for this event</b>
            <p className="m">1. TM-2026-004871 — valid (accepts once)</p>
            <p className="m">2. TM-2026-002540 — already used</p>
            <p className="m">3. TM-2026-009999 — wrong event</p>
            <p className="m">Any other code — invalid</p>
          </div>
        </div>

        <div>
          {result ? (
            <ScanResult result={result} />
          ) : (
            <div className="alert info">Scan or enter a ticket to see the validation result.</div>
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
