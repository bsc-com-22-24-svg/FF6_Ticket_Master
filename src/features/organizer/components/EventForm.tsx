import React, { useState } from 'react';
import type { EventItem } from '../Data/Events';

interface EventFormProps {
  onSubmit: (event: Omit<EventItem, 'id' | 'ticketsSold'>) => void;
  onCancel: () => void;
}

export const EventForm: React.FC<EventFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [venue, setVenue] = useState('');
  const [status, setStatus] = useState<'Published' | 'Draft'>('Draft');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !venue) {
      setError('All standard layout fields are required.');
      return;
    }
    setError('');
    onSubmit({ name, date, venue, status });
  };

  return (
    <form className="event-creation-form" onSubmit={handleSubmit}>
      {error && <div className="form-error-banner">{error}</div>}
      
      <div className="form-group">
        <label>Event Title</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Afrobeat Showcase 2026" />
      </div>

      <div className="form-group">
        <label>Date & Time String</label>
        <input type="text" value={date} onChange={(e) => setDate(e.target.value)} placeholder="e.g. Dec 12, 2026 • 8:00 PM" />
      </div>

      <div className="form-group">
        <label>Venue Location</label>
        <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Landmark Centre Arena" />
      </div>

      <div className="form-group">
        <label>Visibility Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}>
          <option value="Draft">Save as Draft</option>
          <option value="Published">Publish Directly</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Create System Event</button>
      </div>
    </form>
  );
};
