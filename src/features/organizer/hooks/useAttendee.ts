import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../authentication';
import { listAccounts } from '../../authentication/authStore';
import { isEventOwnedBy, listAllEvents } from '../../../lib/events';
import { listBookings, listTickets } from '../../../lib/tickets';
import { api, USE_BACKEND } from '../../../lib/backend';
import { listMyEvents } from '../../../lib/backendOrganizer';
import type { AttendeeFilters, AttendeeItem } from '../Data/Attendee';

export interface AttendeeUser {
  id: string;
  name: string;
}

interface BackendEventTicket {
  ticketNumber: string;
  ticketTypeId: string;
  customerId: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  attendee?: { userId: string; fullName: string; email: string } | null;
  ticketType?: { ticketTypeId: string; name: string; price: number | string };
  status: 'ISSUED' | 'USED' | 'CANCELLED' | 'REFUNDED';
  issuedAt: string;
  purchasedAt?: string | null;
  checkedInAt: string | null;
}

function formatPurchaseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

// In demo mode, one row per confirmed booking joined with the buyer and tickets.
export function buildAttendeePurchases(user: AttendeeUser | null): AttendeeItem[] {
  if (!user) return [];

  const ownedEvents = listAllEvents().filter((event) => isEventOwnedBy(event, user));
  const eventById = new Map(ownedEvents.map((event) => [event.id, event]));
  if (eventById.size === 0) return [];

  const tickets = listTickets();
  const ticketById = new Map(tickets.map((ticket) => [ticket.id, ticket]));
  const accountById = new Map(listAccounts().map((account) => [account.id, account]));

  return listBookings()
    .filter((booking) => booking.status === 'confirmed' && eventById.has(booking.eventId))
    .map((booking) => {
      const bookingTickets = booking.ticketIds
        .map((id) => ticketById.get(id))
        .filter((ticket) => ticket !== undefined);
      const ticketTypes = [...new Set(bookingTickets.map((ticket) => ticket.ticketType))];
      const account = accountById.get(booking.userId);
      const holder = bookingTickets[0]?.holder;
      const allCheckedIn =
        bookingTickets.length > 0 && bookingTickets.every((ticket) => ticket.status === 'used');

      return {
        id: booking.id,
        name: account?.name ?? holder ?? 'Guest',
        email: account?.email ?? '',
        event: eventById.get(booking.eventId)?.title ?? booking.eventTitle,
        eventId: booking.eventId,
        ticketType: ticketTypes.length > 0 ? ticketTypes.join(', ') : 'Unknown',
        quantity: booking.quantity,
        amount: booking.total,
        purchaseDate: formatPurchaseDate(booking.createdAt),
        purchasedAt: booking.createdAt,
        status: allCheckedIn ? 'Checked In' : 'Registered',
      } satisfies AttendeeItem;
    })
    .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime());
}

export async function fetchBackendAttendees(): Promise<AttendeeItem[]> {
  const events = await listMyEvents();
  const attendeesByEvent = await Promise.all(
    events.map(async (event) => {
      const tickets = await api<BackendEventTicket[]>(`/tickets/events/${encodeURIComponent(event.id)}`);

      return tickets.flatMap((ticket) => {
        if (!ticket.customerId || ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') return [];
        const purchasedAt = ticket.purchasedAt ?? ticket.issuedAt;

        return [{
          id: ticket.ticketNumber,
          name: ticket.attendee?.fullName ?? ticket.customerName ?? `Customer #${ticket.customerId}`,
          email: ticket.attendee?.email ?? ticket.customerEmail ?? '',
          event: event.name,
          eventId: event.id,
          ticketType: ticket.ticketType?.name ?? 'Unknown',
          quantity: 1,
          amount: Number(ticket.ticketType?.price ?? 0),
          purchaseDate: formatPurchaseDate(purchasedAt),
          purchasedAt,
          status: ticket.status === 'USED' || ticket.checkedInAt ? 'Checked In' : 'Registered',
        } satisfies AttendeeItem];
      });
    }),
  );

  return attendeesByEvent.flat().sort(
    (a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime(),
  );
}

export function filterAttendees(
  attendees: AttendeeItem[],
  filters: AttendeeFilters,
): AttendeeItem[] {
  const search = filters.search?.trim().toLowerCase() ?? '';

  return attendees.filter((attendee) => {
    if (filters.eventId && filters.eventId !== 'all' && attendee.eventId !== filters.eventId) {
      return false;
    }
    if (
      filters.ticketType &&
      filters.ticketType !== 'all' &&
      !attendee.ticketType.split(', ').includes(filters.ticketType)
    ) {
      return false;
    }
    if (!search) return true;
    return [attendee.name, attendee.email, attendee.event, attendee.ticketType, attendee.id].some(
      (value) => value.toLowerCase().includes(search),
    );
  });
}

export const useAttendees = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [eventId, setEventId] = useState('all');
  const [ticketType, setTicketType] = useState('all');

  const backendAttendees = useQuery({
    queryKey: ['organizer-attendees', user?.id],
    queryFn: fetchBackendAttendees,
    enabled: USE_BACKEND && !!user,
    refetchInterval: USE_BACKEND ? 30_000 : false,
  });
  const localAttendees = useMemo(
    () => (USE_BACKEND ? [] : buildAttendeePurchases(user)),
    [user],
  );
  const allAttendees = useMemo(
    () => (USE_BACKEND ? backendAttendees.data ?? [] : localAttendees),
    [backendAttendees.data, localAttendees],
  );
  const attendees = useMemo(
    () => filterAttendees(allAttendees, { search, eventId, ticketType }),
    [allAttendees, search, eventId, ticketType],
  );

  const eventOptions = useMemo(() => {
    const byId = new Map(allAttendees.map((attendee) => [attendee.eventId, attendee.event]));
    return [...byId.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [allAttendees]);

  const ticketTypeOptions = useMemo(
    () =>
      [...new Set(allAttendees.flatMap((attendee) => attendee.ticketType.split(', ')))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [allAttendees],
  );

  return {
    attendees,
    totalAttendees: allAttendees.length,
    checkedInCount: allAttendees.filter((attendee) => attendee.status === 'Checked In').length,
    loading: USE_BACKEND && backendAttendees.isLoading,
    error: USE_BACKEND && backendAttendees.error instanceof Error ? backendAttendees.error.message : '',
    search,
    setSearch,
    eventId,
    setEventId,
    ticketType,
    setTicketType,
    eventOptions,
    ticketTypeOptions,
  };
};
