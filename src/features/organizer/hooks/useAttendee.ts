import { useMemo, useState } from 'react';
import { useAuth } from '../../authentication';
import { listAccounts } from '../../authentication/authStore';
import { isEventOwnedBy, listAllEvents } from '../../../lib/events';
import { listBookings, listTickets } from '../../../lib/tickets';
import type { AttendeeFilters, AttendeeItem } from '../Data/Attendee';

export interface AttendeeUser {
  id: string;
  name: string;
}

function formatPurchaseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

// One row per confirmed booking, joined with the buyer, tickets and owned event.
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

  const allAttendees = useMemo(() => buildAttendeePurchases(user), [user]);
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
