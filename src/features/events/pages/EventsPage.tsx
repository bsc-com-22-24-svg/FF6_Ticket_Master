import { useState } from 'react'
import { defaultFilters, filterEvents, type Filters } from '../../landing/filters'
import { useEvents } from '../hooks/useEvents'
import EventCard from '../../landing/components/EventCard'
import SearchBar from '../../landing/components/SearchBar'
import Reveal from '../../../components/Reveal'

export function EventsPage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  const { data: events = [], isLoading, isError } = useEvents()
  const visibleEvents = filterEvents(events, filters)

  return (
    <div className="min-h-screen">
      <section className="bg-navy-50 py-12 pt-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Reveal>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Discover Events</h1>
            <p className="mt-2">
              {isLoading ? 'Loading events...' : `${visibleEvents.length} event(s) found`}
            </p>
          </Reveal>

          <div className="mt-8">
            <SearchBar filters={filters} setFilters={setFilters} />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
              ))}
            </div>
          )}

          {isError && (
            <p className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
              Could not load events. Please try again.
            </p>
          )}

          {!isLoading && visibleEvents.length === 0 && (
            <p className="rounded-2xl bg-slate-50 p-10 text-center">
              No events match your search. Try adjusting the filters.
            </p>
          )}

          {!isLoading && visibleEvents.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEvents.map((event, i) => (
                <Reveal key={event.id} delay={(i % 3) * 100}>
                  <EventCard event={event} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
