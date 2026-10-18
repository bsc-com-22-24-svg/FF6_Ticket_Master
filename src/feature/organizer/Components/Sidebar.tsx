import { NavLink } from 'react-router-dom';

import {
  CalendarDays,
  ChartNoAxesCombined,
  ClipboardCheck,
  LayoutDashboard,
  PlusCircle,
  Ticket,
} from 'lucide-react';

const links = [
  {
    label: 'Dashboard',
    to: '/organizer',
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: 'My Events',
    to: '/organizer/events',
    icon: CalendarDays,
    end: true,
  },
  {
    label: 'Create Event',
    to: '/organizer/events/new',
    icon: PlusCircle,
    end: true,
  },
  {
    label: 'Sales',
    to: '/organizer/sales',
    icon: ChartNoAxesCombined,
    end: true,
  },
  {
    label: 'Attendance',
    to: '/organizer/attendance',
    icon: ClipboardCheck,
    end: true,
  },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <NavLink to="/organizer" className="brand" end>
        <Ticket size={25} />
        <span>Organizer</span>
      </NavLink>

      {/* Navigation */}
      <nav
        className="sidebar-nav"
        aria-label="Organizer navigation"
      >
        {links.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link--active' : ''}`
            }
          >
            <Icon size={20} />

            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar footer */}
      <div className="sidebar-footer">
        <span className="sidebar-avatar">JO</span>

        <div className="sidebar-user-info">
          <strong>Organizer</strong>
          <small>Event workspace</small>
        </div>
      </div>
    </aside>
  );
}