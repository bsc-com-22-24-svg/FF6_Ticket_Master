import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {  Menu, X } from 'lucide-react'
import { headerLinks } from '../routes/links'
import SiteLink from './SiteLink'

// Top bar: logo, menu links and login button.
// Phones and tablets (under 1024px) get a hamburger button, PCs see the link names.
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // add a shadow once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className={`fixed inset-x-0 top-0 z-50 bg-white ${scrolled ? 'shadow-md' : 'border-b border-slate-100'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* logo */}
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold  text-amber-300">
           Tic-EM
        </Link>

        {/* PC menu (names) */}
        <nav className="hidden items-center gap-8 lg:flex">
          {headerLinks.map((item) => (
            <SiteLink key={item.label} item={item} className="text-sm font-medium text-slate-600 hover:text-navy" />
          ))}
          <Link to="/login" className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
            Login
          </Link>
        </nav>

        {/* hamburger button (phones and tablets only) */}
        <button aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)} className="text-navy lg:hidden">
          {menuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* mobile menu */}
      {menuOpen && (
        <nav className="flex flex-col border-t bg-white px-4 pb-4 lg:hidden">
          {headerLinks.map((item) => (
            <SiteLink key={item.label} item={item} onClick={closeMenu} className="rounded-lg px-3 py-3 font-medium hover:bg-navy-50" />
          ))}
          <Link to="/login" onClick={closeMenu} className="mt-2 rounded-full bg-navy py-3 text-center font-semibold text-white">
            Login
          </Link>
        </nav>
      )}
    </header>
  )
}
