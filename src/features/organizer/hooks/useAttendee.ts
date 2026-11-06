import { useState } from 'react';
import { mockAttendees,  type AttendeeItem } from '../Data/Attendee';

export const useAttendees = () => {
  const [attendees] = useState<AttendeeItem[]>(mockAttendees);
  const [search, setSearch] = useState('');

  const filteredAttendees = attendees.filter(attendee => 
    attendee.name.toLowerCase().includes(search.toLowerCase()) ||
    attendee.email.toLowerCase().includes(search.toLowerCase()) ||
    attendee.event.toLowerCase().includes(search.toLowerCase())
  );

  return {
    attendees: filteredAttendees,
    totalAttendees: attendees.length,
    checkedInCount: attendees.filter(a => a.status === 'Checked In').length,
    search,
    setSearch
  };
};
