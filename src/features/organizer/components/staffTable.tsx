import React from 'react';
import type { StaffItem } from '../Data/staff';

interface StaffTableProps {
  staff: StaffItem[];
}

export const StaffTable: React.FC<StaffTableProps> = ({ staff }) => {
  return (
    <div className="table-responsive">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {staff.map((member) => (
            <tr key={member.id}>
              <td className="font-semibold">{member.name}</td>
              <td>{member.email}</td>
              <td>{member.role}</td>
              <td>{member.department}</td>
              <td>
                <span className={`status-badge ${member.status === 'Active' ? 'published' : 'draft'}`}>
                  {member.status}
                </span>
              </td>
              <td>
                <button className="btn-action">⚙️ Manage</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
