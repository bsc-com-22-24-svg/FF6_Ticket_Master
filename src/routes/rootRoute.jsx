import { createRootRoute, createRoute, Outlet } from '@tanstack/react-router'

export const rootRoute = createRootRoute({
component: () => (
<>
<main>
<Outlet />
</main>
</>
),
})

export function makeRoute(path, component, options = {}) {
return createRoute({ getParentRoute: () => rootRoute, path, component, ...options })
}