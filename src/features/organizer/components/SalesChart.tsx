import React from 'react';
import type { EventItem } from '../Data/Events';

export const SalesChart: React.FC<{ events: EventItem[] }> = ({ events }) => {
  const maximum = Math.max(1, ...events.map((event) => event.ticketsSold));

  return (
    <div className="sales-summary-container">
      <div className="chart-header">
        <h4>Tickets sold by event</h4>
        <span className="text-muted">Live data from your events</span>
      </div>
      {events.length === 0 ? (
        <p className="text-muted">No event sales data available.</p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate">{event.name}</span>
                <strong>{event.ticketsSold.toLocaleString()}</strong>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-navy"
                  style={{ width: `${(event.ticketsSold / maximum) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
