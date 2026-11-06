import React, { useState } from 'react';
import '../Organiser.css/organiser.css' ;

import { StatCard } from '../components/StatCard';
import { SearchBar } from '../components/searchBar';
import { EventTable } from '../components/EventTable';
import { StaffTable } from '../components/staffTable';
import { AttendeeTable } from '../components/Attendee';
import { SalesChart } from '../components/SalesChart';
import { CreateEventPage } from './CreateEventPage';

import { useEvents } from '../hooks/useEventStats';
import { useStaff } from '../hooks/useStaff';
import { useAttendees } from '../hooks/useAttendee';

export const OrganizerDashboardPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<'events' | 'staff' | 'attendees' | 'create'>('events');

  const { events, totalEvents, publishedCount, draftCount, totalTickets, search: evSearch, setSearch: setEvSearch, filterStatus, setFilterStatus, addEvent } = useEvents();
  const { staff, totalStaff, activeStaff, onLeaveStaff, search: stSearch, setSearch: setStSearch } = useStaff();
  const { attendees, totalAttendees, checkedInCount, search: atSearch, setSearch: setAtSearch } = useAttendees();

  const handleEventFormSubmission = (newEvent: any) => {
    addEvent(newEvent);
    setCurrentTab('events');
  };

  return (
    <div className="dashboard-root">
      {/* Sidebar Architecture Layout */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">FF6</div>
          <div className="brand-info">
            <span className="panel-title">FF6 Ticket</span>
            <span className="panel-subtitle">Organizer Panel</span>
          </div>
        </div>

        <div className="user-profile-badge">
          <div className="avatar-placeholder">JD</div>
          <div className="user-details">
            <span className="user-name">John Doe</span>
            <span className="user-role">Organizer ▼</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className={`nav-link-btn ${currentTab === 'events' ? 'active' : ''}`} onClick={() => setCurrentTab('events')}>
            <span className="nav-icon">📅</span> My Events
          </button>
          <button className={`nav-link-btn ${currentTab === 'create' ? 'active' : ''}`} onClick={() => setCurrentTab('create')}>
            <span className="nav-icon">➕</span> Create Event
          </button>
          <button className={`nav-link-btn ${currentTab === 'staff' ? 'active' : ''}`} onClick={() => setCurrentTab('staff')}>
            <span className="nav-icon">👥</span> Staff Roster
          </button>
          <button className={`nav-link-btn ${currentTab === 'attendees' ? 'active' : ''}`} onClick={() => setCurrentTab('attendees')}>
            <span className="nav-icon">🎟️</span> Attendees
          </button>
        </nav>
      </aside>

      {/* Main Core View Area */}
      <main className="dashboard-viewport">
        {currentTab === 'create' ? (
          <CreateEventPage onEventCreated={handleEventFormSubmission} onCancel={() => setCurrentTab('events')} />
        ) : (
          <div className="page-content-wrapper">
            
            {/* Context Dependent Metric Row Blocks */}
            {currentTab === 'events' && (
              <>
                <div className="content-header">
                  <div>
                    <h2 className="view-title">My Events</h2>
                    <p className="view-subtitle">Manage and track your active performance profiles.</p>
                  </div>
                  <button className="btn-primary-header" onClick={() => setCurrentTab('create')}>+ Create Event</button>
                </div>
                <div className="metrics-grid">
                  <StatCard title="Total Events" value={totalEvents} icon="📊" color="#3b82f6" />
                  <StatCard title="Published" value={publishedCount} icon="✅" color="#10b981" />
                  <StatCard title="Draft" value={draftCount} icon="🕒" color="#64748b" />
                  <StatCard title="Total Tickets Sold" value={totalTickets.toLocaleString()} icon="📈" color="#f59e0b" />
                </div>
                <div className="filter-toolbar">
                  <SearchBar value={evSearch} onChange={setEvSearch} placeholder="Search events by profile name or venue location..." />
                  <select className="toolbar-dropdown" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="All">All Statuses</option>
                    <option value="Published">Published Only</option>
                    <option value="Draft">Drafts Only</option>
                  </select>
                </div>
                <EventTable events={events} />
              </>
            )}

            {currentTab === 'staff' && (
              <>
                <div className="content-header">
                  <div>
                    <h2 className="view-title">My Staff Roster</h2>
                    <p className="view-subtitle">Manage structural credentials for active deployable members.</p>
                  </div>
                </div>
                <div className="metrics-grid">
                  <StatCard title="Total Staff" value={totalStaff} icon="👥" color="#3b82f6" />
                  <StatCard title="Active Staff" value={activeStaff} icon="🟢" color="#10b981" />
                  <StatCard title="On Leave" value={onLeaveStaff} icon="🟠" color="#f59e0b" />
                </div>
                <div className="filter-toolbar">
                  <SearchBar value={stSearch} onChange={setStSearch} placeholder="Search staff members by credential names or titles..." />
                </div>
                <StaffTable staff={staff} />
              </>
            )}

            {currentTab === 'attendees' && (
              <>
                <div className="content-header">
                  <div>
                    <h2 className="view-title">Registered Attendees</h2>
                    <p className="view-subtitle">Track entry vectors and validation configurations.</p>
                  </div>
                </div>
                <div className="metrics-grid">
                  <StatCard title="Total Attendees" value={totalAttendees} icon="🎟️" color="#3b82f6" />
                  <StatCard title="Checked In" value={checkedInCount} icon="✓" color="#10b981" />
                  <StatCard title="Attendance Rate" value={`${Math.round((checkedInCount / (totalAttendees || 1)) * 100)}%`} icon="📊" color="#a855f7" />
                </div>
                <div className="filter-toolbar">
                  <SearchBar value={atSearch} onChange={setAtSearch} placeholder="Search participants by purchase reference points..." />
                </div>
                <div className="split-view-layout">
                  <div className="split-table-side">
                    <AttendeeTable attendees={attendees} />
                  </div>
                  <div className="split-analytics-side">
                    <SalesChart />
                  </div>
                </div>
              </>
            )}

          </div>
        )}
      </main>
    </div>
  );
};
