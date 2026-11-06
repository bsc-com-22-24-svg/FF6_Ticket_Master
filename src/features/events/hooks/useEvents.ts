import { useQuery } from '@tanstack/react-query'
import { listAllEvents, listEvents } from '../../../lib/events'
import { fetchPublishedEvents } from '../../../lib/backendEvents'
import { USE_BACKEND } from '../../../lib/backend'
import { withDelay } from '../../../mocks/delay'

// Published events only — the public catalogue (from the backend when VITE_USE_BACKEND=true).
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: () => (USE_BACKEND ? fetchPublishedEvents() : withDelay(listEvents())),
  })
}

// Every event including drafts — the organizer workspace.
export function useAllEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: () => withDelay(listAllEvents()),
  })
}
