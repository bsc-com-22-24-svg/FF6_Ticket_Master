import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  listAdminAuditLogs,
  listAdminEvents,
  listAdminKyc,
  reviewAdminKyc,
  updateAdminEventStatus,
} from './backendAdmin'

function stubResponse(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(
    body === undefined ? null : JSON.stringify(body),
    { status, headers: { 'Content-Type': 'application/json' } },
  ))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('backend admin API', () => {
  it('sends the selected status and optional reason to the moderation endpoint', async () => {
    const fetchMock = stubResponse({})

    await updateAdminEventStatus('event/12', 'CANCELLED', 'Duplicate event')

    expect(fetchMock).toHaveBeenCalledWith('/be/admin/events/event%2F12/status', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED', reason: 'Duplicate event' }),
    }))
  })

  it('lists admin events with an optional status filter', async () => {
    const fetchMock = stubResponse([])

    await listAdminEvents('PUBLISHED')

    expect(fetchMock).toHaveBeenCalledWith('/be/admin/events?status=PUBLISHED', expect.objectContaining({ method: 'GET' }))
  })

  it('reads the flat audit log response with a bounded limit', async () => {
    const fetchMock = stubResponse([])

    await listAdminAuditLogs(9999)

    expect(fetchMock).toHaveBeenCalledWith('/be/admin/audit-logs?limit=500', expect.objectContaining({ method: 'GET' }))
  })

  it('lists and reviews organizer KYC submissions', async () => {
    let fetchMock = stubResponse([])
    await listAdminKyc()
    expect(fetchMock).toHaveBeenCalledWith('/be/admin/kyc', expect.objectContaining({ method: 'GET' }))

    fetchMock = stubResponse({})
    await reviewAdminKyc('42', { approved: true, notes: 'Verified' })
    expect(fetchMock).toHaveBeenCalledWith('/be/admin/kyc/42/review', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ approved: true, notes: 'Verified' }),
    }))
  })
})
