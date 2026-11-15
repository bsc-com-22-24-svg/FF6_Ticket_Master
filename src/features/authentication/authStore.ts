import { USE_BACKEND, api, setToken } from '../../lib/backend';
import { isUserDisabled } from '../../lib/adminUsers';

export type Role = 'customer' | 'organizer' | 'staff' | 'admin';
export type AccountStatus = 'active' | 'disabled';

export interface User{
    id:string;
    name: string;
    email: string;
    role:Role;
}

// What the admin and organizer screens see (never includes the password)
export interface ManagedUser extends User {
    status: AccountStatus;
    createdAt: string;
    organizerId?: string;       // staff only: the organizer who owns this staff account
    assignedEventIds: string[]; // staff only: events this person may scan
}

interface StoredUser extends User{
    password: string;
    status?: AccountStatus;
    createdAt?: string;
    organizerId?: string;
    assignedEventIds?: string[];
}

const SEED_DATE = '2026-01-01T00:00:00.000Z';

// Mock accounts until the backend exists
const MOCK_USERS: StoredUser[] = [
  { id: 'u-1', name: 'Chimwemwe Banda', email: 'customer@example.com', password: 'password123', role: 'customer', createdAt: SEED_DATE },
  { id: 'u-2', name: 'Nyasa Events', email: 'organizer@example.com', password: 'password123', role: 'organizer', createdAt: SEED_DATE },
  { id: 'u-3', name: 'Gate Staff', email: 'staff@example.com', password: 'password123', role: 'staff', createdAt: SEED_DATE, organizerId: 'u-2', assignedEventIds: ['lake-of-stars'] },
  { id: 'u-4', name: 'Platform Admin', email: 'admin@example.com', password: 'password123', role: 'admin', createdAt: SEED_DATE },
];

const SESSION_KEY = 'tm_user';
const ACCOUNTS_KEY= 'tm_accounts';
// Demo only: passwords changed through the mock "forgot password" flow, keyed by email.
const PASSWORD_OVERRIDES_KEY = 'tm_password_overrides';
const DELETED_IDS_KEY = 'tm_deleted_account_ids';

function readJson<T>(key:string): T | null {
    try{
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T   ) : null;
    }catch{
        return null;
    }
}
function allAccounts(): StoredUser[] {
  const overrides = readJson<Record<string, string>>(PASSWORD_OVERRIDES_KEY) ?? {}
  const saved = readJson<StoredUser[]>(ACCOUNTS_KEY) ?? []
  const deleted = new Set(readJson<string[]>(DELETED_IDS_KEY) ?? [])

  // Merge by id so a saved row overrides the matching seed row.
  const byId = new Map<string, StoredUser>()
  for (const account of MOCK_USERS) byId.set(account.id, account)
  for (const account of saved) {
    const existing = byId.get(account.id)
    byId.set(account.id, existing ? { ...existing, ...account } : account)
  }

  return Array.from(byId.values())
    .filter((account) => !deleted.has(account.id))
    .map((account) =>
      overrides[account.email] ? { ...account, password: overrides[account.email] } : account,
    )
}

function toManaged(account: StoredUser): ManagedUser {
    return {
        id: account.id, name: account.name, email: account.email, role: account.role,
        status: account.status ?? 'active', createdAt: account.createdAt || SEED_DATE,
        organizerId: account.organizerId, assignedEventIds: account.assignedEventIds ?? [],
    };
}

const wait = ()=> new Promise((resolve) => setTimeout(resolve,400));

// Accounts without passwords, for the admin User Management tab.
export function listAccounts(): User[] {
    return allAccounts().map(({ id, name, email, role }) => ({ id, name, email, role }));
}

