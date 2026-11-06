// lib/adminUsers.ts
// User management for administrators. Every function:
//   1. verifies the caller is an administrator,
//   2. validates the request,
//   3. writes the audit record,
//   4. only then changes the data.
import { assertAdmin, recordAudit, type AuditActor } from './audit'
import { listAllKYC } from './verification'

export type UserRole = 'customer' | 'organizer' | 'staff' | 'admin'
export const USER_ROLES: UserRole[] = ['customer', 'organizer', 'staff', 'admin']

/** Shape of the accounts your auth store knows about. */
export interface AccountLike {
  id: string
  name: string
  email: string
  role: string
}

export interface ManagedUser {
  id: string
  name: string
  email: string
  role: UserRole
  disabled: boolean
  createdAt: string
}

const STORAGE_KEY = 'admin_managed_users_v1'

function normalizeRole(value: unknown): UserRole {
  const v = String(value ?? '').toLowerCase()
  return v === 'admin' || v === 'organizer' || v === 'staff' ? v : 'customer'
}

function readStore(): ManagedUser[] | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ManagedUser[]) : null
  } catch {
    return null
  }
}

function writeStore(users: ManagedUser[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

const DELETED_KEY = 'admin_deleted_ids_v1'

function readDeleted(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(DELETED_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

/** First run: start from organizer KYC records. Real accounts are merged in by load(). */
function seedFromKyc(): ManagedUser[] {
  const now = new Date().toISOString()
  return listAllKYC().map((kyc) => ({
    id: String(kyc.userId),
    name: kyc.businessName,
    email: '',
    role: 'organizer' as UserRole,
    disabled: false,
    createdAt: now,
  }))
}

function load(actor: AuditActor, accounts: AccountLike[] = []): ManagedUser[] {
  let users = readStore() ?? seedFromKyc()
  const deleted = readDeleted()
  const now = new Date().toISOString()
  // Merge in real accounts (and fill in names/emails for placeholder records).
  for (const acc of accounts) {
    const id = String(acc.id)
    if (deleted.includes(id)) continue
    const existing = users.find((u) => u.id === id)
    if (!existing) {
      users = [...users, { id, name: acc.name, email: acc.email, role: normalizeRole(acc.role), disabled: false, createdAt: now }]
    } else if (!existing.email) {
      users = users.map((u) => (u.id === id ? { ...u, name: acc.name, email: acc.email } : u))
    }
  }
  // The verified administrator must always exist in the list (needed for last-admin protection).
  if (!users.some((u) => u.id === String(actor.id))) {
    users = [...users, { id: String(actor.id), name: actor.name, email: '', role: 'admin', disabled: false, createdAt: now }]
  }
  writeStore(users)
  return users
}

function activeAdminCount(users: ManagedUser[]): number {
  return users.filter((u) => u.role === 'admin' && !u.disabled).length
}

function requireTarget(users: ManagedUser[], userId: string): ManagedUser {
  const target = users.find((u) => u.id === userId)
  if (!target) throw new Error('User not found.')
  return target
}

// ---------- public API ----------

export function listUsers(actor: AuditActor | null | undefined, accounts: AccountLike[] = []): ManagedUser[] {
  assertAdmin(actor)
  return load(actor, accounts)
}

/** Use this in your login flow so disabled accounts cannot sign in. */
export function isUserDisabled(userId: string): boolean {
  const users = readStore()
  return !!users?.find((u) => u.id === String(userId))?.disabled
}

export function setUserDisabled(actor: AuditActor | null | undefined, userId: string, disabled: boolean): void {
  assertAdmin(actor)
  const users = load(actor)
  const target = requireTarget(users, userId)
  if (target.id === String(actor.id)) throw new Error('You cannot change your own account status.')
  if (disabled && target.role === 'admin' && activeAdminCount(users) <= 1) {
    throw new Error('You cannot disable the last active administrator.')
  }
  recordAudit(actor, {
    action: disabled ? 'USER_DISABLED' : 'USER_ENABLED',
    targetType: 'user',
    targetId: target.id,
    targetLabel: target.name,
  })
  writeStore(users.map((u) => (u.id === target.id ? { ...u, disabled } : u)))
}

export function deleteUser(actor: AuditActor | null | undefined, userId: string): void {
  assertAdmin(actor)
  const users = load(actor)
  const target = requireTarget(users, userId)
  if (target.id === String(actor.id)) throw new Error('You cannot delete your own account.')
  if (target.role === 'admin' && activeAdminCount(users) <= 1) {
    throw new Error('You cannot delete the last active administrator.')
  }
  recordAudit(actor, {
    action: 'USER_DELETED',
    targetType: 'user',
    targetId: target.id,
    targetLabel: target.name,
    details: `Role at deletion: ${target.role}`,
  })
  window.localStorage.setItem(DELETED_KEY, JSON.stringify([...readDeleted(), target.id]))
  writeStore(users.filter((u) => u.id !== target.id))
}

export function changeUserRole(actor: AuditActor | null | undefined, userId: string, newRole: UserRole): void {
  assertAdmin(actor)
  if (!USER_ROLES.includes(newRole)) throw new Error('Invalid role.')
  const users = load(actor)
  const target = requireTarget(users, userId)
  if (target.id === String(actor.id)) throw new Error('You cannot change your own role.')
  if (target.role === newRole) return
  if (target.role === 'admin' && newRole !== 'admin' && activeAdminCount(users) <= 1) {
    throw new Error('You cannot remove the last active administrator.')
  }
  recordAudit(actor, {
    action: 'ROLE_CHANGED',
    targetType: 'user',
    targetId: target.id,
    targetLabel: target.name,
    details: `${target.role} → ${newRole}`,
  })
  writeStore(users.map((u) => (u.id === target.id ? { ...u, role: newRole } : u)))
}

export function createAdmin(actor: AuditActor | null | undefined, input: { name: string; email: string }): void {
  assertAdmin(actor)
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (!name) throw new Error('Name is required.')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email address.')
  const users = load(actor)
  if (users.some((u) => u.email.toLowerCase() === email)) throw new Error('A user with this email already exists.')
  const id = `admin-${Date.now()}`
  recordAudit(actor, {
    action: 'ADMIN_CREATED',
    targetType: 'user',
    targetId: id,
    targetLabel: name,
    details: email,
  })
  writeStore([...users, { id, name, email, role: 'admin', disabled: false, createdAt: new Date().toISOString() }])
}
