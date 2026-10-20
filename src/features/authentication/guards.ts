import {redirect} from '@tanstack/react-router';
import { getUser,type Role } from './authStore';
import { getKYC } from '../../lib/verification';


// Which role a path belongs to (undefined = open to everyone logged in or not)
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

// Organizer pages that create or change events: the organizer must be KYC-verified.
// Typing the URL by hand no longer skips the verification on the dashboard.
export function requireVerifiedOrganizer():(ctx: {location:{href:string}}) => void {
    const base = requireAuth('organizer');
    return (ctx) => {
        base(ctx);
        const user = getUser();
        if (!user || getKYC(user.id)?.status !== 'Verified') throw redirect({to: '/organizer/dashboard'});
    };
}

export function requireAuth(role?:Role):(ctx: {location:{href:string}}) => void {
    return({ location })=>{
        const user = getUser();
        if(!user) throw redirect({to: '/login' , search:{ redirect:location.href}});
        // wrong role: ask them to log in with the right account
        if(role && user.role !== role) throw redirect({to: '/login', search:{ redirect:location.href}});
    };
}