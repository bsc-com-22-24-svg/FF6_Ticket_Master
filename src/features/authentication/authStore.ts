export type Role = 'customer' | 'organizer' | 'staff' | 'admin';

export interface User{
    id:string;
    name: string;
    email: string;
    role:Role;
}

interface StoredUser extends User{
    password: string;
}

// Mock accounts until the backend exists
const MOCK_USERS: StoredUser[] = [
  { id: 'u-1', name: 'Chimwemwe Banda', email: 'customer@example.com', password: 'password123', role: 'customer' },
  { id: 'u-2', name: 'Nyasa Events', email: 'organizer@example.com', password: 'password123', role: 'organizer' },
  { id: 'u-3', name: 'Gate Staff', email: 'staff@example.com', password: 'password123', role: 'staff' },
  { id: 'u-4', name: 'Platform Admin', email: 'admin@example.com', password: 'password123', role: 'admin' },
];

const SESSION_KEY = 'tm_user';
const ACCOUNTS_KEY= 'tm_accounts';

function readJson<T>(key:string): T | null {
    try{
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T   ) : null;
    }catch{
        return null;
    }
}
function allAccounts():StoredUser[]{
    return [...MOCK_USERS, ...(readJson<StoredUser[]>(ACCOUNTS_KEY)?? [])];
}
const wait = ()=> new Promise((resolve) => setTimeout(resolve,400));

export function getUser(): User | null{
    return readJson<User>(SESSION_KEY);
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
    const account = allAccounts().find((a) => a.email ===email.trim().toLowerCase() && a.password ===password);
    if(!account) throw new Error('Wrong email or password');
    return startSession(account);
}

export async function registerRequest(name:string,email:string,password:string,role: 'customer' | 'organizer' = 'customer'): Promise<User>{
    await wait();
    const cleanEmail = email.trim().toLowerCase();
    if(allAccounts().some((a) => a.email===cleanEmail)) throw new Error('This account already exists');
    const account: StoredUser = {id: `u-${Date.now()}`,name:name.trim(),email:cleanEmail,password,role};
    const saved = readJson<StoredUser[]>(ACCOUNTS_KEY)??[];
    localStorage.setItem(ACCOUNTS_KEY,JSON.stringify([...saved,account]));
    return startSession(account);
}

export function logoutRequest():void{
    localStorage.removeItem(SESSION_KEY);
}
