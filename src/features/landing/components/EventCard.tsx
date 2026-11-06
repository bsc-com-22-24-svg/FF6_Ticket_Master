import { Link } from '@tanstack/react-router'
import { Calendar, MapPin } from 'lucide-react'
import { fromPrice, type Event } from '../../../types/event'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const date = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const from = fromPrice(event)
  const price = from === 0 ? 'Free' : `MK ${from.toLocaleString()}`

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: String(event.id) }}
      className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy">
          {event.category}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold group-hover:text-navy">{event.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Calendar size={15} /> {date}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <MapPin size={15} /> {event.venue}, {event.city}
        </p>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-lg font-extrabold text-navy">{price}</span>
          <span className="text-sm font-semibold text-navy">View event →</span>
        </div>
      </div>
    </Link>
  )
}
