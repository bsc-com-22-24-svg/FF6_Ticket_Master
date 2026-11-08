import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mockEvents, type EventItem } from '../Data/Events';
import { USE_BACKEND } from '../../../lib/backend';
import {
  cancelOrganizerEvent,
  createOrganizerEvent,
  formatEventDate,
  listMyEvents,
  publishEvent,
  type NewEventInput,
} from '../../../lib/backendOrganizer';

const MY_EVENTS_KEY = ['events', 'mine'];

export const useEvents = () => {
  const queryClient = useQueryClient();
  const [localEvents, setLocalEvents] = useState<EventItem[]>(mockEvents);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // With the backend on, the list comes from the database.
  const remote = useQuery({ queryKey: MY_EVENTS_KEY, queryFn: listMyEvents, enabled: USE_BACKEND });
  const events = USE_BACKEND ? (remote.data ?? []) : localEvents;

  // The public catalogue and the organizer list both change after any of these actions.
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const create = useMutation({ mutationFn: createOrganizerEvent, onSuccess: refresh });
  const publish = useMutation({ mutationFn: publishEvent, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: cancelOrganizerEvent, onSuccess: refresh });

  const addEvent = async (newEvent: NewEventInput): Promise<void> => {
    if (USE_BACKEND) {
      await create.mutateAsync(newEvent);
      return;
    }
    const freshItem: EventItem = {
      id: String(localEvents.length + 1),
      name: newEvent.name,
      date: formatEventDate(newEvent.startAt),
      venue: newEvent.venue,
      ticketsSold: 0,
      status: newEvent.status,
    };
    setLocalEvents([freshItem, ...localEvents]);
  };

  const publishExisting = async (id: string): Promise<void> => {
    if (USE_BACKEND) await publish.mutateAsync(id);
    else setLocalEvents(localEvents.map((e) => (e.id === id ? { ...e, status: 'Published' } : e)));
  };

  const cancelExisting = async (id: string): Promise<void> => {
    if (USE_BACKEND) await cancel.mutateAsync(id);
    else setLocalEvents(localEvents.map((e) => (e.id === id ? { ...e, status: 'Cancelled' } : e)));
  };

  const filteredEvents = events.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.venue.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalTickets = events.reduce((sum, item) => sum + item.ticketsSold, 0);

  return {
    events: filteredEvents,
    totalEvents: events.length,
    publishedCount: events.filter(e => e.status === 'Published').length,
    draftCount: events.filter(e => e.status === 'Draft').length,
    totalTickets,
    search,
    setSearch,
    filterStatus,
    setFilterStatus,
    addEvent,
    publishEvent: publishExisting,
    cancelEvent: cancelExisting,
    loading: USE_BACKEND && remote.isLoading,
    loadError: USE_BACKEND && remote.error instanceof Error ? remote.error.message : '',
  };
};