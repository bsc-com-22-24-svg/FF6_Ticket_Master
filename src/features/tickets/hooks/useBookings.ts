import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../authentication'
import { fetchBookings } from '../bookingData'

export function useBookings() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bookings', user?.id],
    queryFn: fetchBookings,
    enabled: !!user?.id,
  })
}
