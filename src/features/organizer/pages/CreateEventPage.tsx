import React from 'react';
import { EventForm } from '../components/EventForm';
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
