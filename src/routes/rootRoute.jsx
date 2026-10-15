import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import Header from '../components/Header'
export const rootRoute = createRootRoute({
component: () => (
<>
<Header/>
<main>
  <Outlet />
</main>
</>
),
})

export function makeRoute(path, component, options = {}) {
return createRoute({ getParentRoute: () => rootRoute, path, component, ...options })
}