import { api } from './backend'

export interface StaffEventSummary {
  eventId: string
  title: string
}

export interface StaffMember {
  staffId: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  events: StaffEventSummary[]
}

export interface CreateStaffInput {
  name: string
  email: string
  password: string
}

const STAFF_PATH = '/organizers/me/staff'

export function listStaff(): Promise<StaffMember[]> {
  return api<StaffMember[]>(STAFF_PATH)
}

export function createStaff(input: CreateStaffInput): Promise<StaffMember> {
  return api<StaffMember>(STAFF_PATH, {
    method: 'POST',
    body: {
      name: input.name.trim(),
      email: input.email.trim(),
      password: input.password,
    },
  })
}

export function assignStaffEvents(staffId: string, eventIds: string[]): Promise<StaffMember> {
  return api<StaffMember>(`${STAFF_PATH}/${encodeURIComponent(staffId)}/events`, {
    method: 'PUT',
    body: { eventIds },
  })
}

export function setStaffActive(staffId: string, isActive: boolean): Promise<StaffMember> {
  return api<StaffMember>(`${STAFF_PATH}/${encodeURIComponent(staffId)}/active`, {
    method: 'PATCH',
    body: { isActive },
  })
}

export async function removeStaff(staffId: string): Promise<void> {
  await api<void>(`${STAFF_PATH}/${encodeURIComponent(staffId)}`, { method: 'DELETE' })
}
