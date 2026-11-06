import { describe, expect, it } from 'vitest'
import type { Role } from '../features/authentication/authStore'
import { navAccess } from './navAccess'

// the names of the links this role is allowed to see
function allowed(role: Role | undefined): string[] {
  return Object.entries(navAccess(role))
    .filter(([, visible]) => visible)
    .map(([name]) => name)
}

describe('navAccess', () => {
  it('shows signed-out visitors only the public links', () => {
    expect(allowed(undefined)).toEqual(['publicLinks'])
  })

  it('shows customers only customer links', () => {
    expect(allowed('customer')).toEqual(['publicLinks', 'bookings', 'tickets'])
  })

  it('shows organizers only organizer links', () => {
    expect(allowed('organizer')).toEqual(['dashboard', 'staffManagement'])
  })

  it('shows staff only the scanner', () => {
    expect(allowed('staff')).toEqual(['scan'])
  })

  it('shows admins only the admin panel', () => {
    expect(allowed('admin')).toEqual(['admin'])
  })
})
