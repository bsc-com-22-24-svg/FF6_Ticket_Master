export type EventStatus = 'Draft' | 'Published';

export interface TicketType {
  id: string;
  name: string;
  price: number;
  capacity: number;
}

export interface EventItem {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  imageUrl?: string;
  status: EventStatus;
  ticketTypes: TicketType[];
  ticketsSold: number;
  revenue: number;
  checkedIn: number;
}

export type EventInput = Omit<EventItem, 'id' | 'ticketsSold' | 'revenue' | 'checkedIn'> & { id?: string };
