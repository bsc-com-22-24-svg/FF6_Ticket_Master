import type { Ticket } from './ticketTypes';

const tickets: Ticket[] = [
  { id: 'TKT-2026-001', eventTitle: 'Zomba Tech Meetup', venue: 'Zomba Central Hall', date: '2026-11-20', time: '09:00', ticketType: 'Standard', seat: 'General Admission', price: 15000, status: 'valid' },
  { id: 'TKT-2026-002', eventTitle: 'Blantyre Business Expo', venue: 'Blantyre Cultural Centre', date: '2026-12-18', time: '10:30', ticketType: 'VIP', seat: 'VIP Section', price: 40000, status: 'valid' },
  { id: 'TKT-2026-003', eventTitle: 'Salima Beach Concert', venue: 'Salima Lakeshore', date: '2027-01-10', time: '16:00', ticketType: 'Standard', seat: 'General Admission', price: 20000, status: 'valid' },
  { id: 'TKT-2026-004', eventTitle: 'Lake of Stars Festival', venue: 'Senga Bay', date: '2026-09-12', time: '14:00', ticketType: 'Standard', seat: 'General Admission', price: 30000, status: 'used' },
  { id: 'TKT-2026-005', eventTitle: 'Mzuzu Food Fair', venue: 'Mzuzu Showgrounds', date: '2026-07-14', time: '11:00', ticketType: 'Student', seat: 'General Admission', price: 20000, status: 'used' },
];

export async function fetchTickets(): Promise<Ticket[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return tickets;
}
