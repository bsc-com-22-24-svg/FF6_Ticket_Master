import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { headerLinks } from '../routes/links'
import SiteLink from './SiteLink'
import { useAuth } from '../features/authentication/useAuth'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const closeMenu = () => setMenuOpen(false)
  const handleLogout = () => {
    logout()
    setMenuOpen(false)
    navigate({ to: '/' })
  }

  return (
    <header className={`fixed inset-x-0 top-0 z-50 bg-white ${scrolled ? 'shadow-md' : 'border-b border-slate-100'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-amber-300">
          Tic-EM
        </Link>

        {/* Desktop Nav */}
        <nav aria-label="Main navigation" className="hidden items-center gap-6 lg:flex xl:gap-8">
          {headerLinks.map((item) => (
            <SiteLink key={item.label} item={item} className="text-sm font-medium text-slate-600 hover:text-navy" />
          ))}
          {user ? (
            <div className="flex items-center gap-4 border-l border-slate-200 pl-5">
              <Link to="/bookings" className="text-sm font-medium text-slate-600 hover:text-navy">Bookings</Link>
              {user.role === 'customer' && <Link to="/tickets" className="text-sm font-medium text-slate-600 hover:text-navy">My Tickets</Link>}
              {user.role === 'organizer' && <Link to="/organizer/dashboard" className="text-sm font-medium text-slate-600 hover:text-navy">Dashboard</Link>}
              {user.role === 'staff' && <Link to="/scan" className="text-sm font-medium text-slate-600 hover:text-navy">Scan</Link>}
              {user.role === 'admin' && <Link to="/admin" className="text-sm font-medium text-red-600 hover:text-red-800 font-bold">Admin Panel</Link>}
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-bold uppercase text-navy">
                  {user.name.trim().charAt(0)}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                  <span className="text-[11px] font-medium capitalize text-slate-500">{user.role}</span>
                </span>
              </div>
              <button onClick={handleLogout} className="rounded-full border px-4 py-1.5 text-sm font-semibold hover:bg-slate-50">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark">Login</Link>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button 
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)} 
          className="text-navy lg:hidden"
        >
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Nav */}
      {menuOpen && (
        <nav id="mobile-menu" aria-label="Mobile navigation" className="flex flex-col border-t bg-white px-4 pb-4 lg:hidden">
          {headerLinks.map((item) => (
            <SiteLink key={item.label} item={item} onClick={closeMenu} className="rounded-lg px-3 py-3 font-medium hover:bg-navy-50" />
          ))}
          {user ? (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/bookings" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">Bookings</Link>
              {user.role === 'customer' && <Link to="/tickets" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">My Tickets</Link>}
              {user.role === 'organizer' && <Link to="/organizer/dashboard" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">Dashboard</Link>}
              {user.role === 'staff' && <Link to="/scan" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium hover:bg-navy-50">Scan</Link>}
              {user.role === 'admin' && <Link to="/admin" onClick={closeMenu} className="rounded-lg px-3 py-2 font-medium text-red-600 hover:bg-red-50">Admin Panel</Link>}
              <div className="mt-1 flex items-center gap-2.5 border-t border-slate-100 px-3 pt-3">
                <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-navy-50 text-xs font-bold uppercase text-navy">
                  {user.name.trim().charAt(0)}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                  <span className="text-[11px] font-medium capitalize text-slate-500">{user.role}</span>
                </span>
              </div>
              <button onClick={handleLogout} className="mt-2 rounded-full border py-2 text-center font-semibold hover:bg-slate-50">Logout</button>
            </div>
          ) : (
            <Link to="/login" onClick={closeMenu} className="mt-2 rounded-full bg-navy py-3 text-center font-semibold text-white">Login</Link>
          )}
        </nav>
      )}
    </header>
  )
}
