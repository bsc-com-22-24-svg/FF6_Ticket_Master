import React from 'react';
import type { EventItem } from '../Data/Events';

interface EventTableProps {
  events: EventItem[];
}

export const EventTable: React.FC<EventTableProps> = ({ events }) => {
  return (
    <div className="table-responsive">
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
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
