import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { heroSlides } from '../../../mocks/heroSlides'
import SearchBar from './SearchBar'


//  5 pictures that change by themselves
export default function HeroSlider({ filters, setFilters }) {
  const [current, setCurrent] = useState(0)
  const total = heroSlides.length

  const goTo = (index) => setCurrent((index + total) % total)

  // change to the next picture after 6 seconds .....automatic .
  useEffect(() => {
    const timer = setTimeout(() => goTo(current + 1), 6000)
    return () => clearTimeout(timer)
  }, [current])

  const arrowStyle = 'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 sm:flex'

  return (
    <section className="relative min-h-screen bg-navy-dark">
      {/* background pictures */}
      <div className="absolute inset-0 overflow-hidden">
        {heroSlides.map((slide, i) => (
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            className={`absolute inset-0 h-full w-full object-cover transition-all transition-duration: 1500ms ${i === current ? 'scale-105 opacity-100' : 'scale-100 opacity-0'}`}
          />
        ))}
        <div className="absolute inset-0 bg-linear-to-b from-navy-dark/70 via-navy-dark/50 to-navy-dark/80" />
      </div>

      {/* text + search bar */}
      <div className="relative z-20 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-4 pb-20 pt-28 text-center">
        <div key={current} className="fade-up">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl lg:text-7xl">{heroSlides[current].title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-white/85 sm:text-xl">{heroSlides[current].text}</p>
        </div>
        <div className="mt-10 w-full">
          <SearchBar filters={filters} setFilters={setFilters} />
        </div>
      </div>

      {/* arrows */}
      <button aria-label="Previous slide" onClick={() => goTo(current - 1)} className={`${arrowStyle} left-4`}><ChevronLeft /></button>
      <button aria-label="Next slide" onClick={() => goTo(current + 1)} className={`${arrowStyle} right-4`}><ChevronRight /></button>

      {/* dots */}
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
