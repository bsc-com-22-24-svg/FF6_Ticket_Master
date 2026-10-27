// Browser side of the PayChangu integration. It never sees the secret key: it calls our
// own /api/paychangu/* routes (server/paychangu.ts), and remembers what the customer was
// buying until PayChangu sends them back.

export interface PendingPayment {
  txRef: string
  eventId: string
  ticketTypeId: string
  quantity: number
  holder: string
  userId: string
  amount: number // total in MWK, what we expect PayChangu to confirm
  createdAt: string
  status: 'pending' | 'completed'
  ticketIds?: string[]
}

export interface VerifiedPayment {
  status: string // 'success' | 'pending' | 'failed' | ...
  tx_ref: string
  amount: number
  currency: string
  channel: string | null
  reference: string | null
}

export interface InitiateInput {
  amount: number
  email: string
  first_name: string
  last_name: string
  tx_ref: string
  callback_url: string
  return_url: string
  title: string
  description: string
}

export const PENDING_PAYMENTS_KEY = 'tm.ticket-master.pending-payments'

function readPending(): PendingPayment[] {
  try {
    const raw = window.localStorage.getItem(PENDING_PAYMENTS_KEY)
    const parsed = raw ? (JSON.parse(raw) as PendingPayment[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writePending(items: PendingPayment[]): void {
  try {
    window.localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(items.slice(0, 50)))
  } catch {
    // storage unavailable: the payment page will show a "could not find your order" message
  }
}

export function savePendingPayment(payment: PendingPayment): void {
  writePending([payment, ...readPending().filter((item) => item.txRef !== payment.txRef)])
}

export function getPendingPayment(txRef: string): PendingPayment | undefined {
  return readPending().find((item) => item.txRef === txRef)
}

export function latestPendingPayment(): PendingPayment | undefined {
  return readPending().find((item) => item.status === 'pending')
}

export function removePendingPayment(txRef: string): void {
  writePending(readPending().filter((item) => item.txRef !== txRef))
}

export function markPaymentCompleted(txRef: string, ticketIds: string[]): void {
  writePending(
    readPending().map((item) => (item.txRef === txRef ? { ...item, status: 'completed', ticketIds } : item)),
  )
}

export function makeTxRef(): string {
  const random = Math.random().toString(36).slice(2, 10)
  return `TM-${Date.now().toString(36)}-${random}`.toUpperCase()
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, init)
  } catch {
    throw new Error('Could not reach the payment service. Check your connection and try again.')
  }
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : 'Payment service error.'
    throw new Error(message)
  }
  return body as T
}

export function initiatePayment(input: InitiateInput): Promise<{ checkout_url: string; tx_ref: string }> {
  return api('/api/paychangu/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export function verifyPayment(txRef: string): Promise<VerifiedPayment> {
  return api(`/api/paychangu/verify/${encodeURIComponent(txRef)}`)
}
