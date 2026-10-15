import { useEvents } from '../../events'
import { filterEvents } from '../filters'
import EventCard from './EventCard'
import Reveal from '../../../components/Reveal'

// Gets the events with TanStack Query, filters them and shows the cards
export default function EventsSection({ filters }) {
  const { data: events = [], isLoading, isError } = useEvents()

  // only the events that match the search + filters
  const visibleEvents = filterEvents(events, filters)

  return (
    <section id="events" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-navy">Upcoming</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Featured Events</h2>
          <p className="mt-3">{isLoading ? 'Loading events...' : `${visibleEvents.length} event(s) found`}</p>
        </Reveal>

        {/* loading boxes */}
        {isLoading && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => <div key={n} className="h-80 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        )}

        {isError && <p className="mt-10 text-center text-red-600">Could not load the events. Please try again.</p>}

        {!isLoading && visibleEvents.length === 0 && (
          <p className="mt-10 rounded-2xl bg-slate-50 p-10 text-center">No events match your search. Try changing the filters.</p>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event, i) => (
            <Reveal key={event.id} delay={(i % 3) * 100}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
