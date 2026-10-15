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
