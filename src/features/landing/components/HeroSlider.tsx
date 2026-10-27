import { useCallback, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import { heroSlides } from '../../../mocks/heroSlides'
import SearchBar from './SearchBar'
import type { Filters } from '../filters'
import { useAutoplay } from '../hooks/useAutoplay'

interface HeroSliderProps {
  filters: Filters
  setFilters: (f: Filters, options?: { replace?: boolean }) => void
  onShowAll?: (filters: Filters) => void
}

export default function HeroSlider({ filters, setFilters, onShowAll }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = heroSlides.length

  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total],
  )

  // Auto-advance stops on hover, keyboard focus, reduced motion, or when the
  // visitor presses pause (WCAG 2.2.2).
  const next = useCallback(() => goTo(current + 1), [goTo, current])
  const { paused, reducedMotion, togglePause, handlers } = useAutoplay(6000, next)

  const arrowStyle =
    'absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/40 sm:flex'

  return (
    <section className="relative min-h-screen bg-navy-dark" {...handlers}>
      <div className="absolute inset-0 overflow-hidden">
        {heroSlides.map((slide, i) => (
          <img
            key={slide.image}
            src={slide.image}
            alt={slide.title}
            aria-hidden={i !== current}
            className={`absolute inset-0 h-full w-full object-cover transition-all duration-1500 motion-reduce:transition-none ${
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
          <SearchBar filters={filters} setFilters={setFilters} onShowAll={onShowAll} />
        </div>
      </div>

      <button aria-label="Previous slide" onClick={() => goTo(current - 1)} className={`${arrowStyle} left-4`}>
        <ChevronLeft />
      </button>
      <button aria-label="Next slide" onClick={() => goTo(current + 1)} className={`${arrowStyle} right-4`}>
        <ChevronRight />
      </button>

      <div className="absolute bottom-6 left-0 right-0 z-10 flex items-center justify-center gap-2">
        {!reducedMotion && (
          <button
            aria-label={paused ? 'Resume hero slideshow' : 'Pause hero slideshow'}
            onClick={togglePause}
            className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm hover:bg-white/40"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
        )}
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
