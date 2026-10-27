export type BookingStatus = 'confirmed' | 'cancelled';

export type Booking = {
  id: string;
  eventTitle: string;
  venue: string;
  date: string; // ISO date, e.g. 2026-09-12
  quantity: number;
  subtotal: number; // tickets only, in MK
  serviceFee: number; // in MK
  total: number; // what the customer paid, in MK
  status: BookingStatus;
};
