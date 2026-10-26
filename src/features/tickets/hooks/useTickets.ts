import { useQuery } from '@tanstack/react-query';
import { fetchTickets } from '../ticketMockData';
import { useAuth } from '../../authentication';

export function useTickets() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    // Keyed per user so switching accounts never shows the previous cache.
    queryKey: ['tickets', userId],
    queryFn: () => fetchTickets(userId),
    enabled: !!userId,
  });
}
