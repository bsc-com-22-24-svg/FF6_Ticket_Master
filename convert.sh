#!/usr/bin/env bash
set -e

echo "→ Creating shared Event type"
cat > src/types/event.ts << 'EOF'
export interface Event {
  id: number
  title: string
  category: string
  city: string
  venue: string
  date: string
  price: number
  image: string
}
EOF

echo "→ Typing mocks"
cat > src/mocks/delay.ts << 'EOF'
export const withDelay = <T>(data: T, ms = 500): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms))
EOF

cat > src/mocks/events.ts << 'EOF'
import type { Event } from '../types/event'

export const events: Event[] = [
  {
    id: 1,
    title: 'Lake of Stars Live',
    category: 'Festivals',
    city: 'Mangochi',
    venue: 'Cape Maclear Beach',
    date: '2026-11-14',
    price: 35000,
    image: '/images/events/event-1.webp',
  },
]
EOF

cat > src/mocks/heroSlides.ts << 'EOF'
export interface HeroSlide {
  image: string
  title: string
  text: string
}

export const heroSlides: HeroSlide[] = [
  { image: '/images/hero/hero-1.png', title: 'Lake of Stars', text: 'Feel the music at the biggest shows in Malawi' },
  { image: '/images/hero/hero-2.webp', title: 'Football Finals', text: 'Never miss a match, book your seat in seconds' },
  { image: '/images/hero/hero-3.webp', title: 'Cultural Festival', text: 'Celebrate music, food and heritage together' },
  { image: '/images/hero/hero-4.webp', title: 'Tech Summit', text: 'Learn, network and grow with experts' },
  { image: '/images/hero/hero-5.jpg', title: 'Community Events', text: 'Discover events happening near you' },
]
EOF

echo "→ Typing landing filters"
cat > src/features/landing/filters.ts << 'EOF'
import type { Event } from '../../types/event'

export const categories = ['All', 'Concerts', 'Sports', 'Festivals', 'Workshops', 'Community']
export const cities = ['All cities', 'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Mangochi']

export const priceOptions = [
  { value: 'any', label: 'Any price' },
  { value: 'free', label: 'Free' },
  { value: 'under10', label: 'Under MK 10,000' },
  { value: 'under20', label: 'Under MK 20,000' },
  { value: 'over20', label: 'MK 20,000 and above' },
]

export const sortOptions = [
  { value: 'date', label: 'Soonest first' },
  { value: 'low', label: 'Price: low to high' },
  { value: 'high', label: 'Price: high to low' },
]

export interface Filters {
  search: string
  category: string
  city: string
  price: string
  sort: string
}

export const defaultFilters: Filters = {
  search: '',
  category: 'All',
  city: 'All cities',
  price: 'any',
  sort: 'date',
}

function matchesPrice(price: number, option: string): boolean {
  if (option === 'free') return price === 0
  if (option === 'under10') return price < 10000
  if (option === 'under20') return price < 20000
  if (option === 'over20') return price >= 20000
  return true
}

