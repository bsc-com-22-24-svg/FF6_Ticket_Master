import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOrganizerEvent,
  createOrganizerEvent,
  listMyEvents,
  publishEvent,
  restoreOrganizerEvent,
  type NewEventInput,
} from '../../../lib/backendOrganizer';

const MY_EVENTS_KEY = ['events', 'mine'];

export const useEvents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const remote = useQuery({ queryKey: MY_EVENTS_KEY, queryFn: listMyEvents });
  const events = remote.data ?? [];

  // The public catalogue and the organizer list both change after any of these actions.
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['events'] });

  const create = useMutation({ mutationFn: createOrganizerEvent, onSuccess: refresh });
  const publish = useMutation({ mutationFn: publishEvent, onSuccess: refresh });
  const cancel = useMutation({ mutationFn: cancelOrganizerEvent, onSuccess: refresh });
  const restore = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'DRAFT' | 'PUBLISHED' }) =>
      restoreOrganizerEvent(id, status),
    onSuccess: refresh,
  });

  const addEvent = async (newEvent: NewEventInput): Promise<void> => {
    await create.mutateAsync(newEvent);
  };

  const publishExisting = async (id: string): Promise<void> => {
    await publish.mutateAsync(id);
  };

  const cancelExisting = async (id: string): Promise<void> => {
    await cancel.mutateAsync(id);
  };

  const restoreExisting = async (id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<void> => {
    await restore.mutateAsync({ id, status });
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
    restoreEvent: restoreExisting,
    loading: remote.isLoading,
    loadError: remote.error instanceof Error ? remote.error.message : '',
  };
};