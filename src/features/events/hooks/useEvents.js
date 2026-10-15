import { useQuery } from '@tanstack/react-query'
import { events } from '../../../mocks/events'
import { withDelay } from '../../../mocks/delay'

// Gets the events. The result is cached under the key ['events'],
// so every component that calls this hook shares one request.
// With a real backend only the queryFn changes: () => fetch('/api/events').then((r) => r.json())
export function useEvents() {
  return useQuery({ queryKey: ['events'], queryFn: () => withDelay(events) })
}
