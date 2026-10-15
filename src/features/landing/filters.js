// Options used by the search bar filter panel
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

// what the filters look like before the user touches anything
export const defaultFilters = { search: '', category: 'All', city: 'All cities', price: 'any', sort: 'date' }

// checks if an event price fits the selected price filter
function matchesPrice(price, option) {
  if (option === 'free') return price === 0
  if (option === 'under10') return price < 10000
  if (option === 'under20') return price < 20000
  if (option === 'over20') return price >= 20000
  return true // "any"
}

// Takes all events + the current filters and gives back only the events that match.
// The text search looks at the title, city, venue and category, so it works letter by letter....
export function filterEvents(events, filters) {
  const search = filters.search.trim().toLowerCase()

  return events
    .filter((e) => filters.category === 'All' || e.category === filters.category)
    .filter((e) => filters.city === 'All cities' || e.city === filters.city)
    .filter((e) => matchesPrice(e.price, filters.price))
    .filter((e) => `${e.title} ${e.city} ${e.venue} ${e.category}`.toLowerCase().includes(search))
    .sort((a, b) => {
      if (filters.sort === 'low') return a.price - b.price
      if (filters.sort === 'high') return b.price - a.price
      return new Date(a.date) - new Date(b.date) // soonest first
    })
}
