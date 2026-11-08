import React, { useState } from 'react';
import { totalCapacity, type NewEventInput } from '../../../lib/backendOrganizer';

interface EventFormProps {
  onSubmit: (event: NewEventInput) => Promise<void> | void;
  onCancel: () => void;
}

interface TicketRow {
  name: string;
  price: string;
  quantity: string;
}

const emptyRow = (name = ''): TicketRow => ({ name, price: '', quantity: '' });

export const EventForm: React.FC<EventFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [location, setLocation] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [rows, setRows] = useState<TicketRow[]>([emptyRow('General')]);
  const [status, setStatus] = useState<'Published' | 'Draft'>('Draft');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateRow = (index: number, patch: Partial<TicketRow>) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const ticketTypes = rows.map((row) => ({
    name: row.name.trim(),
    price: Number(row.price),
    quantity: Number(row.quantity),
  }));
  const capacity = totalCapacity(ticketTypes.filter((type) => Number.isFinite(type.quantity)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !venue.trim() || !location.trim() || !startAt || !endAt) {
      setError('Fill in the title, description, venue, city and both dates.');
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      setError('The event must end after it starts.');
      return;
    }
    const badType = ticketTypes.find(
      (type) => !type.name || !(type.price >= 0) || !Number.isInteger(type.quantity) || type.quantity < 1,
    );
    if (badType || rows.some((row) => row.price === '' || row.quantity === '')) {
      setError('Every ticket type needs a name, a price (0 or more) and a whole number of tickets.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await onSubmit({
        name,
        description,
        venue,
        location,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        ticketTypes,
        status,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the event. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="event-creation-form" onSubmit={handleSubmit}>
      {error && <div className="form-error-banner">{error}</div>}

      <div className="form-group">
        <label>Event Title</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Afrobeat Showcase 2026" />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this event about?" />
      </div>

      <div className="form-group">
        <label>Venue</label>
        <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Bingu International Conference Centre" />
      </div>

      <div className="form-group">
        <label>City and country</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Lilongwe, Malawi" />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Starts</label>
          <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Ends</label>
          <input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label>Ticket types (prices in MWK)</label>
        {rows.map((row, index) => (
          <div className="ticket-row" key={index}>
            <input type="text" aria-label="Ticket type name" value={row.name} onChange={(e) => updateRow(index, { name: e.target.value })} placeholder="Name, e.g. VIP" />
            <input type="number" min="0" aria-label="Price" value={row.price} onChange={(e) => updateRow(index, { price: e.target.value })} placeholder="Price" />
            <input type="number" min="1" aria-label="Number of tickets" value={row.quantity} onChange={(e) => updateRow(index, { quantity: e.target.value })} placeholder="How many" />
            {rows.length > 1 && (
              <button type="button" className="btn-action" onClick={() => setRows(rows.filter((_, i) => i !== index))}>Remove</button>
            )}
          </div>
        ))}
        <div className="ticket-row-footer">
          <button type="button" className="btn-action" onClick={() => setRows([...rows, emptyRow()])}>+ Add ticket type</button>
          <span className="form-hint">Total capacity: {capacity.toLocaleString()} tickets</span>
        </div>
      </div>

      <div className="form-group">
        <label>Visibility Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as 'Published' | 'Draft')}>
          <option value="Draft">Save as Draft</option>
          <option value="Published">Publish Directly</option>
        </select>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Create Event'}</button>
      </div>
    </form>
  );
};
