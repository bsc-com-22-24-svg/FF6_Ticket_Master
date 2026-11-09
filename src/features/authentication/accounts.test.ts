import { beforeEach, describe, expect, it } from 'vitest'
import {
  createAccount, createStaff, deleteAccount, getUser, listManagedUsers, listStaffOf,
  loginRequest, setAccountStatus, setStaffEvents, staffEventIds,
  type User,
} from './authStore'

const admin: User = { id: 'u-4', name: 'Platform Admin', email: 'admin@example.com', role: 'admin' }
const organizer: User = { id: 'u-2', name: 'Nyasa Events', email: 'organizer@example.com', role: 'organizer' }

beforeEach(() => localStorage.clear())

describe('managed account defaults', () => {
  it('fills missing metadata on older saved accounts', () => {
    localStorage.setItem(
      'tm_accounts',
      JSON.stringify([{ id: 'u-1', name: 'Chimwemwe Banda', email: 'customer@example.com', password: 'password123', role: 'customer' }]),
    )

    const customer = listManagedUsers().find((account) => account.id === 'u-1')

    expect(customer).toMatchObject({
      status: 'active',
      createdAt: expect.any(String),
      assignedEventIds: [],
    })
  })
})

describe('disabled accounts', () => {
  it('cannot log in', async () => {
    setAccountStatus(admin, 'u-1', 'disabled')
    await expect(loginRequest('customer@example.com', 'password123')).rejects.toThrow('disabled')
  })

  it('lose an open session on the next check', async () => {
    await loginRequest('customer@example.com', 'password123')
    expect(getUser()?.id).toBe('u-1')
    setAccountStatus(admin, 'u-1', 'disabled')
    expect(getUser()).toBeNull()
  })

  it('can log in again once enabled', async () => {
    setAccountStatus(admin, 'u-1', 'disabled')
    setAccountStatus(admin, 'u-1', 'active')
    await expect(loginRequest('customer@example.com', 'password123')).resolves.toMatchObject({ id: 'u-1' })
  })
})

describe('admin rules', () => {
  it('only an admin can create accounts', () => {
    expect(() => createAccount(organizer, { name: 'X', email: 'x@example.com', password: 'password123', role: 'customer' })).toThrow('not allowed')
  })

  it('needs the admin password to create another admin', () => {
    const input = { name: 'Second Admin', email: 'admin2@example.com', password: 'password123', role: 'admin' as const }
    expect(() => createAccount(admin, input)).toThrow('password')
    expect(createAccount(admin, { ...input, actorPassword: 'password123' }).role).toBe('admin')
  })

  it('rejects duplicate emails and short passwords', () => {
    expect(() => createAccount(admin, { name: 'X', email: 'customer@example.com', password: 'password123', role: 'customer' })).toThrow('already exists')
    expect(() => createAccount(admin, { name: 'X', email: 'new@example.com', password: 'short', role: 'customer' })).toThrow('8 characters')
  })

  it('protects the last active administrator and the admin themselves', () => {
    expect(() => setAccountStatus(admin, 'u-4', 'disabled')).toThrow()
    expect(() => deleteAccount(admin, 'u-4')).toThrow()
  })

  it('deleting an organizer removes their staff too', () => {
    deleteAccount(admin, 'u-2')
    expect(listManagedUsers().some((u) => u.id === 'u-2' || u.id === 'u-3')).toBe(false)
  })
})

describe('organizer staff', () => {
  it('links new staff to the organizer who created them', () => {
    const staff = createStaff(organizer, { name: 'Gate Two', email: 'gate2@example.com', password: 'password123' })
    expect(staff.role).toBe('staff')
    expect(staff.organizerId).toBe('u-2')
    expect(listStaffOf('u-2').map((s) => s.id)).toContain(staff.id)
    expect(listStaffOf('another-organizer')).toEqual([])
  })

  it('cannot touch another organizer or a non-staff account', () => {
    const other = createAccount(admin, { name: 'Other Org', email: 'other@example.com', password: 'password123', role: 'organizer' })
    const otherOrganizer: User = { id: other.id, name: other.name, email: other.email, role: 'organizer' }
    expect(() => setAccountStatus(otherOrganizer, 'u-3', 'disabled')).toThrow('own staff')
    expect(() => deleteAccount(otherOrganizer, 'u-3')).toThrow('own staff')
    expect(() => setAccountStatus(organizer, 'u-1', 'disabled')).toThrow('own staff')
  })

  it('assigns only the organizer\'s own events', () => {
    setStaffEvents(organizer, 'u-3', ['lake-of-stars'])
    expect(staffEventIds('u-3')).toEqual(['lake-of-stars'])
    expect(() => setStaffEvents(organizer, 'u-3', ['game-on'])).toThrow('own events')
  })

  it('disabling the staff member or their organizer removes scanning access', () => {
    expect(staffEventIds('u-3')).toEqual(['lake-of-stars'])
    setAccountStatus(organizer, 'u-3', 'disabled')
    expect(staffEventIds('u-3')).toEqual([])
    setAccountStatus(organizer, 'u-3', 'active')
    setAccountStatus(admin, 'u-2', 'disabled')
    expect(staffEventIds('u-3')).toEqual([])
  })
})
