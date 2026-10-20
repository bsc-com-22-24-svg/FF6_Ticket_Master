import { useQuery } from '@tanstack/react-query';
import { fetchTickets } from '../ticketMockData';
import { useAuth } from '../../authentication';

export function useTickets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['tickets', user?.email],
    queryFn: () => fetchTickets(user?.email),
  });
}
