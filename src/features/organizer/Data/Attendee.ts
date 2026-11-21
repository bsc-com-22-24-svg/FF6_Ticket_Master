export interface AttendeeItem {
  id: string;
  name: string;
  email: string;
  event: string;
  eventId: string;
  ticketType: string;
  quantity: number;
  amount: number;
  purchaseDate: string;
  purchasedAt: string;
  status: 'Checked In' | 'Registered';
}

export interface AttendeeFilters {
  search?: string;
  eventId?: string;
  ticketType?: string;
}
