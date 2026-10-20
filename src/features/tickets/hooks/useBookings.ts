import { useQuery } from '@tanstack/react-query';
import { fetchBookings } from '../bookingMockData';
import { useAuth } from '../../authentication';

export function useBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['bookings', user?.email],
    queryFn: () => fetchBookings(user?.email),
  });
}
