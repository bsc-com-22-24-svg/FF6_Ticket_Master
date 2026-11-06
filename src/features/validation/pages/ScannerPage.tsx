import { useCallback, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listTickets, type TicketValidationResult } from '../../../lib/tickets'
import { USE_BACKEND } from '../../../lib/backend'
import { useEvents } from '../../events/hooks/useEvents'
import { listEvents } from '../../../lib/events'
import { ScanResult } from '../components/ScanResult'
import { SCAN_EVENT } from '../mockData'
import { useAuth } from '../../authentication'
import { staffEventIds } from '../../authentication/authStore'
import { useQrScanner } from '../hooks/useQrScanner'
import { validateTicket } from '../hooks/useTicketValidator'

export function ScannerPage(): ReactNode {
  const [result, setResult] = useState<TicketValidationResult | null>(null)
  const [history, setHistory] = useState<TicketValidationResult[]>([])
  const [manualCode, setManualCode] = useState('')
  const [checking, setChecking] = useState(false)
  const checkingRef = useRef(false)
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { data: backendEvents = [], isLoading: loadingEvents } = useEvents()
  // With the backend, the server authorises the scan. Without it, staff can only
  // scan the events their organizer assigned to them in the browser.
  const assigned = user ? staffEventIds(user.id) : []
  const events = USE_BACKEND ? backendEvents : listEvents().filter((e) => assigned.includes(e.id))
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id ?? '')
  const selectedEvent = events.find((e) => e.id === selectedEventId) ?? events[0]
  const activeEventId = selectedEvent?.id ?? ''

  const handleCode = useCallback(
    async (rawCode: string) => {
      const outcome = await (async (): Promise<TicketValidationResult> => {
        if (!activeEventId) {
          return {
            status: 'invalid',
            title: 'No event selected',
            message: 'Choose the event you are checking tickets for.',
          }
        }
        try {
          return await validateTicket(rawCode, activeEventId)
        } catch (caught) {
          return {
            status: 'invalid',
            title: 'Could not check ticket',
            message: caught instanceof Error ? caught.message : 'The ticket could not be checked. Try again.',
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
    [queryClient, activeEventId],
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

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    checkCode(manualCode)
  }

  const checkedIn = USE_BACKEND
    ? history.filter((item) => item.status === 'valid').length
    : listTickets().filter(
        (ticket) => ticket.eventId === activeEventId && ticket.status === 'used',
      ).length

  const scanning = status === 'scanning'

  if (!selectedEvent && loadingEvents) {
    return (
      <div>
        <h1>Scan tickets</h1>
        <div className="alert info" style={{ marginTop: 14 }}>Loading events…</div>
      </div>
    )
  }

  if (!selectedEvent) {
    return (
      <div>
        <h1>Scan tickets</h1>
        <div className="alert info" style={{ marginTop: 14 }}>
          No events are assigned to you yet. Ask your organizer to assign you to an event.
        </div>
      </div>
    )
  }

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
              value={selectedEvent.id}
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
          <span className="m">{USE_BACKEND ? 'Checked in this session' : `Checked in · ${selectedEvent.title}`}</span>
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
                disabled={status === 'starting' || checking}
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
              placeholder={USE_BACKEND ? 'Paste or scan the ticket QR token' : 'Enter ticket ID, e.g. TM-2026-K7QX4ZP9R2WM'}
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
            />
            <button type="submit" className="btn" disabled={!manualCode.trim() || checking}>
              {checking ? 'Checking…' : 'Validate'}
            </button>
          </form>

          <div className="alert info">
            {USE_BACKEND ? (
              <>
                <b>Server-checked tickets</b>
                <p className="m">The backend records each scan, so a ticket is accepted only once.</p>
              </>
            ) : (
              <>
                <b>Demo tickets for this event</b>
                <p className="m">1. TM-2026-K7QX4ZP9R2WM — valid (accepts once)</p>
                <p className="m">2. TM-2026-W9FJ2MXA4LEU — already used</p>
                <p className="m">3. TM-2026-H3VN8DC5T6YB — wrong event</p>
                <p className="m">4. TM-2026-K7QX4ZP9R2WM.AAAAAAAAAA — tampered (wrong security tag)</p>
                <p className="m">Any other code — invalid</p>
              </>
            )}
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
