import React from 'react';
import { Link } from '@tanstack/react-router';

interface StaffMember {
  id: string
  name: string
  email: string
  assignedEventIds: string[]
  status: 'active' | 'disabled'
}

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
              <td colSpan={5} className="py-8 text-center">Staff management is not available in the connected backend.</td>
            </tr>
          )}
          {staff.map((member) => (
            <tr key={member.id}>
              <td className="font-semibold">{member.name}</td>
              <td>{member.email}</td>
              <td>{member.assignedEventIds.length === 0 ? 'None' : member.assignedEventIds.length}</td>
              <td>
                <span className={`status-badge ${member.status === 'active' ? 'published' : 'draft'}`}>
                  {member.status === 'active' ? 'Active' : 'Disabled'}
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
