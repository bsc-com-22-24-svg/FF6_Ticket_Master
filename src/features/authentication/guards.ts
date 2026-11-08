import { redirect } from '@tanstack/react-router';
import { getUser, type Role } from './authStore';
import { getKYC } from '../../lib/verification';

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

// Organizers fill in their business details (KYC) the first time they log in.
// The details are accepted straight away, with no admin approval. Until they are
// saved, every organizer page sends the organizer to the KYC form.
export function hasCompletedKyc(userId: string): boolean {
    return getKYC(userId)?.status === 'Verified';
}

export function requireVerifiedOrganizer(): (ctx: { location: { href: string } }) => void {
    const needOrganizer = requireAuth('organizer');
    return (ctx) => {
        needOrganizer(ctx);
        const user = getUser();
        if (user && !hasCompletedKyc(user.id)) throw redirect({ to: '/organizer/kyc' });
    };
}

export function requireAuth(role?: Role): (ctx: { location: { href: string } }) => void {
    return ({ location }) => {
        const user = getUser();
        if (!user) throw redirect({ to: '/login', search: { redirect: location.href } });
        if (role && user.role !== role) throw redirect({ to: '/login', search: { redirect: location.href } });
    };
}
