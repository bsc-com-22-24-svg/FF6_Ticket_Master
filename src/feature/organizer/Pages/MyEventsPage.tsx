import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Plus, PencilLine } from 'lucide-react';

import Sidebar from '../Components/Sidebar';
import Button from '../Components/Button';
import { useEvents } from '../hooks/UseEvents';

export default function MyEventsPage() {
  const { data: events = [], isLoading, isError } = useEvents();

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-content">
        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <p className="eyebrow">EVENT MANAGEMENT</p>
              <h1>My Events</h1>

              <p className="page-subtitle">
                Manage your published events and drafts in one place.
              </p>
            </div>

            <Link to="/organizer/events/new">
              <Button>
                <Plus size={17} />
                Create Event
              </Button>
            </Link>
          </div>

          {isLoading && (
            <div className="notice">
              Loading events...
            </div>
          )}

          {isError && (
            <div className="notice notice--error">
              Could not load events. Please try again.
            </div>
          )}

          {!isLoading && !isError && events.length === 0 && (
            <div className="panel empty-state">
              <h2>No events yet</h2>
              <p>Create your first event to see it here.</p>

              <Link to="/organizer/events/new">
                <Button>
                  <Plus size={17} />
                  Create your first event
                </Button>
              </Link>
            </div>
          )}

          <div className="events-list">
            {events.map((event) => (
              <article
                className="event-list-card"
                key={event.id}
              >
                <div className="event-list-symbol">
                  <CalendarDays size={22} />
                </div>

                <div className="event-list-copy">
                  <div className="event-list-title">
                    <h2>{event.name}</h2>

                    <span
                      className={`status-pill ${
                        event.status === 'Published'
                          ? 'status-pill--published'
                          : 'status-pill--draft'
                      }`}
                    >
                      {event.status}
                    </span>
                  </div>

                  <p>
                    <CalendarDays size={14} />
                    {event.date || 'Date not set'}
                    {' at '}
                    {event.time || 'Time not set'}

                    <span> · </span>

                    <MapPin size={14} />
                    {event.location || 'Location not set'}
                  </p>

                  <div className="event-list-meta">
                    <span>{event.category}</span>

                    <span>
                      {event.ticketsSold ?? 0} tickets sold
                    </span>

                    <span>
                      {(event.ticketTypes ?? []).reduce(
                        (total, ticket) =>
                          total + Number(ticket.capacity || 0),
                        0
                      )}{' '}
                      capacity
                    </span>
                  </div>
                </div>

                <Link
                  className="edit-event-link"
                  to={`/organizer/events/${event.id}/edit`}
                >
                  <PencilLine size={16} />
                  Edit
                </Link>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}