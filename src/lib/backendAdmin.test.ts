import { afterEach, describe, expect, it, vi } from 'vitest'
import { updateAdminEventStatus } from './backendAdmin'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('updateAdminEventStatus', () => {
  it('sends the selected status to the backend event update endpoint', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    await updateAdminEventStatus('event/12', 'CANCELLED')

    expect(fetchMock).toHaveBeenCalledWith('/be/events/event%2F12', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'CANCELLED' }),
    }))
  })
})
