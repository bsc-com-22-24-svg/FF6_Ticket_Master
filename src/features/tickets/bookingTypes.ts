export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  id: string;
  eventTitle: string;
  venue: string;
  date: string; // ISO date, e.g. 2026-09-12
  quantity: number;
  total: number; // in MK
  status: BookingStatus;
};
