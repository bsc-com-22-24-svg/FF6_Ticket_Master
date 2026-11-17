import { useQuery } from '@tanstack/react-query'
import { listMyEvents } from '../../../lib/backendOrganizer'
import { fetchPublishedEvents } from '../../../lib/backendEvents'
import { listMyAssignedEvents } from '../../../lib/backendUsers'
import { getUser } from '../../authentication/authStore'

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

// A scanner can only select events explicitly assigned to that staff account.
export function useAssignedEvents() {
  const staffId = getUser()?.id ?? 'signed-out'
  return useQuery({
    queryKey: ['staff', staffId, 'assigned-events'],
    queryFn: listMyAssignedEvents,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}
