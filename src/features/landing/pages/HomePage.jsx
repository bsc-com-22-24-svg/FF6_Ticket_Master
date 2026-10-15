import { useState } from 'react'
import { defaultFilters } from '../filters'
import HeroSlider from '../components/HeroSlider'


 export default function HomePage() {
  const [filters, setFilters] = useState(defaultFilters)
  return (
    <>
      <HeroSlider filters={filters} setFilters={setFilters}/>
    </>
  )
}

 
