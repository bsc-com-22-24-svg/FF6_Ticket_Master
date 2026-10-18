import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getEvents,
  getEvent,
  saveEvent,
} from '../api/EventsApi';
import type { EventInput, EventItem } from '../types/Event';

export function useEvents() {
  return useQuery<EventItem[]>({
    queryKey: ['organizer-events'],
    queryFn: getEvents,
  });
}

export function useEvent(eventId?: string) {
  return useQuery<EventItem | undefined>({
    queryKey: ['organizer-events', eventId],
    queryFn: () => getEvent(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useSaveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (event: EventInput) => saveEvent(event),

    onSuccess: (savedEvent) => {
      queryClient.invalidateQueries({
        queryKey: ['organizer-events'],
      });

      queryClient.invalidateQueries({
        queryKey: ['dashboard-stats'],
      });

      queryClient.setQueryData(
        ['organizer-events', savedEvent.id],
        savedEvent,
      );
    },
  });
}