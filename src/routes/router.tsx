import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { AppLayout } from '../components/AppLayout'
import { CheckoutPage } from '../features/checkout'

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

const routeTree = rootRoute.addChildren([indexRoute, checkoutRoute])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
