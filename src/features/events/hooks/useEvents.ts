import { useQuery } from '@tanstack/react-query'
import { listAllEvents, listEvents } from '../../../lib/events'
import { withDelay } from '../../../mocks/delay'

// Published events only — the public catalogue.
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => withDelay(listEvents()),
  })
}

// Every event including drafts — the organizer workspace.
export function useAllEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => withDelay(listAllEvents()),
  })
}