export function filterEvents(events: Event[], filters: Filters): Event[] {
  const search = filters.search.trim().toLowerCase()

  return events
    .filter((e) => filters.category === 'All' || e.category === filters.category)
    .filter((e) => filters.city === 'All cities' || e.city === filters.city)
    .filter((e) => matchesPrice(e.price, filters.price))
    .filter((e) =>
      `${e.title} ${e.city} ${e.venue} ${e.category}`.toLowerCase().includes(search),
    )
    .sort((a, b) => {
      if (filters.sort === 'low') return a.price - b.price
      if (filters.sort === 'high') return b.price - a.price
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
}
EOF

echo "→ Typing useEvents hook"
cat > src/features/events/hooks/useEvents.ts << 'EOF'
import { useQuery } from '@tanstack/react-query'
import { events } from '../../../mocks/events'
import { withDelay } from '../../../mocks/delay'
import type { Event } from '../../../types/event'

export function useEvents() {
  return useQuery<Event[]>({
    queryKey: ['events'],
    queryFn: () => withDelay(events),
  })
}
EOF

echo "→ Updating events/index.ts to export useEvents"
cat > src/features/events/index.ts << 'EOF'
export { EventsPage } from './pages/EventsPage';
export { EventDetailsPage } from './pages/EventDetailsPage';
export { useEvents } from './hooks/useEvents';
EOF

echo "→ Typing routes/links"
cat > src/routes/links.ts << 'EOF'
export interface NavLink {
  label: string
  to?: string
  href?: string
  slug?: string
}

export const headerLinks: NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Concerts', slug: 'concerts' },
  { label: 'Events', href: '/#events' },
  { label: 'About', href: '/#about' },
  { label: 'Contact', href: '/#contact' },
]

export const quickLinks: NavLink[] = [
  { label: 'Browse Events', to: '/events' },
  { label: 'Concerts', slug: 'concerts' },
  { label: 'Sports', slug: 'sports' },
  { label: 'Festivals', slug: 'festivals' },
  { label: 'Workshops', slug: 'workshops' },
]

export const organizerLinks: NavLink[] = [
  { label: 'Create Event', to: '/organizer/events/new' },
  { label: 'Pricing & Fees', slug: 'pricing-and-fees' },
  { label: 'Dashboard', to: '/organizer/dashboard' },
  { label: 'Ticket Validation', to: '/scan' },
]

export const legalLinks: NavLink[] = [
  { label: 'Privacy Policy', slug: 'privacy-policy' },
  { label: 'Terms & Conditions', slug: 'terms-and-conditions' },
]
EOF

echo "→ Typing Reveal component"
cat > src/components/Reveal.tsx << 'EOF'
import { useEffect, useRef, type ReactNode, type CSSProperties } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  className?: string
}

export default function Reveal({ children, delay = 0, className = '' }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible')
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const style = { '--d': `${delay}ms` } as CSSProperties

  return (
    <div ref={ref} style={style} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
EOF

echo "→ Typing SiteLink component"
cat > src/components/SiteLink.tsx << 'EOF'
import { Link } from '@tanstack/react-router'
import type { NavLink } from '../routes/links'

interface SiteLinkProps {
  item: NavLink
  className?: string
  onClick?: () => void
}

export default function SiteLink({ item, className, onClick }: SiteLinkProps) {
  if (item.slug) {
    return (
      <a href={`#${item.slug}`} className={className} onClick={onClick}>
        {item.label}
      </a>
    )
  }
  if (item.to) {
    return (
      <Link to={item.to} className={className} onClick={onClick}>
        {item.label}
      </Link>
    )
  }
  return (
    <a href={item.href} className={className} onClick={onClick}>
      {item.label}
    </a>
  )
}
EOF

echo "→ Typing Header component"
cat > src/components/Header.tsx << 'EOF'
import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { headerLinks } from '../routes/links'
import SiteLink from './SiteLink'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <Link
            to="/login"
            className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
          >
            Login
          </Link>
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
          <Link
            to="/login"
            onClick={closeMenu}
            className="mt-2 rounded-full bg-navy py-3 text-center font-semibold text-white"
          >
            Login
          </Link>
        </nav>
      )}
    </header>
  )
}
EOF

echo "→ Typing EventCard"
cat > src/features/landing/components/EventCard.tsx << 'EOF'
import { Link } from '@tanstack/react-router'
import { Calendar, MapPin } from 'lucide-react'
import type { Event } from '../../../types/event'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const date = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const price = event.price === 0 ? 'Free' : `MK ${event.price.toLocaleString()}`

  return (
    <Link
      to="/events/$eventId"
      params={{ eventId: String(event.id) }}
      className="group block overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-2xl"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
        />
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy">
          {event.category}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold group-hover:text-navy">{event.title}</h3>
        <p className="mt-2 flex items-center gap-2 text-sm">
          <Calendar size={15} /> {date}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm">
          <MapPin size={15} /> {event.venue}, {event.city}
        </p>
        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-lg font-extrabold text-navy">{price}</span>
          <span className="text-sm font-semibold text-navy">View event →</span>
        </div>
      </div>
    </Link>
  )
}
EOF

