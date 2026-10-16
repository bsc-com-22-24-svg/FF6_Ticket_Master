import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'
import Header from '../components/Header'
import Footer from '../components/Footer'
export const rootRoute = createRootRoute({
component: () => (
<>
<Header/>
<main>
  <Outlet />
</main>
<Footer />
</>
),
})

export function makeRoute(path, component, options = {}) {
return createRoute({ getParentRoute: () => rootRoute, path, component, ...options })
}