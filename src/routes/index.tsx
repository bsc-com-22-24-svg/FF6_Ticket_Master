import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router';
import { AppLayout } from '../components/AppLayout';
import { LoginPage, requireAuth } from '../features/authentication';
import { EventsPage, EventDetailsPage } from '../features/events';
import { CheckoutPage, PaymentReturnPage } from '../features/checkout';
import { MyTicketsPage, BookingHistoryPage, TicketDetailPage } from '../features/tickets';
import { ScannerPage } from '../features/validation';
import { OrganizerDashboardPage, CreateEventPage, StaffManagementPage } from '../features/organizer';
import { OrganizerKycPage } from '../features/organizer/pages/OrganizerKycPage';
import { AdminDashboardPage } from '../features/admin/pages/AdminDashboardPage';
import { HomePage } from '../features/landing'
import { validateEventSearch } from '../features/landing/filters';
import NotFoundPage from '../components/NotFoundPage';
import type { ComponentType } from 'react';

const rootRoute = createRootRoute({
  component: AppLayout,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-navy-dark">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-600">
        {error instanceof Error ? error.message : 'Unexpected error.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-full bg-navy px-6 py-2 font-semibold text-white hover:bg-navy-dark"
      >
        Try again
      </button>
    </div>
  ),
});

const page = <P extends string>(path: P, component: ComponentType<any>, beforeLoad?: ReturnType<typeof requireAuth>) => createRoute({ getParentRoute: () => rootRoute, path, component: component as any, beforeLoad });

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  validateSearch: validateEventSearch,
});
const eventsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/events',
  component: EventsPage,
  validateSearch: validateEventSearch,
});
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
  eventsRoute,
  page('/events/$eventId', EventDetailsPage),
  page('/checkout/return', PaymentReturnPage, requireAuth('customer')), // PayChangu sends customers back here
  page('/checkout/$eventId', CheckoutPage, requireAuth('customer')),
  page('/tickets', MyTicketsPage, requireAuth('customer')),         // <-- Added base tickets route
  page('/tickets/$ticketId', TicketDetailPage, requireAuth('customer')), // <-- Kept specific route
  page('/bookings', BookingHistoryPage, requireAuth('customer')),
  page('/organizer/kyc', OrganizerKycPage, requireAuth('organizer')),
  page('/organizer/dashboard', OrganizerDashboardPage, requireAuth('organizer')),
  page('/organizer/events/new', CreateEventPage, requireAuth('organizer')),
  page('/organizer/events/$eventId/edit', CreateEventPage, requireAuth('organizer')),
  page('/organizer/staff', StaffManagementPage, requireAuth('organizer')),
  page('/admin', AdminDashboardPage, requireAuth('admin')),
  page('/scan', ScannerPage, requireAuth('staff')),
  notFoundRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register { router: typeof router; }
}