echo "→ Typing EventsSection"
cat > src/features/landing/components/EventsSection.tsx << 'EOF'
import { useEvents } from '../../events'
import { filterEvents, type Filters } from '../filters'
import EventCard from './EventCard'
import Reveal from '../../../components/Reveal'

interface EventsSectionProps {
  filters: Filters
}

export default function EventsSection({ filters }: EventsSectionProps) {
  const { data: events = [], isLoading, isError } = useEvents()
  const visibleEvents = filterEvents(events, filters)

  return (
    <section id="events" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-navy">Upcoming</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Featured Events</h2>
          <p className="mt-3">
            {isLoading ? 'Loading events...' : `${visibleEvents.length} event(s) found`}
          </p>
        </Reveal>

        {isLoading && (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        )}

        {isError && (
          <p className="mt-10 text-center text-red-600">
            Could not load the events. Please try again.
          </p>
        )}

        {!isLoading && visibleEvents.length === 0 && (
          <p className="mt-10 rounded-2xl bg-slate-50 p-10 text-center">
            No events match your search. Try changing the filters.
          </p>
        )}

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEvents.map((event, i) => (
            <Reveal key={event.id} delay={(i % 3) * 100}>
              <EventCard event={event} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
EOF

echo "→ Typing HeroSlider"
cat > src/features/landing/components/HeroSlider.tsx << 'EOF'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { heroSlides } from '../../../mocks/heroSlides'
import SearchBar from './SearchBar'
import type { Filters } from '../filters'

interface HeroSliderProps {
  filters: Filters
  setFilters: (f: Filters) => void
}

export default function HeroSlider({ filters, setFilters }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = heroSlides.length

  const goTo = (index: number) => setCurrent((index + total) % total)

  useEffect(() => {
    const timer = setTimeout(() => goTo(current + 1), 6000)
    return () => clearTimeout(timer)
  }, [current])

  const arrowStyle =
    'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 sm:flex'

  return (
    <section className="relative min-h-screen bg-navy-dark">
      <div className="absolute inset-0 overflow-hidden">
        {heroSlides.map((slide, i) => (
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1500 ${
              i === current ? 'scale-105 opacity-100' : 'scale-100 opacity-0'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-b from-navy-dark/70 via-navy-dark/50 to-navy-dark/80" />
      </div>

      <div className="relative z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 pb-20 pt-28 text-center">
        <div key={current} className="fade-up">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-7xl">
            {heroSlides[current].title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-xl">
            {heroSlides[current].text}
          </p>
        </div>
        <div className="mt-10 w-full">
          <SearchBar filters={filters} setFilters={setFilters} />
        </div>
      </div>

      <button aria-label="Previous slide" onClick={() => goTo(current - 1)} className={`${arrowStyle} left-4`}>
        <ChevronLeft />
      </button>
      <button aria-label="Next slide" onClick={() => goTo(current + 1)} className={`${arrowStyle} right-4`}>
        <ChevronRight />
      </button>

      <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            aria-label={`Slide ${i + 1}`}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </section>
  )
}
EOF

echo "→ Typing About"
cat > src/features/landing/components/About.tsx << 'EOF'
import { Search, ShieldCheck, QrCode, TrendingUp } from 'lucide-react'
import Reveal from '../../../components/Reveal'

const features = [
  { icon: Search, title: 'Discover events', text: 'Find concerts, sports, workshops and gatherings near you.' },
  { icon: ShieldCheck, title: 'Safe booking', text: 'Clear prices and a reliable proof of purchase.' },
  { icon: QrCode, title: 'QR tickets', text: 'Get a digital ticket and enter with one scan.' },
  { icon: TrendingUp, title: 'Organizer tools', text: 'Create events and watch your sales live.' },
]

export default function About() {
  return (
    <section id="about" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-navy">About Ticket Master</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">One simple place for every event</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Events need good ticketing to control capacity, track attendance and manage entry. Ticket Master replaces manual
            registration and scattered tools with one platform.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy">
                  <f.icon size={24} />
                </div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
EOF

echo "→ Typing Organizers"
cat > src/features/landing/components/Organizers.tsx << 'EOF'
import { Link } from '@tanstack/react-router'
import { CalendarPlus, TrendingUp, ScanLine } from 'lucide-react'
import Reveal from '../../../components/Reveal'

const perks = [
  { icon: CalendarPlus, title: 'Create in minutes', text: 'Add your event, set the price and publish it.' },
  { icon: TrendingUp, title: 'Track your sales', text: 'See tickets sold and money earned in real time.' },
  { icon: ScanLine, title: 'Easy entry', text: 'Scan the QR code at the door to confirm every ticket.' },
]

export default function Organizers() {
  return (
    <section
      id="organizers"
      className="relative bg-navy-dark bg-cover bg-center py-24"
      style={{ backgroundImage: "url('/images/organizers-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-navy-dark/60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-navy-100">For event organizers</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Hosting an event? Sell your tickets with us
          </h2>
          <p className="mt-4 text-lg text-slate-200">
            Stop using forms and manual registration. Create your event, set your prices and let people book online.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {perks.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm">
                <p.icon size={28} />
                <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 text-center">
          <Link
            to="/organizer/dashboard"
            className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-navy-dark shadow-lg hover:bg-navy-50"
          >
            Create an event
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
EOF

echo "→ Typing SearchBar"
cat > src/features/landing/components/SearchBar.tsx << 'EOF'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useEvents } from '../../events'
import {
  categories,
  cities,
  priceOptions,
  sortOptions,
  defaultFilters,
  filterEvents,
  type Filters,
} from '../filters'

const selectStyle =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-navy'

interface HighlightProps {
  text: string
  word: string
}

function Highlight({ text, word }: HighlightProps) {
  const start = text.toLowerCase().indexOf(word.toLowerCase())
  if (!word || start === -1) return <>{text}</>
  const end = start + word.length
  return (
    <>
      {text.slice(0, start)}
      <b className="text-navy">{text.slice(start, end)}</b>
      {text.slice(end)}
    </>
  )
}

interface SearchBarProps {
  filters: Filters
  setFilters: (f: Filters) => void
}

type OpenBox = 'none' | 'filters' | 'results'

export default function SearchBar({ filters, setFilters }: SearchBarProps) {
  const [openBox, setOpenBox] = useState<OpenBox>('none')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { data: events = [] } = useEvents()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapperRef.current && !wrapperRef.current.contains(target)) setOpenBox('none')
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const update = (name: keyof Filters, value: string) => setFilters({ ...filters, [name]: value })

  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    update('search', e.target.value)
    setOpenBox(e.target.value.trim() ? 'results' : 'none')
  }

  const activeCount = (['category', 'city', 'price'] as const).filter(
    (name) => filters[name] !== defaultFilters[name],
  ).length

  const matches = filterEvents(events, filters)
  const word = filters.search.trim()

  const goToEvents = () => {
    setOpenBox('none')
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goToEvents()
        }}
        className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-2xl"
      >
        <Search size={20} className="shrink-0 text-slate-400" />
        <input
          value={filters.search}
          onChange={handleTyping}
          placeholder="Search concerts, sports, workshops..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-700 outline-none sm:text-base"
        />

        <button
          type="button"
          aria-label="Filters"
          onClick={() => setOpenBox(openBox === 'filters' ? 'none' : 'filters')}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            openBox === 'filters' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'
          }`}
        >
          <SlidersHorizontal size={20} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-dark text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <button
          type="submit"
          className="hidden h-11 rounded-full bg-navy px-6 text-sm font-semibold text-white hover:bg-navy-dark sm:block"
        >
          Search
        </button>
      </form>

      {openBox === 'results' && (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-2 text-left shadow-2xl">
          {matches.length === 0 && <p className="p-4 text-sm">No events found for "{word}"</p>}

          {matches.slice(0, 5).map((event) => (
            <Link
              key={event.id}
              to="/events/$eventId"
              params={{ eventId: String(event.id) }}
              onClick={() => setOpenBox('none')}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-navy-50"
            >
              <img src={event.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <span>
                <span className="block font-semibold text-slate-700">
                  <Highlight text={event.title} word={word} />
                </span>
                <span className="text-xs">
                  {event.category} · {event.city}
                </span>
              </span>
            </Link>
          ))}

          {matches.length > 0 && (
            <button
              onClick={goToEvents}
              className="w-full rounded-xl p-3 text-sm font-semibold text-navy hover:bg-navy-50"
            >
              See all {matches.length} result(s)
            </button>
          )}
        </div>
      )}

      {openBox === 'filters' && (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-5 text-left shadow-2xl">
          <p className="text-sm font-semibold text-navy-dark">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => update('category', c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  filters.category === c ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-navy-dark">
              City
              <select value={filters.city} onChange={(e) => update('city', e.target.value)} className={selectStyle}>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-navy-dark">
              Price
              <select value={filters.price} onChange={(e) => update('price', e.target.value)} className={selectStyle}>
                {priceOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-navy-dark">
              Sort by
              <select value={filters.sort} onChange={(e) => update('sort', e.target.value)} className={selectStyle}>
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setFilters(defaultFilters)}
              className="text-sm font-semibold text-slate-500 hover:text-navy"
            >
              Reset all
            </button>
            <button
              onClick={goToEvents}
              className="rounded-full bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              Show {matches.length} event(s)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
EOF

echo "→ Typing HomePage"
cat > src/features/landing/pages/HomePage.tsx << 'EOF'
import { useState } from 'react'
import { defaultFilters, type Filters } from '../filters'
import HeroSlider from '../components/HeroSlider'
import About from '../components/About'
import EventsSection from '../components/EventsSection'
import Organizers from '../components/Organizers'

export default function HomePage() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  return (
    <>
      <HeroSlider filters={filters} setFilters={setFilters} />
      <About />
      <EventsSection filters={filters} />
      <Organizers />
    </>
  )
}
EOF

cat > src/features/landing/index.ts << 'EOF'
export { default as HomePage } from './pages/HomePage'
EOF

echo "→ Removing old .jsx / .js versions"
git rm -q src/components/Reveal.jsx
git rm -q src/components/SiteLink.jsx
git rm -q src/features/events/hooks/useEvents.js
git rm -q src/features/landing/components/About.jsx
git rm -q src/features/landing/components/EventCard.jsx
git rm -q src/features/landing/components/EventsSection.jsx
git rm -q src/features/landing/components/HeroSlider.jsx
git rm -q src/features/landing/components/Organizers.jsx
git rm -q src/features/landing/components/SearchBar.jsx
git rm -q src/features/landing/filters.js
git rm -q src/features/landing/index.js
git rm -q src/features/landing/pages/HomePage.jsx
git rm -q src/mocks/delay.js
git rm -q src/mocks/events.js
git rm -q src/mocks/heroSlides.js
git rm -q src/routes/links.js

echo "→ Staging new files"
git add src/types/event.ts
git add src/components/Reveal.tsx src/components/SiteLink.tsx
git add src/features/events/hooks/useEvents.ts src/features/events/index.ts
git add src/features/landing/components/*.tsx src/features/landing/filters.ts src/features/landing/index.ts src/features/landing/pages/HomePage.tsx
git add src/mocks/*.ts src/routes/links.ts

echo "✅ Done. Now run: npm run build 2>&1 | head -40"
