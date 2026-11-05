export interface AttendeeItem {
  id: string;
  name: string;
  email: string;
  event: string;
  purchaseDate: string;
  status: 'Checked In' | 'Registered';
}

export const mockAttendees: AttendeeItem[] = [
  { id: '1', name: 'Adeola Johnson', email: 'adeola@example.com', event: 'Music Fest 2025', purchaseDate: 'May 10, 2025', status: 'Checked In' },
  { id: '2', name: 'Chinedu Okafor', email: 'chinedu@example.com', event: 'Business Growth Summit', purchaseDate: 'Apr 18, 2025', status: 'Checked In' },
  { id: '3', name: 'Zainab Yusuf', email: 'zainab@example.com', event: 'Tech Innovation Summit', purchaseDate: 'Apr 30, 2025', status: 'Checked In' },
  { id: '4', name: 'Michael Brown', email: 'michael@example.com', event: 'Music Fest 2025', purchaseDate: 'May 10, 2025', status: 'Checked In' },
  { id: '5', name: 'Emily Davis', email: 'emily@example.com', event: 'Art & Culture Expo', purchaseDate: 'Apr 12, 2025', status: 'Checked In' }
];
