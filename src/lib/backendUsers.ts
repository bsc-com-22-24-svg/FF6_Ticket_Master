import { api } from './backend'
import type { AccountStatus, Role } from '../features/authentication/authStore'

// Admin user management and organizer staff, served by the backend.

type BackendRole = 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN'

const FROM_BACKEND: Record<BackendRole, Role> = {
  ATTENDEE: 'customer',
  ORGANIZER: 'organizer',
  CHECK_IN_STAFF: 'staff',
  ADMIN: 'admin',
}

const TO_BACKEND: Record<Role, BackendRole> = {
  customer: 'ATTENDEE',
  organizer: 'ORGANIZER',
  staff: 'CHECK_IN_STAFF',
  admin: 'ADMIN',
}

export interface AdminUser {
  id: string
  name: string
  email: string
  role: Role
  status: AccountStatus
  createdAt: string
}

interface BackendUser {
  id: string
  name: string
  email: string
  role: BackendRole
  isActive: boolean
  createdAt: string
}

interface UsersPage {
  data: BackendUser[]
  totalPages: number
}

function toAdminUser(user: BackendUser): AdminUser {
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: FROM_BACKEND[user.role] ?? 'customer',
    status: user.isActive ? 'active' : 'disabled',
    createdAt: user.createdAt,
  }
}

// ---------- admin ----------

export async function listUsers(): Promise<AdminUser[]> {
  const users: AdminUser[] = []
  let page = 1
  let totalPages = 1
  do {
    const result = await api<UsersPage>(`/users?page=${page}&limit=100`)
    users.push(...result.data.map(toAdminUser))
    totalPages = result.totalPages
    page += 1
  } while (page <= totalPages && page <= 50)
  return users
}

export function setUserActive(userId: string, isActive: boolean): Promise<unknown> {
  return api(`/users/${encodeURIComponent(userId)}/status`, { method: 'PATCH', body: { isActive } })
}

// The backend deactivates the account and keeps the tickets and orders of that user.
export function deleteUser(userId: string): Promise<unknown> {
  return api(`/users/${encodeURIComponent(userId)}`, { method: 'DELETE' })
}

export function createUser(input: {
  name: string
  email: string
  password: string
  role: Role
  organizerId?: string
  actorPassword?: string
}): Promise<unknown> {
  return api('/users', {
    method: 'POST',
    body: {
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
      role: TO_BACKEND[input.role],
      ...(input.organizerId ? { organizerId: input.organizerId } : {}),
      ...(input.actorPassword ? { actorPassword: input.actorPassword } : {}),
    },
  })
}

export interface OrganizerKycView {
  businessName: string
  documentType: string
  documentUrl: string
  status: string
}

export async function fetchOrganizerKyc(userId: string): Promise<OrganizerKycView | null> {
  try {
    return await api<OrganizerKycView | null>(`/organizers/${encodeURIComponent(userId)}/kyc`)
  } catch {
    return null
  }
}

// ---------- organizer staff ----------

export interface StaffMember {
  id: string
  name: string
  email: string
  isActive: boolean
  createdAt: string
  assignedEventIds: string[]
}

interface RawStaffMember {
  id: string | number
  name: string
  email: string
  isActive?: boolean
  active?: boolean
  status?: string
  createdAt?: string
  created_at?: string
  assignedEventIds?: unknown
  eventIds?: unknown
  assignedEvents?: unknown
  events?: unknown
}

function normalizeIds(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string' || typeof item === 'number') return String(item)
      if (item && typeof item === 'object' && 'id' in item) {
        const id = (item as { id: unknown }).id
        if (typeof id === 'string' || typeof id === 'number') return String(id)
      }
      return null
    })
    .filter((id): id is string => id !== null)
}

function toStaffMember(raw: RawStaffMember): StaffMember {
  const ids = raw.assignedEventIds ?? raw.eventIds ?? raw.assignedEvents ?? raw.events
  const active =
    typeof raw.isActive === 'boolean'
      ? raw.isActive
      : typeof raw.active === 'boolean'
        ? raw.active
        : raw.status !== 'DISABLED' && raw.status !== 'INACTIVE'
  return {
    id: String(raw.id),
    name: raw.name,
    email: raw.email,
    isActive: active,
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    assignedEventIds: normalizeIds(ids),
  }
}

export async function listMyStaff(): Promise<StaffMember[]> {
  const result = await api<unknown>('/organizers/me/staff')
  let list: unknown[] = []
  if (Array.isArray(result)) {
    list = result
  } else if (result && typeof result === 'object') {
    const maybe = (result as { data?: unknown }).data
    if (Array.isArray(maybe)) list = maybe
    else if (Array.isArray((result as { staff?: unknown }).staff)) list = (result as { staff: unknown[] }).staff
  }
  return list
    .filter((item): item is RawStaffMember => !!item && typeof item === 'object')
    .map(toStaffMember)
}

export function createMyStaff(input: { name: string; email: string; password: string }): Promise<unknown> {
  return api('/organizers/me/staff', {
    method: 'POST',
    body: { name: input.name.trim(), email: input.email.trim(), password: input.password },
  })
}

export function assignStaffEvents(staffId: string, eventIds: string[]): Promise<unknown> {
  return api(`/organizers/me/staff/${encodeURIComponent(staffId)}/events`, { method: 'PUT', body: { eventIds } })
}

export function setStaffActive(staffId: string, isActive: boolean): Promise<unknown> {
  return api(`/organizers/me/staff/${encodeURIComponent(staffId)}/active`, { method: 'PATCH', body: { isActive } })
}

export function removeStaff(staffId: string): Promise<unknown> {
  return api(`/organizers/me/staff/${encodeURIComponent(staffId)}`, { method: 'DELETE' })
}

// Events a staff member may scan (the signed-in staff account).
export interface AssignedEvent {
  id: string
  title: string
  venue: string
}

interface BackendAssignedEvent {
  eventId: string
  title: string
  venue: string
}

export async function listMyAssignedEvents(): Promise<AssignedEvent[]> {
  const events = await api<BackendAssignedEvent[]>('/staff/me/events')
  return events.map((event) => ({
    id: String(event.eventId),
    title: event.title,
    venue: event.venue,
  }))
}
