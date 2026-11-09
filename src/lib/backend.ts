// Application data always comes from the API; PayChangu keeps its own pending payment state.
export const USE_BACKEND = true

// The dev server forwards /be/* to the backend (see vite.config.ts), so the browser
// never calls port 3000 directly and there is no CORS problem.
export const API = '/be'

const TOKEN_KEY = 'tm_token'
export const NO_SERVER = 'Cannot reach the server. Is the backend running?'

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable: the user simply has to log in again
  }
}

function messageFrom(status: number, data: unknown): string {
  const message = data && typeof data === 'object' && 'message' in data ? (data as { message: unknown }).message : null
  if (status >= 500) return NO_SERVER
  if (Array.isArray(message)) return message.join('. ')
  if (typeof message === 'string') return message
  return `Request failed (${status})`
}

// JSON request to the backend. Adds the login token when there is one.
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(API + path, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new Error(NO_SERVER)
  }

  let data: unknown = null
  try {
    data = await response.json()
  } catch {
    data = null
  }
  if (!response.ok) {
    const error = new Error(messageFrom(response.status, data)) as Error & { status: number }
    error.status = response.status
    throw error
  }
  return data as T
}
