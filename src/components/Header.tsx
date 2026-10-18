import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { headerLinks } from '../routes/links'
import SiteLink from './SiteLink'
import { useAuth } from '../features/authentication/useAuth'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { user, logout } = useAuth()
  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`fixed inset-x-0 top-0 z-50 bg-white ${scrolled ? 'shadow-md' : 'border-b border-slate-100'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-amber-300">
          Tic-EM
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {headerLinks.map((item) => (
            <SiteLink
              key={item.label}
              item={item}
              className="text-sm font-medium text-slate-600 hover:text-navy"
            />
          ))}
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">{user.name} · {user.role}</span>
              <Link to="/bookings" className="text-sm font-medium text-slate-600 hover:text-navy">Bookings</Link>
              {user.role === 'customer' && <Link to="/tickets/$ticketId" params={{ ticketId: "TKT-2026-001" }} className="text-sm font-medium text-slate-600 hover:text-navy">My Tickets</Link>}
              {user.role === 'organizer' && <Link to="/organizer/dashboard" className="text-sm font-medium text-slate-600 hover:text-navy">Dashboard</Link>}
              {user.role === 'staff' && <Link to="/scan" className="text-sm font-medium text-slate-600 hover:text-navy">Scan</Link>}
              <button onClick={logout} className="rounded-full border px-4 py-1.5 text-sm font-semibold hover:bg-slate-50">Logout</button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              Login
            </Link>
          )}
        </nav>

        <button aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)} className="text-navy lg:hidden">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {menuOpen && (
        <nav className="flex flex-col border-t bg-white px-4 pb-4 lg:hidden">
          {headerLinks.map((item) => (
            <SiteLink
              key={item.label}
              item={item}
              onClick={closeMenu}
              className="rounded-lg px-3 py-3 font-medium hover:bg-navy-50"
            />
          ))}
          {user ? (
            <div className="flex flex-col gap-2 pt-2">
              <span className="px-3 py-1 text-sm text-slate-600">{user.name} · {user.role}</span>
              <Link to="/bookings" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">Bookings</Link>
              {user.role === 'customer' && <Link to="/tickets/$ticketId" params={{ ticketId: "TKT-2026-001" }} onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">My Tickets</Link>}
              {user.role === 'organizer' && <Link to="/organizer/dashboard" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">Dashboard</Link>}
              {user.role === 'staff' && <Link to="/scan" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">Scan</Link>}
              <button onClick={() => { logout(); closeMenu() }} className="mt-2 rounded-full border py-2 text-center font-semibold hover:bg-slate-50">Logout</button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={closeMenu}
              className="mt-2 rounded-full bg-navy py-3 text-center font-semibold text-white"
            >
              Login
            </Link>
          )}
        </nav>
      )}
    </header>
  )
}
