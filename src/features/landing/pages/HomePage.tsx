import { useNavigate, useSearch } from '@tanstack/react-router'
import { filtersFromSearch, searchFromFilters, type Filters } from '../filters'
import HeroSlider from '../components/HeroSlider'
import About from '../components/About'
import EventsSection from '../components/EventsSection'
import Organizers from '../components/Organizers'
import Contact from '../components/Contact'
import { useAuth } from '../../authentication/useAuth'

export default function HomePage() {
  const { user } = useAuth()
  const showPublicLanding = !user || user.role === 'customer'
  const search = useSearch({ from: '/' })
  const navigate = useNavigate()
  const filters = filtersFromSearch(search)

  // Typing replaces the history entry so the typeahead does not spam Back.
  function setFilters(next: Filters, options?: { replace?: boolean }) {
    navigate({ to: '/', search: searchFromFilters(next), replace: options?.replace })
  }

  // Committing the search carries the same filters to the full catalogue.
  function showAll(next: Filters) {
    navigate({ to: '/events', search: searchFromFilters(next) })
  }

  return (
    <>
      {showPublicLanding && (
        <>
          <HeroSlider filters={filters} setFilters={setFilters} onShowAll={showAll} />
          <About />
          <EventsSection filters={filters} />
          <Organizers />
        </>
      )}
      <Contact />
    </>
  )
}
