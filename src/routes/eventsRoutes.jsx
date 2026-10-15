import { makeRoute } from './rootRoute'
import { EventsPage, EventDetailsPage } from '../features/events'

export const eventsRoutes = [
  makeRoute('/events', EventsPage),
  makeRoute('/events/$eventId', EventDetailsPage),
]
