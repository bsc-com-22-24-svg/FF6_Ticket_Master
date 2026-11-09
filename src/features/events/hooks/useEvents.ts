import { useQuery } from '@tanstack/react-query'
import { listMyEvents } from '../../../lib/backendOrganizer'
import { fetchPublishedEvents } from '../../../lib/backendEvents'

// Published events from the backend.
export function useEvents() {
  return useQuery({
    queryKey: ['events'],
    queryFn: fetchPublishedEvents,
  })
}

// Events managed by the signed-in organizer.
export function useAllEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: listMyEvents,
  })
}
