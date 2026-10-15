import { createRouter } from '@tanstack/react-router'
import { rootRoute } from './rootRoute'
import { landingRoutes } from './landingRoutes'
// Every feature has its own routes file. When you add a new one, list it here.
const allRoutes = [
...landingRoutes,
]
export const router = createRouter({
routeTree: rootRoute.addChildren(allRoutes),
scrollRestoration: true,
})