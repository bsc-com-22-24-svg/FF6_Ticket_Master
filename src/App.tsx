import { Navigate, Route, Routes } from 'react-router-dom';

import OrganizerDashboardPage from './feature/organizer/Pages/OrganizerDashboardPage';
import CreateEventPage from './feature/organizer/Pages/CreateEventPage';
import MyEventsPage from './feature/organizer/Pages/MyEventsPage';
import SalesPage from './feature/organizer/Pages/SalesPage';
import AttendancePage from './feature/organizer/Pages/AttendancePage';

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to="/organizer" replace />}
      />

      <Route
        path="/organizer"
        element={<OrganizerDashboardPage />}
      />

      <Route
        path="/organizer/events"
        element={<MyEventsPage />}
      />

      <Route
        path="/organizer/events/new"
        element={<CreateEventPage />}
      />

      <Route
        path="/organizer/events/:eventId/edit"
        element={<CreateEventPage />}
      />

      <Route
        path="/organizer/sales"
        element={<SalesPage />}
      />

      <Route
        path="/organizer/attendance"
        element={<AttendancePage />}
      />

      <Route
        path="*"
        element={<Navigate to="/organizer" replace />}
      />
    </Routes>
  );
}