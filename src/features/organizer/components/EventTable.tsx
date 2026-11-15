import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { EventItem } from '../Data/Events';

interface EventTableProps {
  events: EventItem[];
  onPublish?: (id: string) => Promise<void>;
  onCancel?: (id: string) => Promise<void>;
  onRestore?: (id: string, status: 'DRAFT' | 'PUBLISHED') => Promise<void>;
}

// the event's picture, or the calendar icon when it is missing or cannot be loaded
const Thumb: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <div className="placeholder-img-frame">📅</div>;
  return <img className="event-thumb" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
};

export const EventTable: React.FC<EventTableProps> = ({ events, onPublish, onCancel, onRestore }) => {
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
                <Thumb src={event.image} alt={event.name} />
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
                  <Link to="/events/$eventId" params={{ eventId: event.id }} className="btn-action">View</Link>
                  {event.status === 'Draft' && onPublish && (
                    <button className="btn-action primary" disabled={busyId === event.id} onClick={() => run(event.id, onPublish)}>Publish</button>
                  )}
                  {event.status === 'Cancelled' && onRestore && event.restoreStatus && (
                    <button
                      className="btn-action primary"
                      disabled={busyId === event.id}
                      onClick={() => void run(event.id, () => onRestore(
                        event.id,
                        event.restoreStatus === 'Published' ? 'PUBLISHED' : 'DRAFT',
                      ))}
                    >
                      Restore
                    </button>
                  )}
                  {event.status !== 'Cancelled' && onCancel && (
                    <button
                      className="btn-action danger"
                      disabled={busyId === event.id}
                      onClick={() => { if (window.confirm(`Cancel "${event.name}"? You can restore it later.`)) void run(event.id, onCancel); }}
                    >
                      Remove
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
