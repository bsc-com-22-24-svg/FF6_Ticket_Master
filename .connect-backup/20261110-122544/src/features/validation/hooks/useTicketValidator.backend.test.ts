import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../lib/backend', () => ({ USE_BACKEND: true, api: vi.fn() }))
vi.mock('../../../lib/backendTickets', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../lib/backendTickets')>()
  return { ...actual, validateBackendTicket: vi.fn() }
})

import { validateBackendTicket } from '../../../lib/backendTickets'
import { validateTicket } from './useTicketValidator'

const validate = vi.mocked(validateBackendTicket)

const accepted = {
  accepted: true,
  reason: null,
  ticketId: '10',
  eventId: '4',
  validatedAt: '2026-11-06T10:00:00.000Z',
  details: { ticketNumber: 'TKT-ABC123', ticketType: 'General', eventTitle: 'Lake of Stars' },
}

describe('validateTicket with the backend', () => {
  beforeEach(() => {
    validate.mockReset()
  })

  it('accepts a backend ticket once and rejects the same ticket on the next scan', async () => {
    validate
      .mockResolvedValueOnce(accepted)
      .mockResolvedValueOnce({
        accepted: false,
        reason: 'ALREADY_USED',
        ticketId: '10',
        eventId: '4',
        validatedAt: null,
        details: accepted.details,
      })

    expect((await validateTicket('qr-token', '4')).status).toBe('valid')
    expect((await validateTicket('qr-token', '4')).status).toBe('used')
    expect(validate).toHaveBeenCalledTimes(2)
  })

  it('rejects a ticket for another event', async () => {
    validate.mockResolvedValueOnce({
      accepted: false,
      reason: 'WRONG_EVENT',
      ticketId: '10',
      eventId: '4',
      validatedAt: null,
      details: { ...accepted.details, eventTitle: 'Another event' },
    })

    const result = await validateTicket('qr-token', '9')

    expect(result.status).toBe('wrong_event')
    expect(result.message).toContain('Another event')
  })
})
