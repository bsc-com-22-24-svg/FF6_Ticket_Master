import { Link } from '@tanstack/react-router'
import { MapPin, Phone, Mail } from 'lucide-react'
import { quickLinks, organizerLinks, legalLinks } from '../routes/links'
import SiteLink from './SiteLink'

const linkStyle = 'block py-1 text-sm text-slate-300 hover:text-white'

// Footer with a blue background picture (public/images/footer-bg.jpg)
export default function Footer() {
  return (
    <footer className="bg-navy-dark bg-cover bg-center text-slate-300" style={{ backgroundImage: "url('/images/footer-bg.jpg')" }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pt-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {/* about */}
        <div>
          <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-amber-300"> Tic-EM</Link>
          <p className="mt-4 text-sm leading-relaxed">
            A simple ticketing platform for concerts, sports, workshops and community events. Find an event, book, and enter with a QR ticket.
          </p>
          <div className="mt-5 flex gap-3">
            {/* social buttons (letters for now - put real icons/links here later) */}
            {['f', 'ig', 'x'].map((name) => (
              <span key={name} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold uppercase hover:bg-white/20">{name}</span>
            ))}
          </div>
        </div>

        {/* quick links */}
        <div>
          <h4 className="text-lg font-bold text-white">Quick Links</h4>
          <div className="mt-3">
            {quickLinks.map((item) => <SiteLink key={item.label} item={item} className={linkStyle} />)}
          </div>
        </div>

        {/* organizers */}
        <div>
          <h4 className="text-lg font-bold text-white">For Organizers</h4>
          <div className="mt-3">
            {organizerLinks.map((item) => <SiteLink key={item.label} item={item} className={linkStyle} />)}
          </div>
        </div>

        {/* contact */}
        <div>
          <h4 className="text-lg font-bold text-white">Contact Us</h4>
          <ul className="mt-3 space-y-3 text-sm">
            <li className="flex gap-3"><MapPin size={18} className="shrink-0" /> Lilongwe, Central Region, Malawi</li>
            <li className="flex gap-3"><Phone size={18} className="shrink-0" /> +265 999 000 000</li>
            <li className="flex gap-3"><Mail size={18} className="shrink-0" /> support@ticketmaster.mw</li>
          </ul>
        </div>
      </div>

      {/* bottom bar */}
      <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/20 px-4 py-6 text-sm sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} Ticket Master. All rights reserved.</p>
        <div className="flex gap-6 sm:pr-16">
          {legalLinks.map((item) => <SiteLink key={item.label} item={item} className="hover:text-white" />)}
        </div>
      </div>
    </footer>
  )
}
