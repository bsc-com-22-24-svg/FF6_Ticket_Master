import { beforeEach, describe, expect, it } from 'vitest'
import {
  EVENTS_KEY,
  getEvent,
  incrementSold,
  listAllEvents,
  listEvents,
  resetEvents,
  saveEvent,
  type EventInput,
} from './events'

const baseInput: EventInput = {
  title: 'Test Fest',
  description: 'A test event',
  category: 'Festivals',
  city: 'Lilongwe',
  venue: 'Test Grounds',
  date: '2026-12-01',
  time: '18:00',
  organizer: 'QA',
  image: '',
  status: 'Published',
  ticketTypes: [{ id: 'general', name: 'General', price: 1000, capacity: 10, sold: 0 }],
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('events store', () => {
  it('seeds published events on first read', () => {
    const events = listEvents()
    expect(events.length).toBeGreaterThan(0)
    expect(events.every((event) => event.status === 'Published')).toBe(true)
    expect(window.localStorage.getItem(EVENTS_KEY)).not.toBeNull()
  })

  it('creates a published event that appears in the public catalogue', () => {
    const created = saveEvent(baseInput)
    expect(getEvent(created.id)?.title).toBe('Test Fest')
    expect(listEvents().some((event) => event.id === created.id)).toBe(true)
  })

  it('keeps drafts out of the public catalogue but visible to the organizer', () => {
    const draft = saveEvent({ ...baseInput, status: 'Draft' })
    expect(listEvents().some((event) => event.id === draft.id)).toBe(false)
    expect(listAllEvents().some((event) => event.id === draft.id)).toBe(true)
  })

  it('updates an existing event in place, preserving its id', () => {
    const created = saveEvent(baseInput)
    saveEvent({ ...baseInput, id: created.id, title: 'Renamed Fest' })
    expect(getEvent(created.id)?.title).toBe('Renamed Fest')
    expect(listAllEvents().filter((event) => event.id === created.id)).toHaveLength(1)
  })

  it('increments sold seats but never exceeds capacity', () => {
    const created = saveEvent(baseInput)
    incrementSold(created.id, 'general', 3)
    expect(getEvent(created.id)?.ticketTypes[0].sold).toBe(3)
    incrementSold(created.id, 'general', 99)
    expect(getEvent(created.id)?.ticketTypes[0].sold).toBe(10)
  })

  it('resets back to the seed catalogue', () => {
    saveEvent({ ...baseInput, status: 'Draft' })
    resetEvents()
    expect(listAllEvents().some((event) => event.title === 'Test Fest')).toBe(false)
  })

  it('returns undefined for an unknown event id', () => {
    expect(getEvent('does-not-exist')).toBeUndefined()
  })
})
