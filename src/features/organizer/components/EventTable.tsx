import React, { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ConfirmDialog } from '../../../components/ConfirmDialog';
import { useToast } from '../../toast';
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
  const [cancelTarget, setCancelTarget] = useState<EventItem | null>(null);
  const { showToast } = useToast();

  const run = async (id: string, action?: (id: string) => Promise<void>, successMessage = 'Event updated.') => {
    if (!action) return;
    setBusyId(id);
    try {
      await action(id);
      showToast(successMessage, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'That did not work. Try again.', 'error');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="table-responsive">
      <table className="dashboard-table event-table">
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
                  {event.status !== 'Cancelled' && (
                    <Link to="/organizer/events/$eventId/edit" params={{ eventId: event.id }} className="btn-action">Edit</Link>
                  )}
                  {event.status === 'Draft' && onPublish && (
                    <button
                      className="btn-action primary"
                      disabled={busyId === event.id}
                      onClick={() => void run(event.id, onPublish, 'Event published.')}
                    >
                      Publish
                    </button>
                  )}
                  {event.status === 'Cancelled' && onRestore && (
                    <button
                      className="btn-action primary"
                      disabled={busyId === event.id}
                      onClick={() => void run(event.id, () => onRestore(
                        event.id,
                        event.restoreStatus === 'Published' ? 'PUBLISHED' : 'DRAFT',
                      ), 'Event restored.')}
                    >
                      Restore
                    </button>
                  )}
                  {event.status !== 'Cancelled' && onCancel && (
                    <button
                      className="btn-action danger"
                      disabled={busyId === event.id}
                      onClick={() => setCancelTarget(event)}
                    >
                      Cancel event
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmDialog
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          if (cancelTarget && onCancel) void run(cancelTarget.id, onCancel, 'Event cancellation started. You can restore it from the event list.');
        }}
        title="Cancel this event?"
        description={cancelTarget ? `“${cancelTarget.name}” will be cancelled and removed from public listings. The event and ticket records are preserved.` : ''}
        confirmLabel="Cancel event"
        cancelLabel="Keep event"
        variant="danger"
      />
    </div>
  );
};
