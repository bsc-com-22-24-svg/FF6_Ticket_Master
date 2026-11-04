import { redirect } from '@tanstack/react-router';
import { getUser, type Role } from './authStore';

export function roleForPath(path: string): Role | undefined {
    if (path.startsWith('/organizer')) return 'organizer';
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/scan')) return 'staff';
    if (path.startsWith('/checkout') || path.startsWith('/tickets') || path.startsWith('/bookings')) return 'customer';
    return undefined;
}
export function canAccess(role: Role, path: string): boolean {
    const needed = roleForPath(path.split('?')[0]);
    return !needed || needed === role;
}

// Bypassed: Organizers no longer require KYC verification before creating/publishing events.
export function requireVerifiedOrganizer(): (ctx: { location: { href: string } }) => void {
    return requireAuth('organizer');
}

export function requireAuth(role?: Role): (ctx: { location: { href: string } }) => void {
    return ({ location }) => {
        const user = getUser();
        if (!user) throw redirect({ to: '/login', search: { redirect: location.href } });
        if (role && user.role !== role) throw redirect({ to: '/login', search: { redirect: location.href } });
    };
}
