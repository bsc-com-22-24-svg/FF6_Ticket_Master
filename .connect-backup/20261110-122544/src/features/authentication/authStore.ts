import { api, setToken } from '../../lib/backend'

export type Role = 'customer' | 'organizer' | 'staff' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
}

interface BackendRoleResponse {
  id: string
  name: string
  email: string
  role: 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN'
}

const SESSION_KEY = 'tm_user'

const ROLE_FROM_BACKEND: Record<BackendRoleResponse['role'], Role> = {
  ATTENDEE: 'customer',
  ORGANIZER: 'organizer',
  CHECK_IN_STAFF: 'staff',
  ADMIN: 'admin',
}

function mapUser(user: BackendRoleResponse): User {
  const role = ROLE_FROM_BACKEND[user.role]
  if (!role) throw new Error(`The backend returned an unsupported account role: ${user.role}`)
  return { id: String(user.id), name: user.name, email: user.email, role }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function isBackendRole(value: string): value is BackendRoleResponse['role'] {
  return Object.prototype.hasOwnProperty.call(ROLE_FROM_BACKEND, value)
}

function userFromAccessToken(accessToken: string): BackendRoleResponse | null {
  const payload = accessToken.split('.')[1]
  if (!payload) return null

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')))
    if (!isRecord(decoded)) return null

    const id = decoded.sub
    const email = decoded.email
    const role = decoded.role
    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      typeof email !== 'string' ||
      typeof role !== 'string' ||
      !isBackendRole(role)
    ) {
      return null
    }

    return {
      id: String(id),
      name: typeof decoded.name === 'string' && decoded.name.trim() ? decoded.name : email,
      email,
      role,
    }
  } catch {
    return null
  }
}

function parseAuthResponse(value: unknown): { accessToken: string; user: User } {
  if (!isRecord(value)) {
    throw new Error('The backend returned an invalid authentication response.')
  }

  const accessToken =
    typeof value.accessToken === 'string'
      ? value.accessToken
      : typeof value.access_token === 'string'
        ? value.access_token
        : typeof value.token === 'string'
          ? value.token
          : null

  if (!accessToken?.trim()) {
    throw new Error('The backend did not return an access token. Please log in to continue.')
  }

  const tokenUser = userFromAccessToken(accessToken)
  const rawUser = isRecord(value.user) ? value.user : value
  const id = rawUser.id ?? tokenUser?.id
  const name = rawUser.name ?? tokenUser?.name ?? rawUser.email ?? tokenUser?.email
  const email = rawUser.email ?? tokenUser?.email
  const role = rawUser.role ?? tokenUser?.role

  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new Error('The backend did not return the account details required to start a session.')
  }
  if (!isBackendRole(role)) {
    throw new Error(`The backend returned an unsupported account role: ${role}`)
  }

  return {
    accessToken,
    user: mapUser({
      id: String(id),
      name,
      email,
      role,
    }),
  }
}

function readSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const value = JSON.parse(raw) as User
    if (
      typeof value.id !== 'string' ||
      typeof value.name !== 'string' ||
      typeof value.email !== 'string' ||
      !['customer', 'organizer', 'staff', 'admin'].includes(value.role)
    ) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return value
  } catch {
    return null
  }
}

function saveSession(user: User): User {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  return user
}

async function postAuth(path: string, body: unknown): Promise<unknown> {
  try {
    return await api<unknown>(path, { method: 'POST', body })
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 401) throw new Error('Wrong email or password')
    if (status === 409) throw new Error('This account already exists')
    throw error
  }
}

function startSession(result: unknown): User {
  const session = parseAuthResponse(result)
  const user = saveSession(session.user)
  setToken(session.accessToken)
  return user
}

async function authenticate(path: string, body: unknown): Promise<User> {
  return startSession(await postAuth(path, body))
}

export function getUser(): User | null {
  return readSession()
}

export async function loginRequest(email: string, password: string): Promise<User> {
  return authenticate('/auth/login', { email: email.trim(), password })
}

export async function registerRequest(
  name: string,
  email: string,
  password: string,
  role: 'customer' | 'organizer' = 'customer',
): Promise<User> {
  return authenticate('/auth/register', {
    name: name.trim(),
    email: email.trim(),
    password,
    role: role === 'organizer' ? 'ORGANIZER' : 'ATTENDEE',
  })
}

export function logoutRequest(): void {
  localStorage.removeItem(SESSION_KEY)
  setToken(null)
}
