export type TicketType = { id: string; name: string; price: number; capacity: number };
export type EventStatus = 'Published' | 'Draft';
export type EventItem = {
  id: string; name: string; description: string; date: string; time: string; location: string;
  category: string; imageUrl?: string; status: EventStatus; ticketsSold: number; checkedIn: number;
  ticketTypes: TicketType[]; weeklySales: number[];
};
export type EventInput = Omit<EventItem, 'id' | 'ticketsSold' | 'checkedIn' | 'weeklySales'> & { id?: string };
