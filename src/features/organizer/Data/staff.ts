export interface StaffItem {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'Active' | 'On Leave';
}

export const mockStaff: StaffItem[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@ff6.com', role: 'Check-In Staff', department: 'Operations', status: 'Active' },
  { id: '2', name: 'Michael Brown', email: 'michael@ff6.com', role: 'Check-In Staff', department: 'Operations', status: 'Active' },
  { id: '3', name: 'Emily Davis', email: 'emily@ff6.com', role: 'Event Staff', department: 'Events', status: 'Active' },
  { id: '4', name: 'David Wilson', email: 'david@ff6.com', role: 'Check-In Staff', department: 'Operations', status: 'Active' },
  { id: '5', name: 'Kevin Taylor', email: 'kevin@ff6.com', role: 'Event Staff', department: 'Events', status: 'On Leave' }
];
