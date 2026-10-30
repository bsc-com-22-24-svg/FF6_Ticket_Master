// lib/audit.ts
// Append-only audit log. Only administrators can read or write it.
// There is deliberately NO update/delete export: records cannot be edited or removed through this API.

export type AuditAction =
  | 'USER_DISABLED'
  | 'USER_ENABLED'
  | 'USER_DELETED'
  | 'ROLE_CHANGED'
  | 'ADMIN_CREATED'
  | 'KYC_VERIFIED'
  | 'KYC_REJECTED'
  | 'EVENT_APPROVED'
  | 'EVENT_REJECTED'
  | 'EVENT_UNPUBLISHED'
  | 'ACCESS_DENIED'

export type AuditTargetType = 'user' | 'event' | 'organizer' | 'system'

export interface AuditActor {
  id: string
  name: string
  role: string
}

export interface AuditEntry {
  id: string
  timestamp: string // ISO 8601
  actorId: string
  actorName: string
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  targetLabel: string
  details: string
  prevHash: string
  hash: string
}

export interface AuditInput {
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  targetLabel: string
  details?: string
}

const STORAGE_KEY = 'audit_log_v1'
const GENESIS_HASH = '0'.repeat(14)

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  USER_DISABLED: 'Account disabled',
  USER_ENABLED: 'Account enabled',
  USER_DELETED: 'User deleted',
  ROLE_CHANGED: 'Role changed',
  ADMIN_CREATED: 'Administrator created',
  KYC_VERIFIED: 'Organizer verified',
  KYC_REJECTED: 'Organizer rejected',
  EVENT_APPROVED: 'Event approved',
  EVENT_REJECTED: 'Event rejected',
  EVENT_UNPUBLISHED: 'Event unpublished',
  ACCESS_DENIED: 'Access denied',
}

// ---------- helpers ----------

function hashString(input: string): string {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0')
}

function computeHash(entry: Omit<AuditEntry, 'hash'>): string {
  return hashString(
    [
      entry.id,
      entry.timestamp,
      entry.actorId,
      entry.actorName,
      entry.action,
      entry.targetType,
      entry.targetId,
      entry.targetLabel,
      entry.details,
      entry.prevHash,
    ].join('|'),
  )
}

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function readAll(): AuditEntry[] {
  try {
    if (typeof window === 'undefined') return []
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as AuditEntry[]) : []
  } catch {
    return []
  }
}

function writeAll(entries: AuditEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function append(actor: AuditActor, input: AuditInput): AuditEntry {
  const entries = readAll()
  const prevHash = entries.length > 0 ? entries[entries.length - 1].hash : GENESIS_HASH
  const base: Omit<AuditEntry, 'hash'> = {
    id: newId(),
    timestamp: new Date().toISOString(),
    actorId: String(actor.id),
    actorName: actor.name,
    action: input.action,
    targetType: input.targetType,
    targetId: String(input.targetId),
    targetLabel: input.targetLabel,
    details: input.details ?? '',
    prevHash,
  }
  const entry: AuditEntry = { ...base, hash: computeHash(base) }
  writeAll([...entries, entry])
  return entry
}

// ---------- public API ----------

export function isAdmin(actor: AuditActor | null | undefined): actor is AuditActor {
  return !!actor && String(actor.role).toLowerCase() === 'admin'
}

export function assertAdmin(actor: AuditActor | null | undefined): asserts actor is AuditActor {
  if (!isAdmin(actor)) {
    throw new Error('Access denied: administrator privileges are required.')
  }
}

/**
 * Reads the signed-in user from the app's stored session.
 * Matches authStore.ts (key 'tm_user'). The dashboard itself uses useAuth().
 */
export function getCurrentActor(): AuditActor | null {
  try {
    if (typeof window === 'undefined') return null
    const keys = ['tm_user']
    for (const key of keys) {
      const raw = window.localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as Record<string, unknown>
      const candidate = (parsed && typeof parsed === 'object' && parsed.user && typeof parsed.user === 'object'
        ? parsed.user
        : parsed) as Record<string, unknown>
      const id = candidate.id ?? candidate.userId ?? candidate.uid ?? candidate.email
      const role = candidate.role
      if (id && typeof role === 'string') {
        const name = (candidate.name ?? candidate.fullName ?? candidate.email ?? 'Administrator') as string
        return { id: String(id), name: String(name), role }
      }
    }
  } catch {
    // ignore malformed session data
  }
  return null
}

/** Record an administrative action. Throws if the caller is not an administrator. */
export function recordAudit(actor: AuditActor | null | undefined, input: AuditInput): AuditEntry {
  assertAdmin(actor)
  return append(actor, input)
}

/** Record that a non-admin tried to reach an admin-only resource. */
export function recordDeniedAccess(actor: AuditActor, resource: string): void {
  try {
    append(actor, {
      action: 'ACCESS_DENIED',
      targetType: 'system',
      targetId: resource,
      targetLabel: resource,
      details: `Attempted access with role "${actor.role}"`,
    })
  } catch {
    // never let logging break the page
  }
}

/** Newest first. Ordinary users get nothing: this throws for non-admins. */
export function listAuditLogs(actor: AuditActor | null | undefined): AuditEntry[] {
  assertAdmin(actor)
  return readAll().slice().reverse()
}

/** Checks the hash chain. Returns the id of the first altered record, or null if intact. */
export function verifyAuditLog(actor: AuditActor | null | undefined): { intact: boolean; brokenAt: string | null } {
  assertAdmin(actor)
  const entries = readAll()
  let prev = GENESIS_HASH
  for (const entry of entries) {
    const { hash, ...rest } = entry
    if (entry.prevHash !== prev || computeHash(rest) !== hash) {
      return { intact: false, brokenAt: entry.id }
    }
    prev = hash
  }
  return { intact: true, brokenAt: null }
}
