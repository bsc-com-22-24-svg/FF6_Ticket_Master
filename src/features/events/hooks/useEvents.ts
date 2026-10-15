import { useQuery } from '@tanstack/react-query'
import { events } from '../../../mocks/events'
import { withDelay } from '../../../mocks/delay'
import type { Event } from '../../../types/event'

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => withDelay(events),
  })
}
