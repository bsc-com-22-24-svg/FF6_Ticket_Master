import React from 'react';
import { Link } from '@tanstack/react-router';
import type { StaffMember } from '../../../lib/backendStaff';

interface StaffTableProps {
  staff: StaffMember[];
}

export const StaffTable: React.FC<StaffTableProps> = ({ staff }) => {
  return (
    <div className="table-responsive">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Assigned events</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center">
                No staff accounts yet. Create one to let someone scan tickets at your events.
              </td>
            </tr>
          )}
          {staff.map((member) => (
            <tr key={member.staffId}>
              <td className="font-semibold">{member.name}</td>
              <td>{member.email}</td>
              <td>
                {member.events.length === 0
                  ? 'None'
                  : member.events.map((event) => event.title).join(', ')}
              </td>
              <td>
                <span className={`status-badge ${member.isActive ? 'published' : 'draft'}`}>
                  {member.isActive ? 'Active' : 'Disabled'}
                </span>
              </td>
              <td>
                <Link to="/organizer/staff" className="btn-action">Manage</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
