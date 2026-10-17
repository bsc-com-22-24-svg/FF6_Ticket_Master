import { useQuery } from '@tanstack/react-query';
import { fetchBookings } from '../bookingMockData';

export function useBookings() {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
  });
}
