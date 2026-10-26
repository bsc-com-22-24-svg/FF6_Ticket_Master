// PayChangu server side. Runs inside the Vite dev/preview server, so `npm run dev`
// is all you need. The SECRET key lives here (read from .env) and is never sent to
// the browser. The browser only talks to our two /api/paychangu/* routes.
//
//   POST /api/paychangu/initiate      -> creates a PayChangu checkout, returns its URL
//   GET  /api/paychangu/verify/:ref   -> asks PayChangu if that payment really succeeded
//
// For a real deployment this file's logic must run on your own backend.
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Connect, Plugin } from 'vite'

type Env = Record<string, string | undefined>

const DEFAULT_API = 'https://api.paychangu.com'
const TX_REF = /^[A-Za-z0-9-]{8,64}$/
const EMAIL = /^\S+@\S+\.\S+$/
const MAX_BODY = 10_000
const MAX_AMOUNT = 50_000_000

function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf8')
      if (raw.length > MAX_BODY) {
        reject(new Error('Request too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch {
        reject(new Error('Invalid JSON'))
      }
    })
    req.on('error', reject)
  })
}

function text(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

// Redirect URLs must point back at this same site (stops the endpoint being used to
// send customers somewhere else).
function sameSite(url: unknown, host: string | undefined): url is string {
  if (typeof url !== 'string' || !host) return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.host === host
  } catch {
    return false
  }
}

function messageFrom(body: unknown): string {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message
    if (typeof message === 'string') return message.slice(0, 200)
    if (message && typeof message === 'object') return JSON.stringify(message).slice(0, 200)
  }
  return 'PayChangu returned an error.'
}

async function callPayChangu(env: Env, path: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  const base = (env.PAYCHANGU_API_URL || DEFAULT_API).replace(/\/$/, '')
  const response = await fetch(base + path, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${env.PAYCHANGU_SECRET_KEY}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    signal: AbortSignal.timeout(15_000),
  })
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
    body = null
  }
  return { status: response.status, body }
}

async function initiate(env: Env, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const input = (await readBody(req)) as Record<string, unknown>

  const amount = input.amount
  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
    return send(res, 400, { error: 'Invalid amount.' })
  }
  const email = text(input.email, 120)
  if (!EMAIL.test(email)) return send(res, 400, { error: 'A valid email address is required.' })
  const txRef = text(input.tx_ref, 64)
  if (!TX_REF.test(txRef)) return send(res, 400, { error: 'Invalid transaction reference.' })
  if (!sameSite(input.callback_url, req.headers.host) || !sameSite(input.return_url, req.headers.host)) {
    return send(res, 400, { error: 'Invalid redirect URL.' })
  }

  const payload = {
    amount: String(amount),
    currency: 'MWK',
    email,
    first_name: text(input.first_name, 60) || 'Customer',
    last_name: text(input.last_name, 60) || '-',
    callback_url: input.callback_url,
    return_url: input.return_url,
    tx_ref: txRef,
    customization: {
      title: text(input.title, 60) || 'Ticket Master',
      description: text(input.description, 120) || 'Event tickets',
    },
  }

  const { status, body } = await callPayChangu(env, '/payment', { method: 'POST', body: JSON.stringify(payload) })
  const checkoutUrl =
    body && typeof body === 'object' && 'data' in body
      ? ((body as { data?: { checkout_url?: unknown } }).data?.checkout_url ?? null)
      : null

  if (status >= 200 && status < 300 && typeof checkoutUrl === 'string' && /^https?:\/\//.test(checkoutUrl)) {
    return send(res, 200, { checkout_url: checkoutUrl, tx_ref: txRef })
  }
  return send(res, 502, { error: 'PayChangu could not start the payment.', detail: messageFrom(body) })
}

async function verify(env: Env, txRef: string, res: ServerResponse): Promise<void> {
  if (!TX_REF.test(txRef)) return send(res, 400, { error: 'Invalid transaction reference.' })

  const { status, body } = await callPayChangu(env, `/verify-payment/${encodeURIComponent(txRef)}`, { method: 'GET' })
  const data =
    body && typeof body === 'object' && 'data' in body ? (body as { data?: Record<string, unknown> }).data : undefined

  if (status === 404) return send(res, 404, { error: 'No such payment.' })
  if (status < 200 || status >= 300 || !data) {
    return send(res, 502, { error: 'PayChangu could not verify the payment.', detail: messageFrom(body) })
  }

  const authorization = data.authorization as { channel?: unknown } | null | undefined
  return send(res, 200, {
    status: typeof data.status === 'string' ? data.status.toLowerCase() : 'unknown',
    tx_ref: typeof data.tx_ref === 'string' ? data.tx_ref : txRef,
    amount: typeof data.amount === 'number' ? data.amount : Number(data.amount),
    currency: typeof data.currency === 'string' ? data.currency : '',
    channel: typeof authorization?.channel === 'string' ? authorization.channel : null,
    reference: typeof data.reference === 'string' ? data.reference : null,
  })
}

export function createPaychanguHandler(env: Env): Connect.NextHandleFunction {
  return (req, res, next) => {
    const url = req.url ?? ''
    if (!url.startsWith('/api/paychangu/')) return next()

    if (!env.PAYCHANGU_SECRET_KEY) {
      return send(res, 500, {
        error: 'PayChangu is not configured. Add PAYCHANGU_SECRET_KEY to the .env file and restart npm run dev.',
      })
    }

    const path = url.split('?')[0]
    const run = async () => {
      if (req.method === 'POST' && path === '/api/paychangu/initiate') return initiate(env, req, res)
      if (req.method === 'GET' && path.startsWith('/api/paychangu/verify/')) {
        return verify(env, decodeURIComponent(path.slice('/api/paychangu/verify/'.length)), res)
      }
      return send(res, 404, { error: 'Not found.' })
    }

    run().catch((error: unknown) => {
      const reason = error instanceof Error ? error.message : 'Unexpected error'
      // never include the secret key or raw upstream details
      send(res, 500, { error: 'Payment service error.', detail: reason.slice(0, 100) })
    })
  }
}

export function paychanguApi(env: Env): Plugin {
  const handler = createPaychanguHandler(env)
  return {
    name: 'paychangu-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}
