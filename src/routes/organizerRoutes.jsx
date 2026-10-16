import { makeRoute } from './rootRoute'
import { OrganizerPage } from '../features/organizer'

export const organizerRoutes = [
  makeRoute('/organizer', OrganizerPage),
]
