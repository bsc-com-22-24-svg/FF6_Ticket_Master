import { isEventOwnedBy, listAllEvents } from '../../lib/events';

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
type FullAccount = StoredUser & ManagedUser;
type Patch = Partial<StoredUser> & { deleted?: boolean };

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
// Changes made to any account (enable/disable, delete, event assignment).
// Kept apart so the built-in demo accounts can be changed too.
const PATCHES_KEY = 'tm_account_patches';

function readJson<T>(key:string): T | null {
    try{
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T   ) : null;
    }catch{
        return null;
    }
}

// Accounts registered before createdAt existed have an id like u-1761234567890
function guessDate(id: string): string {
    const stamp = /^u-(\d{10,})$/.exec(id)?.[1];
    return stamp ? new Date(Number(stamp)).toISOString() : SEED_DATE;
}

function allAccounts(): FullAccount[]{
    const patches = readJson<Record<string, Patch>>(PATCHES_KEY) ?? {};
    const base = [...MOCK_USERS, ...(readJson<StoredUser[]>(ACCOUNTS_KEY)?? [])];
    const result: FullAccount[] = [];
    for (const account of base) {
        const { deleted, ...patch } = patches[account.id] ?? {};
        if (deleted) continue;
        const merged = { ...account, ...patch };
        result.push({
            ...merged,
            status: merged.status ?? 'active',
            createdAt: merged.createdAt ?? guessDate(merged.id),
            assignedEventIds: merged.assignedEventIds ?? [],
        });
    }
    return result;
}

// A staff account stops working when its organizer is disabled or deleted.
function isUsable(account: FullAccount, accounts: FullAccount[]): boolean {
    if (account.status !== 'active') return false;
    if (account.role === 'staff' && account.organizerId) {
        const boss = accounts.find((a) => a.id === account.organizerId);
        return !!boss && boss.status === 'active';
    }
    return true;
}

function findAccount(id: string): FullAccount | undefined {
    return allAccounts().find((a) => a.id === id);
}

function patchAccount(id: string, patch: Patch): void {
    const patches = readJson<Record<string, Patch>>(PATCHES_KEY) ?? {};
    patches[id] = { ...patches[id], ...patch };
    localStorage.setItem(PATCHES_KEY, JSON.stringify(patches));
}

function toManaged(account: FullAccount): ManagedUser {
    return {
        id: account.id, name: account.name, email: account.email, role: account.role,
        status: account.status, createdAt: account.createdAt,
        organizerId: account.organizerId, assignedEventIds: account.assignedEventIds,
    };
}

const wait = ()=> new Promise((resolve) => setTimeout(resolve,400));

// The signed-in user. Checked against the live account every time, so a disabled or
// deleted account is signed out on the next page change instead of keeping access.
export function getUser(): User | null{
    const session = readJson<User>(SESSION_KEY);
    if (!session) return null;
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
export const DEMO_ACCOUNTS = [
  { role: 'Customer', email: 'customer@example.com', password: 'password123' },
  { role: 'Organizer', email: 'organizer@example.com', password: 'password123' },
  { role: 'Staff', email: 'staff@example.com', password: 'password123' },
  { role: 'Admin', email: 'admin@example.com', password: 'password123' },
] as const

export async function loginRequest(email:string,password:string):Promise<User>{
    await wait();
    const accounts = allAccounts();
    const account = accounts.find((a) => a.email ===email.trim().toLowerCase() && a.password ===password);
    if(!account) throw new Error('Wrong email or password');
    if(!isUsable(account, accounts)) throw new Error('This account has been disabled. Contact an administrator.');
    return startSession(account);
}

export async function registerRequest(name:string,email:string,password:string,role: 'customer' | 'organizer' = 'customer'): Promise<User>{
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
}

// ---------------------------------------------------------------------------
// Account management (admin directory and organizer staff)
// Every function re-checks the caller against the live account, so a screen
// that was left open cannot be used after the account lost its rights.
// ---------------------------------------------------------------------------

function requireActor(actor: User, role: Role): FullAccount {
    const accounts = allAccounts();
    const account = accounts.find((a) => a.id === actor.id);
    if (!account || account.role !== role || !isUsable(account, accounts)) {
        throw new Error('You are not allowed to do that.');
    }
    return account;
}

function activeAdminCount(): number {
    const accounts = allAccounts();
    return accounts.filter((a) => a.role === 'admin' && isUsable(a, accounts)).length;
}

function checkNewAccount(name: string, email: string, password: string): string {
    if (!name.trim()) throw new Error('Enter a full name.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('Enter a valid email address.');
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const cleanEmail = email.trim().toLowerCase();
    if (allAccounts().some((a) => a.email === cleanEmail)) throw new Error('This account already exists');
    return cleanEmail;
}

function saveNewAccount(account: StoredUser): ManagedUser {
    const saved = readJson<StoredUser[]>(ACCOUNTS_KEY) ?? [];
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...saved, account]));
    return toManaged(findAccount(account.id)!);
}

