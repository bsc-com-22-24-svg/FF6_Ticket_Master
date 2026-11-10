import { afterEach, describe, expect, it, vi } from 'vitest'
import { api } from './backend'

vi.mock('./backend', () => ({ api: vi.fn() }))

import { createOrder } from './paychangu'

const apiMock = vi.mocked(api)

afterEach(() => {
  apiMock.mockReset()
})

describe('createOrder', () => {
  it.each([
    ['camel case', { orderNumber: 'ORD-1' }, 'ORD-1'],
    ['snake case', { order_number: 'ORD-2' }, 'ORD-2'],
    ['nested data envelope', { data: { order: { order_number: 'ORD-3' } } }, 'ORD-3'],
    ['result envelope', { result: { order: { number: 123 } } }, '123'],
  ])('reads an order number from the %s response', async (_label, response, expected) => {
    apiMock.mockResolvedValue(response)

    await expect(createOrder({ eventId: '4', ticketTypeId: '8', quantity: 1 }))
      .resolves.toEqual({ orderNumber: expected })
  })

  it('rejects a response with no order number', async () => {
    apiMock.mockResolvedValue({ id: 17 })
    await expect(createOrder({ eventId: '4', ticketTypeId: '8', quantity: 1 }))
      .rejects.toThrow('The backend did not return an order number.')
  })
})
