// @vitest-environment jsdom
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { TicketRecord } from '../../lib/tickets'
import {
  TICKET_IMAGE_HEIGHT,
  TICKET_IMAGE_SCALE,
  TICKET_IMAGE_WIDTH,
  renderTicketImage,
  ticketFromRecord,
  ticketFromView,
  ticketImageBlob,
} from './ticketImage'

const sample: TicketRecord = {
  id: 'TM-2026-004871',
  userId: 'u-1',
  eventId: 'lake-of-stars',
  eventName: 'Lake of Stars Live',
  date: '2026-11-14',
  time: '17:00',
  venue: 'Cape Maclear Beach',
  city: 'Mangochi',
  ticketType: 'General',
  price: 35000,
  holder: 'Chimwemwe Banda',
  status: 'valid',
  createdAt: '2026-10-24T16:00:00.000Z',
}

// jsdom has no canvas backend, so provide just enough 2D context for the
// drawing calls plus a fake PNG encoder.
const context = new Proxy(
  {},
  {
    get: () => () => {},
    set: () => true,
  },
) as unknown as CanvasRenderingContext2D

const originalToBlob = HTMLCanvasElement.prototype.toBlob

beforeAll(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    configurable: true,
    value(callback: BlobCallback) {
      callback(new Blob(['fake-png-bytes'], { type: 'image/png' }))
    },
  })
})

afterAll(() => {
  vi.restoreAllMocks()
  if (originalToBlob) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
      configurable: true,
      value: originalToBlob,
    })
  }
})

describe('shared ticket image', () => {
  it('renders a 2x card for high-DPI screens', () => {
    const canvas = renderTicketImage(ticketFromRecord(sample), null)
    expect(canvas).not.toBeNull()
    expect(canvas?.width).toBe(TICKET_IMAGE_WIDTH * TICKET_IMAGE_SCALE)
    expect(canvas?.height).toBe(TICKET_IMAGE_HEIGHT * TICKET_IMAGE_SCALE)
  })

  it('produces a non-empty PNG blob', async () => {
    const blob = await ticketImageBlob(ticketFromRecord(sample), null)
    expect(blob).not.toBeNull()
    expect(blob?.type).toBe('image/png')
    expect(blob?.size).toBeGreaterThan(0)
  })

  it('normalises the record and view models to the same image data', () => {
    const vipRecord = { ...sample, ticketType: 'VIP' }
    const fromRecord = ticketFromRecord(vipRecord)
    const fromView = ticketFromView({
      id: vipRecord.id,
      eventTitle: vipRecord.eventName,
      venue: vipRecord.venue,
      city: vipRecord.city,
      date: vipRecord.date,
      time: vipRecord.time,
      ticketType: vipRecord.ticketType,
      seat: 'VIP Section',
      price: vipRecord.price,
      holder: vipRecord.holder,
      status: vipRecord.status,
    })

    expect(fromView).toEqual(fromRecord)
  })
})
