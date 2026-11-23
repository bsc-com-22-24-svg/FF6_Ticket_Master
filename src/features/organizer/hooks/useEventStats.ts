import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOrganizerEvent,
  createOrganizerEvent,
  listMyEvents,
  publishEvent,
  restoreOrganizerEvent,
  type NewEventInput,
} from '../../../lib/backendOrganizer';
import type { EventItem } from '../Data/Events';

const MY_EVENTS_KEY = ['events', 'mine'];
const restoreStatusKey = (id: string) => `tm_event_restore_status_${id}`;

interface PendingCancellation {
  id: string;
  name: string;
  previousStatus: EventItem['status'];
  timerId: ReturnType<typeof setTimeout>;
}

export const useEvents = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [pendingCancels, setPendingCancels] = useState<Map<string, PendingCancellation>>(new Map());
  const pendingCancelsRef = useRef(pendingCancels);
  pendingCancelsRef.current = pendingCancels;

  const remote = useQuery({ queryKey: MY_EVENTS_KEY, queryFn: listMyEvents });
  const events = (remote.data ?? []).map((event) => {
    const pending = pendingCancels.get(event.id);
    if (pending) {
      return {
        ...event,
        status: 'Cancelled' as const,
        restoreStatus: (pending.previousStatus === 'Published' || pending.previousStatus === 'Draft' ? pending.previousStatus : 'Draft'),
        isPendingCancel: true,
      };
    }
    if (event.status !== 'Cancelled') return event;
    let restoreStatus: EventItem['restoreStatus'] = 'Draft';
    try {
      const saved = localStorage.getItem(restoreStatusKey(event.id));
      if (saved === 'Published' || saved === 'Draft') restoreStatus = saved;
    } catch { /* Restore as a draft if browser storage is unavailable. */ }
    return { ...event, restoreStatus };
  });

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

  // Immediately commit any pending cancellations before the page unloads
  useEffect(() => {
    const onBeforeUnload = () => {
      for (const [id, pending] of pendingCancelsRef.current.entries()) {
        clearTimeout(pending.timerId);
        void cancelOrganizerEvent(id);
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, []);

  const addEvent = async (newEvent: NewEventInput): Promise<void> => {
    await create.mutateAsync(newEvent);
  };

  const publishExisting = async (id: string): Promise<void> => {
    await publish.mutateAsync(id);
  };

  const undoCancel = useCallback((id: string): boolean => {
    const pending = pendingCancelsRef.current.get(id);
    if (pending) {
      clearTimeout(pending.timerId);
      setPendingCancels((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
      try { localStorage.removeItem(restoreStatusKey(id)); } catch { /* Ignore */ }
      return true;
    }
    return false;
  }, []);

  const cancelExisting = async (id: string): Promise<void> => {
    const event = events.find((item) => item.id === id);
    if (!event) return;
    const previousStatus = event.status;
    try {
      localStorage.setItem(restoreStatusKey(id), previousStatus);
    } catch { /* Keep cancellation available if browser storage is unavailable. */ }

    // Start a 15-second grace period timer before sending cancellation to backend
    const timerId = setTimeout(async () => {
      try {
        await cancel.mutateAsync(id);
      } catch {
        /* Ignore error if already committed */
      } finally {
        setPendingCancels((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      }
    }, 15000);

    setPendingCancels((prev) => {
      const next = new Map(prev);
      next.set(id, { id, name: event.name, previousStatus, timerId });
      return next;
    });
  };

  const restoreExisting = async (id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<void> => {
    if (undoCancel(id)) {
      return;
    }
    await restore.mutateAsync({ id, status });
    try { localStorage.removeItem(restoreStatusKey(id)); } catch { /* Ignore unavailable storage. */ }
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
    undoCancel,
    pendingCancels,
    loading: remote.isLoading,
    loadError: remote.error instanceof Error ? remote.error.message : '',
  };
};
