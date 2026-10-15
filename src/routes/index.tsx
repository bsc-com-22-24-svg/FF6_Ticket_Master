import { createRootRoute, createRoute, createRouter, redirect } from '@tanstack/react-router';
import { AppLayout } from '../components/AppLayout';
import { LoginPage, requireAuth } from '../features/authentication';
import { EventsPage, EventDetailsPage } from '../features/events';
import { CheckoutPage } from '../features/checkout';
import { MyTicketsPage, BookingHistoryPage } from '../features/tickets';
import { ScannerPage } from '../features/validation';
import { OrganizerDashboardPage, CreateEventPage } from '../features/organizer';
import type { ReactNode } from 'react';

const rootRoute = createRootRoute({ component: AppLayout });

const page = <P extends string>(
  path: P,
  component: () => ReactNode,
  beforeLoad?: ReturnType<typeof requireAuth>,
) => createRoute({ getParentRoute: () => rootRoute, path, component, beforeLoad });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => { throw redirect({ to: '/events' }); },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  page('/events', EventsPage),
  page('/events/$eventId', EventDetailsPage),
  // customer
  page('/checkout/$eventId', CheckoutPage, requireAuth('customer')),
  page('/tickets/$ticketId', MyTicketsPage, requireAuth('customer')),
  page('/bookings', BookingHistoryPage, requireAuth('customer')),
  // organizer
  page('/organizer/dashboard', OrganizerDashboardPage, requireAuth('organizer')),
  page('/organizer/events/new', CreateEventPage, requireAuth('organizer')),
  page('/organizer/events/$eventId/edit', CreateEventPage, requireAuth('organizer')),
  // staff
  page('/scan', ScannerPage, requireAuth('staff')),
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}