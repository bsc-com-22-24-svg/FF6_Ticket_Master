import { api } from './backend'

export interface PendingPayment {
  txRef: string
  orderNumber: string
  eventId: string
  ticketTypeId: string
  quantity: number
  holder: string
  userId: string
  createdAt: string
  status: 'pending' | 'completed'
  ticketIds?: string[]
}

export interface VerifiedPayment {
  status: 'success' | 'pending' | 'failed'
  tx_ref: string
}

interface CreateOrderInput {
  eventId: string
  ticketTypeId: string
  quantity: number
}

export const PENDING_PAYMENTS_KEY = 'tm.ticket-master.pending-payments'

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function findOrderNumber(value: unknown, depth = 0): string | undefined {
  if (!isRecord(value) || depth > 3) return undefined

  for (const key of ['orderNumber', 'order_number', 'number']) {
    const candidate = value[key]
    if ((typeof candidate === 'string' || typeof candidate === 'number') && String(candidate).trim()) {
      return String(candidate).trim()
    }
  }

  for (const key of ['data', 'order', 'result']) {
    const nested = findOrderNumber(value[key], depth + 1)
    if (nested) return nested
  }
  return undefined
}

function readPending(): PendingPayment[] {
  const raw = window.localStorage.getItem(PENDING_PAYMENTS_KEY)
  if (!raw) return []

  const parsed: unknown = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('Saved payment references are invalid. Clear them and try again.')
  return parsed as PendingPayment[]
}

function writePending(items: PendingPayment[]): void {
  window.localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(items.slice(0, 50)))
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

export function markPaymentCompleted(txRef: string, ticketIds: string[]): void {
  writePending(
    readPending().map((item) => (item.txRef === txRef ? { ...item, status: 'completed', ticketIds } : item)),
  )
}

export function addPendingTickets(txRef: string, ticketIds: string[]): void {
  if (ticketIds.length === 0) return
  writePending(
    readPending().map((item) =>
      item.txRef === txRef
        ? { ...item, ticketIds: Array.from(new Set([...(item.ticketIds ?? []), ...ticketIds])) }
        : item,
    ),
  )
}

export async function createOrder(input: CreateOrderInput): Promise<{ orderNumber: string }> {
  const result = await api<unknown>('/orders', {
    method: 'POST',
    body: {
      eventId: input.eventId,
      items: [{ ticketTypeId: input.ticketTypeId, quantity: input.quantity }],
    },
  })

  const orderNumber = findOrderNumber(result)
  if (!orderNumber) {
    throw new Error('The backend did not return an order number.')
  }
  return { orderNumber }
}

export async function initiatePayment(orderNumber: string): Promise<{ checkout_url: string; tx_ref: string }> {
  const result = await api<unknown>(
    `/payments/orders/${encodeURIComponent(orderNumber)}/checkout`,
    { method: 'POST' },
  )
  const dataObj = isRecord(result) && isRecord(result.data) ? result.data : result;
  const checkoutUrl = isRecord(dataObj) ? (dataObj.checkout_url || dataObj.checkoutUrl) : undefined;
  const txRef = isRecord(dataObj) ? (dataObj.tx_ref || dataObj.txRef) : undefined;

  if (typeof checkoutUrl !== 'string' || typeof txRef !== 'string' || !txRef.trim()) {
    throw new Error('The backend did not return a PayChangu checkout URL and transaction reference.')
  }
  let url: URL
  try {
    url = new URL(checkoutUrl)
  } catch {
    throw new Error('The backend returned an invalid PayChangu checkout URL.')
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('The backend returned an unsupported PayChangu checkout URL.')
  }
  return { checkout_url: url.toString(), tx_ref: txRef }
}

export async function verifyPayment(txRef: string): Promise<VerifiedPayment> {
  const result = await api<unknown>(`/payments/${encodeURIComponent(txRef)}/verify`)
  if (!isRecord(result) || typeof result.status !== 'string') {
    throw new Error('The backend returned an invalid payment verification response.')
  }

  const status = result.status.toLowerCase()
  const mappedStatus =
    ['success', 'successful', 'paid', 'completed'].includes(status)
      ? 'success'
      : ['pending', 'processing', 'initiated'].includes(status)
        ? 'pending'
        : 'failed'

  const responseTxRef =
    typeof result.tx_ref === 'string'
      ? result.tx_ref
      : typeof result.txRef === 'string'
        ? result.txRef
        : txRef
  return { status: mappedStatus, tx_ref: responseTxRef }
}
