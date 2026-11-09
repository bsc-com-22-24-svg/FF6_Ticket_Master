import React from 'react';
import type { AttendeeItem } from '../Data/Attendee';

interface AttendeeTableProps {
  attendees: AttendeeItem[];
}

export const AttendeeTable: React.FC<AttendeeTableProps> = ({ attendees }) => {
  if (attendees.length === 0) {
    return (
      <div className="table-responsive">
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--slate-500)' }}>
          No ticket purchases found for your events.
        </div>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Email</th>
            <th>Event</th>
            <th>Ticket Type</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Purchase Date</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {attendees.map((attendee) => (
            <tr key={attendee.id}>
              <td className="font-semibold">{attendee.name}</td>
              <td>{attendee.email || 'Not provided by backend'}</td>
              <td>{attendee.event}</td>
              <td>{attendee.ticketType}</td>
              <td>{attendee.quantity.toLocaleString()}</td>
              <td className="font-semibold">MK {attendee.amount.toLocaleString()}</td>
              <td>{attendee.purchaseDate}</td>
              <td>
                <span className={`status-badge ${attendee.status === 'Checked In' ? 'published' : 'draft'}`}>
                  {attendee.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
