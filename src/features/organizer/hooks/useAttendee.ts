import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../authentication';
import { api } from '../../../lib/backend';
import { listMyEvents } from '../../../lib/backendOrganizer';
import type { AttendeeFilters, AttendeeItem } from '../Data/Attendee';

interface BackendEventTicket {
  ticketNumber: string;
  ticketTypeId: string;
  customerId: string | null;
  status: 'ISSUED' | 'USED' | 'CANCELLED' | 'REFUNDED';
  issuedAt: string;
  checkedInAt: string | null;
}

interface BackendTicketType {
  ticketTypeId: string;
  name: string;
  price: number | string;
}

function formatPurchaseDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export async function fetchBackendAttendees(): Promise<AttendeeItem[]> {
  const events = await listMyEvents();
  const attendeesByEvent = await Promise.all(
    events.map(async (event) => {
      const [tickets, ticketTypes] = await Promise.all([
        api<BackendEventTicket[]>(`/tickets/events/${encodeURIComponent(event.id)}`),
        api<BackendTicketType[]>(`/events/${encodeURIComponent(event.id)}/ticket-types`),
      ]);
      const ticketTypeById = new Map(ticketTypes.map((ticketType) => [ticketType.ticketTypeId, ticketType]));

      return tickets.flatMap((ticket) => {
        if (!ticket.customerId || ticket.status === 'CANCELLED' || ticket.status === 'REFUNDED') return [];
        const ticketType = ticketTypeById.get(ticket.ticketTypeId);
        const purchasedAt = ticket.issuedAt;

        return [{
          id: ticket.ticketNumber,
          name: `Customer #${ticket.customerId}`,
          email: '',
          event: event.name,
          eventId: event.id,
          ticketType: ticketType?.name ?? 'Unknown',
          quantity: 1,
          amount: Number(ticketType?.price ?? 0),
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
    enabled: !!user,
    refetchInterval: 30_000,
  });
  const allAttendees = useMemo(() => backendAttendees.data ?? [], [backendAttendees.data]);
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
    loading: backendAttendees.isLoading,
    error: backendAttendees.error instanceof Error ? backendAttendees.error.message : '',
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
