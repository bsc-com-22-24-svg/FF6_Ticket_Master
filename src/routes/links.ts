export interface NavLink {
  label: string
  to?: string
  href?: string
  slug?: string
}

export const headerLinks: NavLink[] = [
  { label: 'Home', to: '/' },
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
