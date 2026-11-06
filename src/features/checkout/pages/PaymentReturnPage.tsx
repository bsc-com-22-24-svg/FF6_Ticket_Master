import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { latestPendingPayment } from '../../../lib/paychangu'
import { completePayment, type CompletionResult } from '../completePayment'
import { TicketConfirmation } from '../components/TicketConfirmation'

const RETRY_EVERY_MS = 3000
const MAX_ATTEMPTS = 10

// PayChangu sends the customer here after paying (or giving up). We never trust the URL:
// we ask PayChangu (through our server) whether the payment really succeeded.
export function PaymentReturnPage(): ReactNode {
  const search = useSearch({ strict: false }) as { tx_ref?: unknown; status?: unknown }
  const txRef = search.tx_ref !== undefined ? String(search.tx_ref) : latestPendingPayment()?.txRef
  const returnedStatus = typeof search.status === 'string' ? search.status.toLowerCase() : ''

  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [result, setResult] = useState<CompletionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!txRef) return
    let active = true
    let timer: number | undefined

    completePayment(txRef)
      .then((outcome) => {
        if (!active) return
        setError(null)
        setResult(outcome)
        if (outcome.kind === 'success') {
          for (const key of ['events', 'checkout-event', 'tickets', 'bookings']) {
            queryClient.invalidateQueries({ queryKey: [key] })
          }
        }
        if (outcome.kind === 'pending' && attempt < MAX_ATTEMPTS) {
          timer = window.setTimeout(() => setAttempt((n) => n + 1), RETRY_EVERY_MS)
        }
      })
      .catch((caught: unknown) => {
        if (!active) return
        setError(caught instanceof Error ? caught.message : 'Could not confirm the payment.')
      })

    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
    }
  }, [txRef, attempt, queryClient])

  if (!txRef || result?.kind === 'unknown') {
    return (
      <Notice title="We couldn't find your order">
        <p className="m">
          This payment was not started from this browser, so we can't match it to an order. If money left your
          account, contact support with your PayChangu receipt.
        </p>
        <Link to="/events" className="btn">Browse events</Link>
      </Notice>
    )
  }

  if (result?.kind === 'success') {
    return <TicketConfirmation tickets={result.tickets} onBuyAgain={() => navigate({ to: '/events' })} />
  }

  if (result?.kind === 'failed' || (returnedStatus === 'failed' && !result)) {
    const failed = result?.kind === 'failed' ? result : null
    return (
      <Notice title="Payment not completed">
        <div className="alert error">
          {failed?.message ?? 'The payment was cancelled or failed. No ticket was issued.'}
        </div>
        {failed?.eventId ? (
          <Link to="/checkout/$eventId" params={{ eventId: failed.eventId }} className="btn">Try again</Link>
        ) : (
          <Link to="/events" className="btn">Browse events</Link>
        )}
      </Notice>
    )
  }

  if (error) {
    return (
      <Notice title="We couldn't confirm your payment yet">
        <div className="alert error">{error}</div>
        <button type="button" className="btn" onClick={() => setAttempt((n) => n + 1)}>
          Check again
        </button>
      </Notice>
    )
  }

  const waitedTooLong = result?.kind === 'pending' && attempt >= MAX_ATTEMPTS
  return (
    <Notice title={waitedTooLong ? 'Still waiting for confirmation' : 'Confirming your payment…'}>
      <p className="m">
        {waitedTooLong
          ? 'PayChangu has not confirmed the payment yet. If you approved it on your phone, check again in a moment.'
          : 'Please wait while we confirm the payment with PayChangu. Do not close this page.'}
      </p>
      {waitedTooLong && (
        <button type="button" className="btn" onClick={() => setAttempt(0)}>
          Check again
        </button>
      )}
    </Notice>
  )
}

function Notice({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center sm:px-6">
      <div className="card" style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  )
}