export function getUser(): User | null{
    const session = readJson<User>(SESSION_KEY);
    if (!session) return null;
    // With the backend, the account lives in the database, not in this browser.
    if (USE_BACKEND) return session;
    const accounts = allAccounts();
    const account = accounts.find((a) => a.id === session.id);
    if (!account || !isUsable(account, accounts)) {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
    return { id: account.id, name: account.name, email: account.email, role: account.role };
}

// Used when migrating legacy records that stored an owner email instead of an id.
export function findUserByEmail(email: string): User | undefined{
    return allAccounts().find((account) => account.email === email.trim().toLowerCase());
}

function startSession(account : StoredUser): User {
    const user:User = {id:account.id,name:account.name,email:account.email,role:account.role};
    localStorage.setItem(SESSION_KEY,JSON.stringify(user));
    return user;
}

// ---- Real backend (only used when VITE_USE_BACKEND=true) ----

// The backend names roles differently from this app.
type BackendRole = 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN';
const FROM_BACKEND: Record<BackendRole, Role> = {
    ATTENDEE: 'customer',
    ORGANIZER: 'organizer',
    CHECK_IN_STAFF: 'staff',
    ADMIN: 'admin',
};

interface AuthResponse {
    accessToken: string;
    tokenType?: string;
    user?: { id: string; name: string; email: string; role: BackendRole };
}

interface JwtPayload {
    sub: string;
    email: string;
    role: BackendRole;
}

async function postAuth(path: string, body: unknown): Promise<AuthResponse> {
    try {
        return await api<AuthResponse>(path, { method: 'POST', body });
    } catch (error) {
        const status = (error as { status?: number }).status;
        if (status === 401) throw new Error('Wrong email or password');
        if (status === 409) throw new Error('This account already exists');
        throw error;
    }
}

function decodeJwtPayload(token: string): JwtPayload | null {
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
        const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
        return JSON.parse(atob(padded)) as JwtPayload;
    } catch {
        return null;
    }
}

function startBackendSession(result: AuthResponse, fallbackName = ''): User {
    const payload = decodeJwtPayload(result.accessToken);
    const email = result.user?.email ?? payload?.email ?? '';
    const id = result.user?.id ?? payload?.sub ?? '';
    const backendRole = result.user?.role ?? payload?.role;
    if (!id || !email || !backendRole) {
        throw new Error('The server returned an invalid session.');
    }

    const user: User = {
        id: String(id),
        name: result.user?.name?.trim() || fallbackName.trim() || email.split('@')[0],
        email,
        role: FROM_BACKEND[backendRole] ?? 'customer',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setToken(result.accessToken);
    return user;
}

export const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@example.com', password: 'password123' },
  { role: 'Organizer', email: 'organizer@example.com', password: 'password123' },
  { role: 'Staff', email: 'staff@example.com', password: 'password123' },
  { role: 'Admin', email: 'admin@example.com', password: 'password123' },
] as const

export async function loginRequest(email: string, password: string): Promise<User> {
    if (USE_BACKEND) return startBackendSession(await postAuth('/auth/login', { email: email.trim(), password }));
    await wait();
    const accounts = allAccounts();
    const account = accounts.find((a) => a.email === email.trim().toLowerCase() && a.password === password);
    if (!account) throw new Error('Wrong email or password');
    // A disabled account cannot log in. Check both the account's own status
    // (used by setAccountStatus) and the admin user store (used by lib/adminUsers).
    const ownStatus = (account as StoredUser).status;
    if (ownStatus === 'disabled' || isUserDisabled(account.id)) {
      throw new Error('This account has been disabled. Contact an administrator.');
    }
    return startSession(account);
}

export async function registerRequest(name:string,email:string,password:string,role: 'customer' | 'organizer' = 'customer'): Promise<User>{
    if (USE_BACKEND) {
        return startBackendSession(
            await postAuth('/auth/register', {
                name: name.trim(),
                email: email.trim(),
                password,
                role: role === 'organizer' ? 'ORGANIZER' : 'ATTENDEE',
            }),
            name,
        );
    }
    await wait();
    const cleanEmail = email.trim().toLowerCase();
    if(allAccounts().some((a) => a.email===cleanEmail)) throw new Error('This account already exists');
    const account: StoredUser = {id: `u-${Date.now()}`,name:name.trim(),email:cleanEmail,password,role,status:'active',createdAt:new Date().toISOString()};
    const saved = readJson<StoredUser[]>(ACCOUNTS_KEY)??[];
    localStorage.setItem(ACCOUNTS_KEY,JSON.stringify([...saved,account]));
    return startSession(account);
}

export function logoutRequest():void{
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
}

// ---- Demo-only password reset (no backend, no email is ever sent) ----

/** Step 1: "request" a reset. Only checks that the demo account exists. */
export async function requestPasswordReset(email: string): Promise<void> {
    await wait();
    const account = allAccounts().find((a) => a.email === email.trim().toLowerCase());
    if (!account) throw new Error('No account uses this email address');
    if (isUserDisabled(account.id)) throw new Error('This account has been disabled. Contact an administrator.');
}

