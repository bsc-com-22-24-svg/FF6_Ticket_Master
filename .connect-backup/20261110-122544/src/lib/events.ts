import type { Event } from '../types/event'

export type EventStatus = 'Draft' | 'Pending' | 'Published' | 'Cancelled'

export interface StoredEvent extends Event {
  status: EventStatus
}
