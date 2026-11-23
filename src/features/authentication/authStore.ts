import { api, setToken } from '../../lib/backend'

export type Role = 'customer' | 'organizer' | 'staff' | 'admin'
export type AccountStatus = 'active' | 'disabled'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

const SESSION_KEY = 'tm_user'

type BackendRole = 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN'

const FROM_BACKEND: Record<BackendRole, Role> = {
  ATTENDEE: 'customer',
  ORGANIZER: 'organizer',
  CHECK_IN_STAFF: 'staff',
  ADMIN: 'admin',
}

interface AuthResponse {
  accessToken?: string
  access_token?: string
  token?: string
  tokenType?: string
  user?: { id: string; name: string; email: string; role: BackendRole }
}

interface JwtPayload {
  sub: string
  email: string
  role: BackendRole
  name?: string
}

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value: unknown = JSON.parse(raw)
    if (
      value && typeof value === 'object' &&
      typeof (value as User).id === 'string' &&
      typeof (value as User).name === 'string' &&
      typeof (value as User).email === 'string' &&
      ['customer', 'organizer', 'staff', 'admin'].includes((value as User).role)
    ) return value as User
  } catch {
    // A corrupt cached session should require a fresh backend login.
  }
  return null
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1]
  if (!payload) return null
  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

async function postAuth(path: '/auth/login' | '/auth/register', body: unknown): Promise<AuthResponse> {
  try {
    return await api<AuthResponse>(path, { method: 'POST', body })
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 401) throw new Error('Wrong email or password')
    if (status === 409) throw new Error('This account already exists')
    throw error
  }
}

function startBackendSession(result: AuthResponse, fallbackName = ''): User {
  const accessToken = result.accessToken ?? result.access_token ?? result.token
  if (!accessToken) throw new Error('The backend did not return an access token.')
  const payload = decodeJwtPayload(accessToken)
  const id = result.user?.id ?? payload?.sub
  const email = result.user?.email ?? payload?.email
  const backendRole = result.user?.role ?? payload?.role
  if (!id || !email || !backendRole || !FROM_BACKEND[backendRole]) {
    throw new Error('The server returned an invalid session.')
  }

  const user: User = {
    id: String(id),
    name: result.user?.name?.trim() || fallbackName.trim() || payload?.name || email.split('@')[0],
    email,
    role: FROM_BACKEND[backendRole],
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  setToken(accessToken)
  return user
}

export function getUser(): User | null {
  return readSession()
}

export async function loginRequest(email: string, password: string): Promise<User> {
  const result = await postAuth('/auth/login', { email: email.trim(), password })
  return startBackendSession(result)
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'organizer' = 'customer',
): Promise<User> {
  const result = await postAuth('/auth/register', {
    name: name.trim(),
    email: email.trim(),
    password,
    role: role === 'organizer' ? 'ORGANIZER' : 'ATTENDEE',
  })
  return startBackendSession(result, name)
}

export function logoutRequest(): void {
  localStorage.removeItem(SESSION_KEY)
  setToken(null)
}

