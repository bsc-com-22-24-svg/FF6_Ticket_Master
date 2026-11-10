import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { EventForm } from '../components/EventForm';
import { useEvents } from '../hooks/useEventStats';
import type { NewEventInput } from '../../../lib/backendOrganizer';

interface CreateEventPageProps {
  onEventCreated: (event: NewEventInput) => Promise<void> | void;
  onCancel: () => void;
}

export const CreateEventPage: React.FC<CreateEventPageProps> = ({ onEventCreated, onCancel }) => {
  return (
    <div className="page-content-wrapper">
      <div className="content-header">
        <div>
          <h2 className="view-title">Schedule New Event</h2>
          <p className="view-subtitle">Populate definitions to post directly onto Ticket Panel frameworks.</p>
        </div>
      </div>
      <div className="card-body-frame">
        <EventForm onSubmit={onEventCreated} onCancel={onCancel} />
      </div>
    </div>
  );
};

export function CreateEventRoute() {
  const navigate = useNavigate();
  const { addEvent } = useEvents();

  const goToDashboard = () => {
    void navigate({ to: '/organizer/dashboard' });
  };

  return (
    <CreateEventPage
      onEventCreated={async (event) => {
        await addEvent(event);
        goToDashboard();
      }}
      onCancel={goToDashboard}
    />
  );
}
