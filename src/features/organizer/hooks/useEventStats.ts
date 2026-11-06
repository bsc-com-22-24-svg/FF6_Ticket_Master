import { useState } from 'react';
import { mockEvents, type EventItem } from '../Data/Events';

export const useEvents = () => {
  const [events, setEvents] = useState<EventItem[]>(mockEvents);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  const addEvent = (newEvent: Omit<EventItem, 'id' | 'ticketsSold'>) => {
    const freshItem: EventItem = {
      ...newEvent,
      id: String(events.length + 1),
      ticketsSold: 0
    };
    setEvents([freshItem, ...events]);
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
    addEvent
  };
};
