import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import "../Organiser.css/organiser.css";

import { useAuth } from "../../authentication";
import { StatCard } from "../components/StatCard";
import { SearchBar } from "../components/searchBar";
import { EventTable } from "../components/EventTable";
import { AttendeeTable } from "../components/Attendee";
import { SalesChart } from "../components/SalesChart";
import { CreateEventPage } from "./CreateEventPage";

import { useEvents } from "../hooks/useEventStats";
import { useAttendees } from "../hooks/useAttendee";
import { useStaff } from "../hooks/useStaff";
import { StaffTable } from "../components/staffTable";
import type { NewEventInput } from "../../../lib/backendOrganizer";

function initials(name: string | undefined): string {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "OR"
  );
}

export const OrganizerDashboardPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<
    "events" | "staff" | "attendees" | "create"
  >("events");

  const { user } = useAuth();
  const {
    events,
    totalEvents,
    publishedCount,
    draftCount,
    totalTickets,
    search: evSearch,
    setSearch: setEvSearch,
    filterStatus,
    setFilterStatus,
    addEvent,
    publishEvent,
    cancelEvent,
    loading: evLoading,
    loadError: evError,
  } = useEvents();
  const {
    attendees,
    totalAttendees,
    checkedInCount,
    search: atSearch,
    setSearch: setAtSearch,
    eventId: atEventId,
    setEventId: setAtEventId,
    ticketType: atTicketType,
    setTicketType: setAtTicketType,
    eventOptions,
    ticketTypeOptions,
    loading: attendeeLoading,
    error: attendeeError,
  } = useAttendees();
  const { staff, loading: staffLoading, error: staffError } = useStaff();

  // Throws when the backend refuses, so the form can show the message and stay open.
  const handleEventFormSubmission = async (newEvent: NewEventInput) => {
    await addEvent(newEvent);
    setCurrentTab("events");
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
          <div className="avatar-placeholder">{initials(user?.name)}</div>
          <div className="user-details">
            <span className="user-name">{user?.name ?? "Organizer"}</span>
            <span className="user-role">Organizer ▼</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-link-btn ${currentTab === "events" ? "active" : ""}`}
            onClick={() => setCurrentTab("events")}
          >
            <span className="nav-icon">📅</span> My Events
          </button>
          <button
            className={`nav-link-btn ${currentTab === "create" ? "active" : ""}`}
            onClick={() => setCurrentTab("create")}
          >
            <span className="nav-icon">➕</span> Create Event
          </button>
          <button
            className={`nav-link-btn ${currentTab === "staff" ? "active" : ""}`}
            onClick={() => setCurrentTab("staff")}
          >
            <span className="nav-icon">👥</span> Staff Roster
          </button>
          <button
            className={`nav-link-btn ${currentTab === "attendees" ? "active" : ""}`}
            onClick={() => setCurrentTab("attendees")}
          >
            <span className="nav-icon">🎟️</span> Attendees
          </button>
        </nav>
      </aside>

      {/* Main Core View Area */}
      <main className="dashboard-viewport">
        {currentTab === "create" ? (
          <CreateEventPage
            onEventCreated={handleEventFormSubmission}
            onCancel={() => setCurrentTab("events")}
          />
        ) : (
          <div className="page-content-wrapper">
            {/* Context Dependent Metric Row Blocks */}
            {currentTab === "events" && (
              <>
                <div className="content-header">
                  <div>
                    <h2 className="view-title">My Events</h2>
                    <p className="view-subtitle">
                      Manage and track your active performance profiles.
                    </p>
                  </div>
                  <button
                    className="btn-primary-header"
                    onClick={() => setCurrentTab("create")}
                  >
                    + Create Event
                  </button>
                </div>
                <div className="metrics-grid">
                  <StatCard
                    title="Total Events"
                    value={totalEvents}
                    icon="📊"
                    color="#3b82f6"
                  />
                  <StatCard
                    title="Published"
                    value={publishedCount}
                    icon="✅"
                    color="#10b981"
                  />
                  <StatCard
                    title="Draft"
                    value={draftCount}
                    icon="🕒"
                    color="#64748b"
                  />
                  <StatCard
                    title="Total Tickets Sold"
                    value={totalTickets.toLocaleString()}
                    icon="📈"
                    color="#f59e0b"
                  />
                </div>
                <div className="filter-toolbar">
                  <SearchBar
                    value={evSearch}
                    onChange={setEvSearch}
                    placeholder="Search events by profile name or venue location..."
                  />
                  <select
                    className="toolbar-dropdown"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Published">Published Only</option>
                    <option value="Draft">Drafts Only</option>
                  </select>
                </div>
                {evError && <div className="form-error-banner">{evError}</div>}
                {evLoading ? (
                  <p className="view-subtitle">Loading your events...</p>
                ) : (
                  <EventTable
                    events={events}
                    onPublish={publishEvent}
                    onCancel={cancelEvent}
                  />
                )}
              </>
            )}

            {currentTab === "staff" && (
              <>
                <div className="content-header">
                  <div>
                    <h2 className="view-title">My Staff Roster</h2>
                    <p className="view-subtitle">
                      Manage your staff and the events they are allowed to scan.
                    </p>
                  </div>
                  <Link to="/organizer/staff" className="btn-primary-header">
                    Create or manage staff
                  </Link>
                </div>
                {staffError && (
                  <p role="alert" className="form-error-banner">
                    {staffError}
                  </p>
                )}
                {staffLoading ? (
                  <p className="view-subtitle">Loading staff...</p>
                ) : (
                  <StaffTable staff={staff} />
                )}
              </>
            )}

            {currentTab === "attendees" && (
              <>
                <div className="content-header">
                  <div>
                    <h2 className="view-title">Customers &amp; Purchases</h2>
                    <p className="view-subtitle">
                      Track ticket sales and customers across your events.
                    </p>
                  </div>
                </div>
                <div className="metrics-grid">
                  <StatCard
                    title="Total Attendees"
                    value={totalAttendees}
                    icon="🎟️"
                    color="#3b82f6"
                  />
                  <StatCard
                    title="Checked In"
                    value={checkedInCount}
                    icon="✓"
                    color="#10b981"
                  />
                  <StatCard
                    title="Attendance Rate"
                    value={`${Math.round((checkedInCount / (totalAttendees || 1)) * 100)}%`}
                    icon="📊"
                    color="#a855f7"
                  />
                </div>
                <div className="filter-toolbar">
                  <SearchBar
                    value={atSearch}
                    onChange={setAtSearch}
                    placeholder="Search by customer, email, event or ticket..."
                  />
                  <select
                    className="toolbar-dropdown"
                    value={atEventId}
                    onChange={(e) => setAtEventId(e.target.value)}
                  >
                    <option value="all">All Events</option>
                    {eventOptions.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title}
                      </option>
                    ))}
                  </select>
                  <select
                    className="toolbar-dropdown"
                    value={atTicketType}
                    onChange={(e) => setAtTicketType(e.target.value)}
                  >
                    <option value="all">All Ticket Types</option>
                    {ticketTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="split-view-layout">
                  <div className="split-table-side">
                    {attendeeLoading ? (
                      <p className="view-subtitle">
                        Loading ticket purchases...
                      </p>
                    ) : attendeeError ? (
                      <div role="alert" className="form-error-banner">
                        {attendeeError}
                      </div>
                    ) : (
                      <AttendeeTable attendees={attendees} />
                    )}
                  </div>
                  <div className="split-analytics-side">
                    <SalesChart events={events} />
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
