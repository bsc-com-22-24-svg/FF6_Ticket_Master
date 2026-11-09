export interface EventItem {
  id: string;
  name: string;
  date: string;
  venue: string;
  ticketsSold: number;
  status: 'Published' | 'Draft' | 'Cancelled';
}
