import { api } from './backend'

export type ManagedRole = 'customer' | 'organizer' | 'staff' | 'admin'

export interface BackendManagedUser {
  id: string
  name: string
  email: string
  role: ManagedRole
  createdAt?: string
  status?: 'active' | 'disabled'
}

type BackendRole = 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN'

const ROLE_FROM_BACKEND: Record<BackendRole, ManagedRole> = {
  ATTENDEE: 'customer',
  ORGANIZER: 'organizer',
  CHECK_IN_STAFF: 'staff',
  ADMIN: 'admin',
}

const ROLE_TO_BACKEND: Record<ManagedRole, BackendRole> = {
  customer: 'ATTENDEE',
  organizer: 'ORGANIZER',
  staff: 'CHECK_IN_STAFF',
  admin: 'ADMIN',
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function mapUser(value: unknown): BackendManagedUser {
  if (!isRecord(value)) throw new Error('The backend returned an invalid user record.')
  const { id, name, email, role, createdAt, created_at } = value
  if (
    (typeof id !== 'string' && typeof id !== 'number') ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string'
  ) {
    throw new Error('The backend returned a user missing its ID, name, email, or role.')
  }
  if (!Object.prototype.hasOwnProperty.call(ROLE_FROM_BACKEND, role)) {
    throw new Error(`The backend returned an unsupported user role: ${role}`)
  }
  return {
    id: String(id),
    name,
    email,
    role: ROLE_FROM_BACKEND[role as BackendRole],
    createdAt: typeof createdAt === 'string' ? createdAt : typeof created_at === 'string' ? created_at : undefined,
    status: value.isActive === true || value.status === 'ACTIVE'
      ? 'active'
      : value.isActive === false || value.status === 'DISABLED'
        ? 'disabled'
        : undefined,
  }
}

export async function fetchManagedUsers(): Promise<BackendManagedUser[]> {
  const users: unknown[] = []
  let page = 1
  let totalPages: number | undefined

  do {
    const result: unknown = await api<unknown>(`/users?page=${page}&limit=100`)
    const list = Array.isArray(result)
      ? result
      : isRecord(result) && Array.isArray(result.data)
        ? result.data
        : isRecord(result) && Array.isArray(result.items)
          ? result.items
          : isRecord(result) && Array.isArray(result.users)
            ? result.users
            : null
    if (!list) {
      throw new Error('The backend returned an invalid user list.')
    }
    users.push(...list)

    const meta = isRecord(result) && isRecord(result.meta) ? result.meta : null
    const pagination = isRecord(result) && isRecord(result.pagination) ? result.pagination : null
    const reportedPages = meta?.totalPages ?? pagination?.totalPages ??
      (isRecord(result) ? result.totalPages : undefined)
    if (reportedPages !== undefined) {
      if (typeof reportedPages !== 'number' || !Number.isInteger(reportedPages) || reportedPages < 0) {
        throw new Error('The backend returned invalid user pagination details.')
      }
      totalPages = reportedPages
    } else if (list.length < 100) {
      totalPages = page
    }

    if (list.length === 0) break
    page += 1
  } while (totalPages === undefined || page <= totalPages)

  return users.map(mapUser)
}

export function updateManagedUserRole(userId: string, role: ManagedRole): Promise<void> {
  return api<void>(`/users/${encodeURIComponent(userId)}/role`, {
    method: 'PATCH',
    body: { role: ROLE_TO_BACKEND[role] },
  })
}

export function createManagedUser(input: {
  name: string
  email: string
  password: string
  role: ManagedRole
}): Promise<unknown> {
  return api('/users', {
    method: 'POST',
    body: {
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
      role: ROLE_TO_BACKEND[input.role],
    },
  })
}

export function setManagedUserActive(userId: string, isActive: boolean): Promise<void> {
  return api<void>(`/users/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: { isActive },
  })
}
