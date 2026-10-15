import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'
import { CheckoutPage } from '../features/checkout'
import { ScannerPage } from '../features/validation'

const rootRoute = createRootRoute({ component: AppLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: CheckoutPage,
})

const checkoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/checkout',
  component: CheckoutPage,
})

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: ScannerPage,
})

const routeTree = rootRoute.addChildren([indexRoute, checkoutRoute, scanRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
