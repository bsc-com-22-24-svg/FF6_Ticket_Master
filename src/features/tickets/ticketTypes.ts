export type TicketStatus = 'valid' | 'used';

export type Ticket = {
  id: string;
  eventTitle: string;
  venue: string;
  city: string;
  date: string; // ISO date, e.g. 2026-11-20
  time: string; // 24h, e.g. 09:00
  ticketType: string;
  seat: string;
  price: number; // in MK
  holder: string;
  status: TicketStatus;
};
