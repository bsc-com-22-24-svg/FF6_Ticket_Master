import React from 'react';
import type { AttendeeItem } from '../Data/Attendee';

interface AttendeeTableProps {
  attendees: AttendeeItem[];
}

export const AttendeeTable: React.FC<AttendeeTableProps> = ({ attendees }) => {
  return (
    <div className="table-responsive">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Event</th>
            <th>Purchase Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => (
            <tr key={attendee.id}>
              <td className="font-semibold">{attendee.name}</td>
              <td>{attendee.email}</td>
              <td>{attendee.event}</td>
              <td>{attendee.purchaseDate}</td>
              <td>
                <span className={`status-badge ${attendee.status === 'Checked In' ? 'published' : 'draft'}`}>
                  {attendee.status}
                </span>
              </td>
              <td>
                <button className="btn-action">🎟️ Ticket</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
