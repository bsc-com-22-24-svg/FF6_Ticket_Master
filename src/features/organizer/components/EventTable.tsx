import React, { useState } from 'react';
import type { EventItem } from '../Data/Events';

interface EventTableProps {
  events: EventItem[];
  onPublish?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
}

export const EventTable: React.FC<EventTableProps> = ({ events, onPublish, onCancel }) => {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const run = async (id: string, action?: (id: string) => Promise<void>) => {
    if (!action) return;
    setBusyId(id);
    setError('');
    try {
      await action(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'That did not work. Try again.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="table-responsive">
      {error && <div className="form-error-banner">{error}</div>}
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Event Image</th>
            <th>Event Name</th>
            <th>Date & Time</th>
            <th>Venue</th>
            <th>Tickets Sold</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>
                <div className="placeholder-img-frame">📅</div>
              </td>
              <td className="font-semibold">{event.name}</td>
              <td>{event.date}</td>
              <td>{event.venue}</td>
              <td>{event.ticketsSold.toLocaleString()}</td>
              <td>
                <span className={`status-badge ${event.status.toLowerCase()}`}>
                  ● {event.status}
                </span>
              </td>
              <td>
                <div className="action-buttons">
                  <button className="btn-action">👁️ View</button>
                  <button className="btn-action">✏️ Edit</button>
                  {event.status === 'Draft' && onPublish && (
                    <button className="btn-action" disabled={busyId === event.id} onClick={() => run(event.id, onPublish)}>🚀 Publish</button>
                  )}
                  {event.status !== 'Cancelled' && onCancel && (
                    <button
                      className="btn-action"
                      disabled={busyId === event.id}
                      onClick={() => { if (window.confirm(`Cancel "${event.name}"? Customers will no longer be able to buy tickets.`)) void run(event.id, onCancel); }}
                    >
                      ✖ Cancel
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
