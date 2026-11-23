import type { Role } from '../features/authentication/authStore'

// Which navigation links each kind of visitor may see (issue #89).
// The header asks this once, so desktop and mobile menus always agree.
export interface NavAccess {
  publicLinks: boolean // Home / Events / site links
  bookings: boolean
  tickets: boolean
  dashboard: boolean
  staffManagement: boolean
  scan: boolean
  admin: boolean
}

export function navAccess(role: Role | undefined): NavAccess {
  return {
    publicLinks: role === undefined || role === 'customer',
    bookings: role === 'customer',
    tickets: role === 'customer',
    dashboard: role === 'organizer',
    staffManagement: role === 'organizer',
    scan: role === 'staff',
    admin: role === 'admin',
  }
}
