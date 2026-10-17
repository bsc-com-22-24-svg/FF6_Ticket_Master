import type { Booking } from './bookingTypes';

const bookings: Booking[] = [
  { id: 'TM-1001', eventTitle: 'Lake of Stars Festival', venue: 'Senga Bay', date: '2026-09-12', quantity: 2, total: 60000, status: 'confirmed' },
  { id: 'TM-1002', eventTitle: 'Blantyre Jazz Night', venue: 'Kamuzu Stadium', date: '2026-08-02', quantity: 1, total: 15000, status: 'cancelled' },
  { id: 'TM-1003', eventTitle: 'Zomba Tech Meetup', venue: 'Zomba Central Hall', date: '2026-11-20', quantity: 3, total: 45000, status: 'confirmed' },
  { id: 'TM-1004', eventTitle: 'Mzuzu Food Fair', venue: 'Mzuzu Showgrounds', date: '2026-07-14', quantity: 4, total: 80000, status: 'confirmed' },
  { id: 'TM-1005', eventTitle: 'Lilongwe Comedy Show', venue: 'Bingu Conference Centre', date: '2026-12-05', quantity: 2, total: 50000, status: 'cancelled' },
];

export async function fetchBookings(): Promise<Booking[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return bookings;
}
