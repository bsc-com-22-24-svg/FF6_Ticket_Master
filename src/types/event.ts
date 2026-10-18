export interface TicketType {
  id: string
  name: string
  price: number
  capacity: number
  sold: number
}

export interface Event {
  id: string
  title: string
  category: string
  city: string
  venue: string
  date: string // ISO date, e.g. 2026-11-14
  time: string // 24h, e.g. 18:00
  description: string
  organizer: string
  image: string
  ticketTypes: TicketType[]
}

// cheapest ticket type price, used for cards, filters and sorting
export function fromPrice(event: Event): number {
  if (event.ticketTypes.length === 0) return 0
  return Math.min(...event.ticketTypes.map((type) => type.price))
}

export function remainingSeats(type: TicketType): number {
  return Math.max(0, type.capacity - type.sold)
}

export function isSoldOut(event: Event): boolean {
  return (
    event.ticketTypes.length > 0 &&
    event.ticketTypes.every((type) => remainingSeats(type) === 0)
  )
}

// true when the event date is today or later
export function isUpcomingEvent(event: Event): boolean {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
  return event.date >= today
}
