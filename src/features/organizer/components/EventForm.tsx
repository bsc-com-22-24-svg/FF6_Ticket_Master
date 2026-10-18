import { useEffect, useState } from 'react';
import type { EventInput, EventItem, EventStatus, TicketType } from '../types/Event';

type Props = {
  initialEvent?: EventItem;
  onSubmit: (values: EventInput) => Promise<void> | void;
  isSaving: boolean;
};

const makeTicket = (): TicketType => ({
  id: `ticket-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
  name: 'General Admission',
  price: 0,
  capacity: 100,
});

const empty: EventInput = {
  name: '',
  description: '',
  date: '',
  time: '',
  location: '',
  category: 'Music',
  status: 'Draft',
  ticketTypes: [makeTicket()],
};

export default function EventForm({ initialEvent, onSubmit, isSaving }: Props) {
  const [values, setValues] = useState<EventInput>(empty);
  const [, setImageName] = useState('');

  useEffect(() => {
    if (initialEvent) {
      const { id, name, description, date, time, location, category, imageUrl, status, ticketTypes } =
        initialEvent;
      setValues({
        id,
        name,
        description,
        date,
        time,
        location,
        category,
        imageUrl,
        status,
        ticketTypes: ticketTypes.map((t) => ({ ...t })),
      });
      setImageName(imageUrl ?? '');
    } else {
      setValues({ ...empty, ticketTypes: [makeTicket()] });
      setImageName('');
    }
  }, [initialEvent]);

  function update<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setValues((old) => ({ ...old, [key]: value }));
  }

  function updateTicket(id: string, key: keyof TicketType, value: string | number) {
    setValues((old) => ({
      ...old,
      ticketTypes: old.ticketTypes.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    }));
  }

  function submit(status: EventStatus) {
    void onSubmit({ ...values, status });
  }

  const totalCapacity = values.ticketTypes.reduce((s, t) => s + Number(t.capacity || 0), 0);

  return (
    <form
      className="grid gap-8 lg:grid-cols-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit('Published');
      }}
    >
      <div className="space-y-6 lg:col-span-2">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Event details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="text-sm font-medium">Event name *</span>
              <input
                required
                maxLength={100}
                value={values.name}
                onChange={(e) => update('name', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy"
                placeholder="e.g. Campus Tech Summit 2026"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="text-sm font-medium">Description</span>
              <textarea
                rows={4}
                maxLength={1500}
                value={values.description}
                onChange={(e) => update('description', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy"
                placeholder="What can attendees expect?"
              />
            </label>
            <label>
              <span className="text-sm font-medium">Category *</span>
              <select
                required
                value={values.category}
                onChange={(e) => update('category', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy"
              >
                {['Music', 'Technology', 'Arts & Culture', 'Education', 'Business', 'Sports', 'Community', 'Other'].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              <span className="text-sm font-medium">Location *</span>
              <input
                required
                value={values.location}
                onChange={(e) => update('location', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy"
                placeholder="Venue"
              />
            </label>
            <label>
              <span className="text-sm font-medium">Date *</span>
              <input
                required
                type="date"
                value={values.date}
                onChange={(e) => update('date', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
            </label>
            <label>
              <span className="text-sm font-medium">Start time *</span>
              <input
                required
                type="time"
                value={values.time}
                onChange={(e) => update('time', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-navy"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Ticket types</h2>
          <div className="mt-4 space-y-3">
            {values.ticketTypes.map((t) => (
              <div key={t.id} className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <input
                  aria-label="Ticket name"
                  required
                  value={t.name}
                  onChange={(e) => updateTicket(t.id, 'name', e.target.value)}
                  placeholder="General Admission"
                  className="sm:col-span-5 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                />
                <input
                  aria-label="Price in MWK"
                  required
                  type="number"
                  min={0}
                  value={t.price}
                  onChange={(e) => updateTicket(t.id, 'price', Number(e.target.value))}
                  className="sm:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                />
                <input
                  aria-label="Ticket capacity"
                  required
                  type="number"
                  min={1}
                  value={t.capacity}
                  onChange={(e) => updateTicket(t.id, 'capacity', Number(e.target.value))}
                  className="sm:col-span-3 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-navy"
                />
                <button
                  type="button"
                  disabled={values.ticketTypes.length === 1}
                  onClick={() =>
                    setValues((old) => ({
                      ...old,
                      ticketTypes: old.ticketTypes.filter((x) => x.id !== t.id),
                    }))
                  }
                  className="rounded-xl border px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setValues((old) => ({
                  ...old,
                  ticketTypes: [...old.ticketTypes, { ...makeTicket(), name: '' }],
                }))
              }
              className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              + Add ticket type
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">Total capacity: {totalCapacity.toLocaleString()}</p>
        </section>
      </div>

      <aside>
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold">Publish</h2>
          <p className="mt-2 text-sm text-slate-600">Save as draft or publish this event.</p>
          <div className="mt-6 grid gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => submit('Draft')}
              className="w-full rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-dark disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Publish event'}
            </button>
          </div>
        </section>
      </aside>
    </form>
  );
}
