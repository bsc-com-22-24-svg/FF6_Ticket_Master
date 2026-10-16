import { useState } from 'react'
import { defaultFilters } from '../filters'
import HeroSlider from '../components/HeroSlider'
import About from '../components/About'
import EventsSection from '../components/EventsSection'

 export default function HomePage() {
  const [filters, setFilters] = useState(defaultFilters)
  return (
    <>
      <HeroSlider filters={filters} setFilters={setFilters}/>
      <About />
      <EventsSection filters={filters} />
    </>
  )
}

 