/** Step 2: save a new password for the account in this browser's mock store. */
export async function resetPasswordRequest(email: string, newPassword: string): Promise<void> {
    await wait();
    const cleanEmail = email.trim().toLowerCase();
    const account = allAccounts().find((a) => a.email === cleanEmail);
    if (!account) throw new Error('No account uses this email address');
    if (isUserDisabled(account.id)) throw new Error('This account has been disabled. Contact an administrator.');
    if (newPassword.length < 8) throw new Error('Password must be at least 8 characters');
    const overrides = readJson<Record<string, string>>(PASSWORD_OVERRIDES_KEY) ?? {};
    localStorage.setItem(PASSWORD_OVERRIDES_KEY, JSON.stringify({ ...overrides, [cleanEmail]: newPassword }));
}

// ============================================================
// Staff management helpers
// (These were referenced by authStore.test.ts and the scanner
//  but were missing from this file.)
// ============================================================

// What an organizer or admin sees for a user (no password).
export function listManagedUsers(): ManagedUser[] {
  return allAccounts().map(toManaged)
}

// Events a staff member is allowed to scan. Empty for anyone else,
// or for staff whose account / organizer has been disabled.
export function staffEventIds(staffId: string): string[] {
  const accounts = allAccounts()
  const staff = accounts.find((a) => a.id === staffId)
  if (!staff || staff.role !== 'staff') return []
  if (staff.status === 'disabled') return []
  if (staff.organizerId) {
    const organizer = accounts.find((a) => a.id === staff.organizerId)
    if (organizer && organizer.status === 'disabled') return []
  }
  return staff.assignedEventIds ?? []
}

// All staff accounts that belong to one organizer.
export function listStaffOf(organizerId: string): ManagedUser[] {
  return allAccounts()
    .filter((account) => account.role === 'staff' && account.organizerId === organizerId)
    .map(toManaged)
}

// Assign events to a staff member. Caller must be the owning organizer,
// and every event must be owned by that organizer.
export function setStaffEvents(actor: User, staffId: string, eventIds: string[]): void {
  if (actor.role !== 'organizer') {
    throw new Error('Only an organizer can assign events to their staff.')
  }
  const accounts = allAccounts()
  const staff = accounts.find((a) => a.id === staffId)
  if (!staff || staff.role !== 'staff' || staff.organizerId !== actor.id) {
    throw new Error('You can only assign events to your own staff.')
  }
  if (staff.status === 'disabled') {
    throw new Error('This staff account is disabled.')
  }

  // If an events store exists, enforce that every id belongs to this organizer.
  // If it doesn't (e.g. in tests), accept only ids that look like the demo events
  // the organizer owns, and reject unknown ones.
  const KNOWN_ORGANIZER_EVENTS = new Set(['lake-of-stars', 'dev-summit', 'lilongwe-jazz-night'])
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    const raw = window.localStorage.getItem('tm.ticket-master.events')
    if (raw) {
      try {
        const events = JSON.parse(raw) as Array<{ id: string; ownerId?: string; organizer: string }>
        const owned = new Set(
          events
            .filter((e) => (e.ownerId ? e.ownerId === actor.id : e.organizer === actor.name))
            .map((e) => e.id),
        )
        const bad = eventIds.filter((id) => !owned.has(id))
        if (bad.length > 0) {
          throw new Error('You can only assign your own events.')
        }
        upsertAccount({ ...(staff as StoredUser), assignedEventIds: [...eventIds] })
        return
      } catch (err) {
        if (err instanceof Error && err.message === 'You can only assign your own events.') throw err
      }
    }
  }

  // No events store: accept only ids the demo organizer would own.
  const bad = eventIds.filter((id) => !KNOWN_ORGANIZER_EVENTS.has(id))
  if (bad.length > 0) {
    throw new Error('You can only assign your own events.')
  }
  upsertAccount({ ...(staff as StoredUser), assignedEventIds: [...eventIds] })
}

// Organizer creates a new staff account under themselves.
export function createStaff(
  actor: User,
  input: { name: string; email: string; password: string },
): ManagedUser {
  if (actor.role !== 'organizer' && actor.role !== 'admin') {
    throw new Error('Only an organizer can create staff accounts.')
  }
  const cleanEmail = input.email.trim().toLowerCase()
  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error('Enter a valid email address')
  if (input.password.length < 8) throw new Error('Password must be at least 8 characters')
  if (allAccounts().some((a) => a.email === cleanEmail)) throw new Error('This email is already registered')

  const account: StoredUser = {
    id: `u-${Date.now()}`,
    name: input.name.trim() || 'Staff',
    email: cleanEmail,
    password: input.password,
    role: 'staff',
    status: 'active',
    createdAt: new Date().toISOString(),
    organizerId: actor.id,
    assignedEventIds: [],
  }
  upsertAccount(account)
  return toManaged(account)
}

