import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AppLayout } from '../components/AppLayout';
import { LoginPage, requireAuth, requireVerifiedOrganizer } from '../features/authentication';
import { EventsPage, EventDetailsPage } from '../features/events';
import { CheckoutPage, PaymentReturnPage } from '../features/checkout';
import { MyTicketsPage, BookingHistoryPage } from '../features/tickets';
import { ScannerPage } from '../features/validation';
import { OrganizerDashboardPage, CreateEventPage } from '../features/organizer';
import { HomePage } from '../features/landing'
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import NotFoundPage from '../components/NotFoundPage';
import type { ReactNode } from 'react';

const rootRoute = createRootRoute({ component: AppLayout });

const page = <P extends string>(path: P, component: () => ReactNode, beforeLoad?: ReturnType<typeof requireAuth>) => createRoute({ getParentRoute: () => rootRoute, path, component, beforeLoad });

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', component: HomePage });
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({ redirect: typeof search.redirect === 'string' ? search.redirect : undefined }),
});
const notFoundRoute = createRoute({ getParentRoute: () => rootRoute, path: '*', component: NotFoundPage })

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  page('/events', EventsPage),
  page('/events/$eventId', EventDetailsPage),
  page('/checkout/return', PaymentReturnPage, requireAuth('customer')), // PayChangu sends customers back here
  page('/checkout/$eventId', CheckoutPage, requireAuth('customer')),
  page('/tickets', MyTicketsPage, requireAuth('customer')),         // <-- Added base tickets route
  page('/tickets/$ticketId', MyTicketsPage, requireAuth('customer')), // <-- Kept specific route
  page('/bookings', BookingHistoryPage, requireAuth('customer')),
  page('/organizer/dashboard', OrganizerDashboardPage, requireAuth('organizer')),
  page('/organizer/events/new', CreateEventPage, requireVerifiedOrganizer()),
  page('/organizer/events/$eventId/edit', CreateEventPage, requireVerifiedOrganizer()),
  page('/admin', AdminDashboardPage, requireAuth('admin')),
  page('/scan', ScannerPage, requireAuth('staff')),
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
