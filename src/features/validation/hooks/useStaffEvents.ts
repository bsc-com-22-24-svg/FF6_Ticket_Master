import { useQuery } from '@tanstack/react-query'
import { listMyAssignedEvents } from '../../../lib/backendUsers'

const STAFF_EVENTS_KEY = ['staff-events']

export function useStaffEvents() {
  const query = useQuery({
    queryKey: STAFF_EVENTS_KEY,
    queryFn: listMyAssignedEvents,
    retry: false,
  })

  return {
    events: query.data ?? [],
    loading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : '',
    unsupported: (query.error as { status?: number } | null)?.status === 404,
  }
}
