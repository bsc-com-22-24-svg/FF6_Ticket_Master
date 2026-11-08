export interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  ticketsSold: number;
  status: 'Published' | 'Draft' | 'Cancelled';
}

export const mockEvents: EventItem[] = [
  { id: '1', name: 'Music Fest 2025', date: 'May 10, 2025 • 7:00 PM', venue: 'Eko Convention Centre', ticketsSold: 2840, status: 'Published' },
  { id: '2', name: 'Tech Innovation Summit', date: 'Apr 30, 2025 • 9:00 AM', venue: 'Landmark Event Centre', ticketsSold: 1760, status: 'Published' },
  { id: '3', name: 'Business Growth Summit', date: 'Apr 18, 2025 • 9:00 AM', venue: 'Landmark Event Centre', ticketsSold: 1240, status: 'Published' },
  { id: '4', name: 'Art & Culture Expo', date: 'Apr 12, 2025 • 10:00 AM', venue: 'Eko Convention Centre', ticketsSold: 980, status: 'Draft' },
  { id: '5', name: 'Food & Drinks Festival', date: 'Mar 28, 2025 • 11:00 AM', venue: 'Eko Convention Centre', ticketsSold: 600, status: 'Published' }
];