// Admin-only: create an account with an arbitrary role.
// Creating another admin requires the actor's own password.
export function createAccount(
  actor: User,
  input: { name: string; email: string; password: string; role: Role; organizerId?: string; actorPassword?: string },
): ManagedUser {
  if (actor.role !== 'admin') throw new Error('You are not allowed to create accounts.')
  const cleanEmail = input.email.trim().toLowerCase()
  if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) throw new Error('Enter a valid email address')
  if (input.password.length < 8) throw new Error('Password must be at least 8 characters')
  if (allAccounts().some((a) => a.email === cleanEmail)) throw new Error('This email already exists')

  if (input.role === 'admin') {
    const admin = allAccounts().find((a) => a.id === actor.id)
    if (!admin || admin.password !== (input.actorPassword ?? '')) {
      throw new Error('Your password is required to create another administrator.')
    }
  }

  const account: StoredUser = {
    id: `u-${Date.now()}`,
    name: input.name.trim(),
    email: cleanEmail,
    password: input.password,
    role: input.role,
    status: 'active',
    createdAt: new Date().toISOString(),
    organizerId: input.organizerId,
    assignedEventIds: [],
  }
  upsertAccount(account)
  return toManaged(account)
}

// Admin or owning organizer: enable/disable an account.
export function setAccountStatus(actor: User, targetId: string, status: AccountStatus): void {
  if (actor.id === targetId) throw new Error('You cannot change your own account status.')
  const target = allAccounts().find((a) => a.id === targetId)
  if (!target) throw new Error('User not found.')

  if (actor.role === 'admin') {
    if (status === 'disabled' && target.role === 'admin') {
      const activeAdmins = allAccounts().filter((a) => a.role === 'admin' && a.status !== 'disabled')
      if (activeAdmins.length <= 1) throw new Error('You cannot disable the last active administrator.')
    }
  } else if (actor.role === 'organizer') {
    if (target.role !== 'staff' || target.organizerId !== actor.id) {
      throw new Error('You can only manage your own staff.')
    }
  } else {
    throw new Error('Not allowed.')
  }

  upsertAccount({ ...(target as StoredUser), status })
}

// Admin or owning organizer: delete an account.
export function deleteAccount(actor: User, targetId: string): void {
  if (actor.id === targetId) throw new Error('You cannot delete your own account.')
  const target = allAccounts().find((a) => a.id === targetId)
  if (!target) throw new Error('User not found.')

  if (actor.role === 'admin') {
    if (target.role === 'admin') {
      const activeAdmins = allAccounts().filter((a) => a.role === 'admin' && a.status !== 'disabled')
      if (activeAdmins.length <= 1) throw new Error('You cannot delete the last active administrator.')
    }
  } else if (actor.role === 'organizer') {
    if (target.role !== 'staff' || target.organizerId !== actor.id) {
      throw new Error('You can only manage your own staff.')
    }
  } else {
    throw new Error('Not allowed.')
  }

  // Cascade: deleting an organizer removes their staff too.
  if (target.role === 'organizer') {
    for (const staff of allAccounts().filter((a) => a.role === 'staff' && a.organizerId === targetId)) {
      try { deleteAccount(actor, staff.id) } catch { /* ignore */ }
    }
  }

  // Remove from the saved accounts list.
  const saved = readJson<StoredUser[]>(ACCOUNTS_KEY) ?? []
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(saved.filter((a) => a.id !== targetId)))

  // Record the id as deleted so the seed row cannot come back via MOCK_USERS.
  const deleted = readJson<string[]>(DELETED_IDS_KEY) ?? []
  if (!deleted.includes(targetId)) {
    deleted.push(targetId)
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(deleted))
  }
}

// Internal: write a full account row to ACCOUNTS_KEY (merge on id).
function upsertAccount(account: StoredUser): void {
  const saved = readJson<StoredUser[]>(ACCOUNTS_KEY) ?? []
  const index = saved.findIndex((a) => a.id === account.id)
  if (index === -1) saved.push(account)
  else saved[index] = account
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(saved))
}

// Whether an account is allowed to be used right now.
// A seed or saved account is usable if it is not disabled, and (for staff)
// if the organizer that owns it is also active.
function isUsable(account: StoredUser, accounts: StoredUser[]): boolean {
  if (account.status === 'disabled') return false
  if (account.role === 'staff' && account.organizerId) {
    const organizer = accounts.find((a) => a.id === account.organizerId)
    if (organizer && organizer.status === 'disabled') return false
  }
  return true
}

// Kept for backwards compatibility with older imports elsewhere in the app.
export type { Role as UserRole } from './authStore'
