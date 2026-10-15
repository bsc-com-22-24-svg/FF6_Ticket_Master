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
