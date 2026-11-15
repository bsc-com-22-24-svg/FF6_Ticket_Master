import { api, setToken } from '../../lib/backend';
import { syncKyc } from '../../lib/verification';

export type Role = 'customer' | 'organizer' | 'staff' | 'admin';
export type AccountStatus = 'active' | 'disabled';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
}

// Only the signed-in user is kept in the browser (so a refresh does not log them out).
// Every account, password and role lives in the backend database.
const SESSION_KEY = 'tm_user';

function readSession(): User | null {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? (JSON.parse(raw) as User) : null;
    } catch {
        return null;
    }
}

export function getUser(): User | null {
    return readSession();
}

// The backend names roles differently from this app.
type BackendRole = 'ATTENDEE' | 'ORGANIZER' | 'CHECK_IN_STAFF' | 'ADMIN';
const FROM_BACKEND: Record<BackendRole, Role> = {
    ATTENDEE: 'customer',
    ORGANIZER: 'organizer',
    CHECK_IN_STAFF: 'staff',
    ADMIN: 'admin',
};

interface AuthResponse {
    accessToken?: string;
    access_token?: string;
    token?: string;
    user?: { id: string; name?: string; email: string; role: BackendRole };
}

// Older backend builds return only the token, so the account details are read from it.
function decodeJwt(token: string): { sub?: string; email?: string; role?: BackendRole; name?: string } {
    try {
        const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(decodeURIComponent(escape(atob(part))));
    } catch {
        return {};
    }
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

function startSession(result: AuthResponse, fallbackName = ''): User {
    const token = result.accessToken ?? result.access_token ?? result.token;
    if (!token) throw new Error('The backend did not return a sign-in token');
    const claims = decodeJwt(token);
    const account = result.user ?? { id: claims.sub ?? '', name: claims.name, email: claims.email ?? '', role: claims.role as BackendRole };
    if (!account.id || !account.role) throw new Error('The backend returned an incomplete sign-in response');
    const user: User = {
        id: account.id,
        name: account.name || fallbackName || account.email.split('@')[0],
        email: account.email,
        role: FROM_BACKEND[account.role] ?? 'customer',
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    setToken(token);
    return user;
}

export async function loginRequest(email: string, password: string): Promise<User> {
    const user = startSession(await postAuth('/auth/login', { email: email.trim(), password }));
    // an organizer's saved business details decide whether the KYC page is shown
    if (user.role === 'organizer') await syncKyc(user.id).catch(() => null);
    return user;
}

export async function registerRequest(name: string, email: string, password: string, role: 'customer' | 'organizer' = 'customer'): Promise<User> {
    return startSession(await postAuth('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password,
        role: role === 'organizer' ? 'ORGANIZER' : 'ATTENDEE',
    }), name.trim());
}

export function logoutRequest(): void {
    localStorage.removeItem(SESSION_KEY);
    setToken(null);
}
