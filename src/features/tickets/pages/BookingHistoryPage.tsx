import { Link } from '@tanstack/react-router'
import { BackendUnavailablePage } from '../../../components/BackendUnavailablePage'

export function BookingHistoryPage() {
  return (
    <BackendUnavailablePage title="Booking history unavailable" feature="Booking history">
      <Link to="/tickets">View your tickets</Link>
    </BackendUnavailablePage>
  );
}
