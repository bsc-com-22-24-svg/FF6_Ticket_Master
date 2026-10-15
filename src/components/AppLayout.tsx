import { Link, Outlet } from '@tanstack/react-router'
import type { ReactNode } from 'react'

const navLinkClass = 'navlink'
const activeNavLinkClass = 'navlink on'

export function AppLayout(): ReactNode {
  return (
    <div className="win">
      <div className="bar">
        <i />
        <i />
        <i />
        <span className="url">ticket-master.app</span>
      </div>
      <header className="top">
        <b className="l">🎟️ Ticket Master</b>
        <Link to="/events" className={navLinkClass} activeProps={{ className: activeNavLinkClass }}>
  Events
</Link>
        <Link to="/scan" className={navLinkClass} activeProps={{ className: activeNavLinkClass }}>
          Scan tickets
        </Link>
        <span className="sp" />
        <span className="navlink">Log in</span>
        <span className="btn">Register</span>
      </header>
      <div className="pg">
        <Outlet />
      </div>
    </div>
  )
}
