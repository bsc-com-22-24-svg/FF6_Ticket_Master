import { fromPrice, type Event } from '../../types/event'

export const categories = ['All', 'Concerts', 'Sports', 'Festivals', 'Workshops', 'Community']
export const cities = ['All cities', 'Lilongwe', 'Blantyre', 'Mzuzu', 'Zomba', 'Mangochi', 'Salima']

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

// The URL only carries non-default filters, so links stay short and readable.
export type EventSearch = Partial<Filters>

const priceValues = priceOptions.map((option) => option.value)
const sortValues = sortOptions.map((option) => option.value)

function picked(value: unknown, allowed: readonly string[]): string | undefined {
  return typeof value === 'string' && allowed.includes(value) ? value : undefined
}

// validateSearch for both `/` and `/events`. Unknown or invalid values are
// dropped, which makes them fall back to the defaults instead of breaking.
export function validateEventSearch(raw: Record<string, unknown>): EventSearch {
  const search: EventSearch = {}

  if (typeof raw.search === 'string' && raw.search !== '') {
    search.search = raw.search
  }

  const category = picked(raw.category, categories)
  if (category && category !== defaultFilters.category) search.category = category

  const city = picked(raw.city, cities)
  if (city && city !== defaultFilters.city) search.city = city

  const price = picked(raw.price, priceValues)
  if (price && price !== defaultFilters.price) search.price = price

  const sort = picked(raw.sort, sortValues)
  if (sort && sort !== defaultFilters.sort) search.sort = sort

  return search
}

// Merge partial URL state with the defaults for filtering/sorting.
export function filtersFromSearch(search: EventSearch): Filters {
  return {
    search: search.search ?? defaultFilters.search,
    category: search.category ?? defaultFilters.category,
    city: search.city ?? defaultFilters.city,
    price: search.price ?? defaultFilters.price,
    sort: search.sort ?? defaultFilters.sort,
  }
}

// Turn the full filter state back into a clean search object.
export function searchFromFilters(filters: Filters): EventSearch {
  const search: EventSearch = {}
  if (filters.search !== '') search.search = filters.search
  if (filters.category !== defaultFilters.category) search.category = filters.category
  if (filters.city !== defaultFilters.city) search.city = filters.city
  if (filters.price !== defaultFilters.price) search.price = filters.price
  if (filters.sort !== defaultFilters.sort) search.sort = filters.sort
  return search
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
    .filter((e) => matchesPrice(fromPrice(e), filters.price))
    .filter((e) =>
      `${e.title} ${e.city} ${e.venue} ${e.category}`.toLowerCase().includes(search),
    )
    .sort((a, b) => {
      if (filters.sort === 'low') return fromPrice(a) - fromPrice(b)
      if (filters.sort === 'high') return fromPrice(b) - fromPrice(a)
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
}
