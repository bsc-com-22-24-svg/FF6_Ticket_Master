import React, { useState } from 'react';
import { totalCapacity, uploadEventImage, type NewEventInput } from '../../../lib/backendOrganizer';
import { DEFAULT_EVENT_IMAGES, resolveEventImage } from '../../../lib/backendEvents';

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
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [rows, setRows] = useState<TicketRow[]>([emptyRow('General')]);
  const [status, setStatus] = useState<'Published' | 'Draft'>('Draft');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState(''); // '' = let the app pick a default
  const [uploading, setUploading] = useState(false);

  const updateRow = (index: number, patch: Partial<TicketRow>) =>
    setRows(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const ticketTypes = rows.map((row) => ({
    name: row.name.trim(),
    price: Number(row.price),
    quantity: Number(row.quantity),
  }));
  const capacity = totalCapacity(ticketTypes.filter((type) => Number.isFinite(type.quantity)));
  const startAt = startDate && startTime ? `${startDate}T${startTime}` : '';
  const endAt = endDate && endTime ? `${endDate}T${endTime}` : '';

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      setImageUrl(await uploadEventImage(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The image could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !venue.trim() || !location.trim() || !startAt || !endAt) {
      setError('Fill in the title, description, venue, city, start date and time, and end date and time.');
      return;
    }
    const startDateTime = new Date(startAt);
    const endDateTime = new Date(endAt);
    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) {
      setError('Enter a valid start and end date and time.');
      return;
    }
    if (endDateTime <= startDateTime) {
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
        startAt: startDateTime.toISOString(),
        endAt: endDateTime.toISOString(),
        ticketTypes,
        status,
        ...(imageUrl ? { imageUrl } : {}),
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
        <label>Event image</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          {imageUrl && (
            <img
              src={resolveEventImage(imageUrl, '0')}
              alt="Selected event"
              style={{ width: 120, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid #1e3a8a' }}
            />
          )}
          {DEFAULT_EVENT_IMAGES.map((src) => (
            <button
              key={src}
              type="button"
              onClick={() => setImageUrl(src)}
              aria-label="Use this default image"
              aria-pressed={imageUrl === src}
              style={{ padding: 0, border: imageUrl === src ? '2px solid #1e3a8a' : '2px solid transparent', borderRadius: 8, background: 'none', cursor: 'pointer' }}
            >
              <img src={src} alt="" style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
            </button>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageFile} disabled={uploading} />
          {uploading && <span>Uploading…</span>}
          {imageUrl && !uploading && (
            <button type="button" onClick={() => setImageUrl('')} style={{ background: 'none', border: 'none', color: '#475569', textDecoration: 'underline', cursor: 'pointer' }}>
              Remove image
            </button>
          )}
        </div>
        <small>Upload your own (JPG, PNG or WEBP, up to 5 MB) or pick a default. If you choose nothing, a default is used.</small>
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
          <label>Start date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Start time</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label>End time</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
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
        <button type="submit" className="btn-primary" disabled={saving || uploading}>{saving ? 'Saving...' : 'Create Event'}</button>
      </div>
    </form>
  );
};


