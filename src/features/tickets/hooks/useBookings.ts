import { useQuery } from '@tanstack/react-query';
import { fetchBookings } from '../bookingMockData';
import { useAuth } from '../../authentication';

export function useBookings() {
  const { user } = useAuth();
  const userId = user?.id;
  return useQuery({
    // Keyed per user so switching accounts never shows the previous cache.
    queryKey: ['bookings', userId],
    queryFn: () => fetchBookings(userId),
    enabled: !!userId,
  });
}
