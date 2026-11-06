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
// Demo only: passwords changed through the mock "forgot password" flow, keyed by email.
const PASSWORD_OVERRIDES_KEY = 'tm_password_overrides';

function readJson<T>(key:string): T | null {
    try{
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T   ) : null;
    }catch{
        return null;
    }
}
function allAccounts():StoredUser[]{
    const overrides = readJson<Record<string, string>>(PASSWORD_OVERRIDES_KEY) ?? {};
    return [...MOCK_USERS, ...(readJson<StoredUser[]>(ACCOUNTS_KEY)?? [])].map((account) =>
        overrides[account.email] ? { ...account, password: overrides[account.email] } : account,
    );
}

function toManaged(account: FullAccount): ManagedUser {
    return {
        id: account.id, name: account.name, email: account.email, role: account.role,
        status: account.status, createdAt: account.createdAt,
        organizerId: account.organizerId, assignedEventIds: account.assignedEventIds,
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
    if(isUserDisabled(account.id)) throw new Error('This account has been disabled. Contact an administrator.');
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