export function listManagedUsers(): ManagedUser[] {
    return allAccounts().map(toManaged);
}

export interface NewAccountInput {
    name: string;
    email: string;
    password: string;
    role: Role;
    organizerId?: string;
    actorPassword?: string;
}

export function createAccount(actor: User, input: NewAccountInput): ManagedUser {
    const admin = requireActor(actor, 'admin');
    const email = checkNewAccount(input.name, input.email, input.password);
    if (input.role === 'admin' && input.actorPassword !== admin.password) {
        throw new Error('Enter your own password to confirm creating an administrator.');
    }
    if (input.role === 'staff') {
        const boss = allAccounts().find((a) => a.id === input.organizerId && a.role === 'organizer');
        if (!boss) throw new Error('Choose the organizer this staff member belongs to.');
    }
    return saveNewAccount({
        id: `u-${Date.now()}`, name: input.name.trim(), email, password: input.password, role: input.role,
        status: 'active', createdAt: new Date().toISOString(),
        organizerId: input.role === 'staff' ? input.organizerId : undefined,
    });
}

export function createStaff(actor: User, input: { name: string; email: string; password: string }): ManagedUser {
    const organizer = requireActor(actor, 'organizer');
    const email = checkNewAccount(input.name, input.email, input.password);
    return saveNewAccount({
        id: `u-${Date.now()}`, name: input.name.trim(), email, password: input.password, role: 'staff',
        status: 'active', createdAt: new Date().toISOString(), organizerId: organizer.id, assignedEventIds: [],
    });
}

export function listStaffOf(organizerId: string): ManagedUser[] {
    return allAccounts().filter((a) => a.role === 'staff' && a.organizerId === organizerId).map(toManaged);
}

function requireManageable(actor: User, targetId: string): FullAccount {
    const target = findAccount(targetId);
    if (!target) throw new Error('That account no longer exists.');
    if (actor.role === 'admin') {
        requireActor(actor, 'admin');
        return target;
    }
    const organizer = requireActor(actor, 'organizer');
    if (target.role !== 'staff' || target.organizerId !== organizer.id) {
        throw new Error('You can only manage your own staff.');
    }
    return target;
}

export function setAccountStatus(actor: User, targetId: string, status: AccountStatus): void {
    const target = requireManageable(actor, targetId);
    if (status === 'disabled' && target.id === actor.id) throw new Error('You cannot disable your own account.');
    if (status === 'disabled' && target.role === 'admin' && activeAdminCount() <= 1) {
        throw new Error('You cannot disable the last active administrator.');
    }
    patchAccount(target.id, { status });
}

export function deleteAccount(actor: User, targetId: string): void {
    const target = requireManageable(actor, targetId);
    if (target.id === actor.id) throw new Error('You cannot delete your own account.');
    if (target.role === 'admin' && activeAdminCount() <= 1) {
        throw new Error('You cannot delete the last active administrator.');
    }
    if (target.role === 'organizer') {
        for (const staff of listStaffOf(target.id)) patchAccount(staff.id, { deleted: true });
    }
    patchAccount(target.id, { deleted: true });
}

export function setStaffEvents(actor: User, staffId: string, eventIds: string[]): void {
    const organizer = requireActor(actor, 'organizer');
    const staff = requireManageable(actor, staffId);
    const mine = new Set(listAllEvents().filter((e) => isEventOwnedBy(e, organizer)).map((e) => e.id));
    if (eventIds.some((id) => !mine.has(id))) throw new Error('You can only assign your own events.');
    patchAccount(staff.id, { assignedEventIds: [...new Set(eventIds)] });
}

export function staffEventIds(userId: string): string[] {
    const accounts = allAccounts();
    const account = accounts.find((a) => a.id === userId);
    if (!account || account.role !== 'staff' || !isUsable(account, accounts)) return [];
    return account.assignedEventIds;
}
