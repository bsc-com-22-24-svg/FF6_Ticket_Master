import { afterEach, describe, expect, it, vi } from 'vitest'
import { sendContact } from './contact'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('sendContact', () => {
  it('posts the four separate contact fields as the backend expects', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', { status: 201 }))
    vi.stubGlobal('fetch', fetchMock)

    await sendContact({
      name: ' Chikondi Banda ',
      email: ' chikondi@example.com ',
      subject: ' Ticket QR issue ',
      message: ' I need help ',
    })

    expect(fetchMock).toHaveBeenCalledWith('/be/contact', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        name: 'Chikondi Banda',
        email: 'chikondi@example.com',
        subject: 'Ticket QR issue',
        message: 'I need help',
      }),
    }))
  })
})
