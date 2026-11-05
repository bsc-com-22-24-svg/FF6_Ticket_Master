// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import type { TicketRecord } from '../../lib/tickets'
import { TicketInfoTable } from './components/TicketInfoTable'
import { formatDateTime } from './ticketFormat'
import { toTicketView } from './ticketMockData'
import type { Ticket } from './ticketTypes'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const record: TicketRecord = {
  id: 'TM-2026-K7QX4M2WP9TB',
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

function render(ticket: Ticket) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  act(() => root.render(<TicketInfoTable ticket={ticket} />))
  return {
    container,
    unmount: () => {
      act(() => root.unmount())
      container.remove()
    },
  }
}

describe('purchase date and time', () => {
  it('formats a timestamp as date and time', () => {
    expect(formatDateTime('2026-10-24T16:00:00.000Z')).toMatch(/^\d{2} [A-Za-z]{3} 2026, \d{2}:\d{2}$/)
  })

  it('shows a dash for a missing or broken timestamp', () => {
    expect(formatDateTime('')).toBe('—')
    expect(formatDateTime('not a date')).toBe('—')
  })

  it('is carried from the stored ticket into the ticket view', () => {
    expect(toTicketView(record).purchasedAt).toBe('2026-10-24T16:00:00.000Z')
  })
})

describe('TicketInfoTable', () => {
  let cleanup: (() => void) | undefined
  afterEach(() => cleanup?.())

  it('shows the event and ticket details in two tables', () => {
    const { container, unmount } = render(toTicketView(record))
    cleanup = unmount

    expect(container.querySelectorAll('table')).toHaveLength(2)
    const headings = [...container.querySelectorAll('th')].map((th) => th.textContent)
    expect(headings).toEqual(
      expect.arrayContaining(['Event', 'Venue', 'Date', 'Time', 'Ticket ID', 'Ticket type', 'Holder', 'Price', 'Status', 'Purchased']),
    )
  })

  it('shows when the ticket was purchased', () => {
    const { container, unmount } = render(toTicketView(record))
    cleanup = unmount

    const row = [...container.querySelectorAll('tr')].find((tr) => tr.querySelector('th')?.textContent === 'Purchased')
    expect(row?.querySelector('td')?.textContent).toMatch(/^\d{2} [A-Za-z]{3} 2026, \d{2}:\d{2}$/)
  })

  it('shows a dash when the purchase time is unknown', () => {
    const { container, unmount } = render({ ...toTicketView(record), purchasedAt: undefined })
    cleanup = unmount

    const row = [...container.querySelectorAll('tr')].find((tr) => tr.querySelector('th')?.textContent === 'Purchased')
    expect(row?.querySelector('td')?.textContent).toBe('—')
  })
})
