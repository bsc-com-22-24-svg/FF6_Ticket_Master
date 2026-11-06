import { useState } from 'react';
import { mockStaff, type StaffItem } from '../Data/staff';

export const useStaff = () => {
  const [staff] = useState<StaffItem[]>(mockStaff);
  const [search, setSearch] = useState('');

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase()) ||
    member.role.toLowerCase().includes(search.toLowerCase())
  );

  return {
    staff: filteredStaff,
    totalStaff: staff.length,
    activeStaff: staff.filter(s => s.status === 'Active').length,
    onLeaveStaff: staff.filter(s => s.status === 'On Leave').length,
    search,
    setSearch
  };
};
