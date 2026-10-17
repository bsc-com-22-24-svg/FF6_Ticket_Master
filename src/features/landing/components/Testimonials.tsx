import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Star, User } from 'lucide-react'
import { useTestimonials } from '../hooks/useTestimonials'
import Reveal from '../../../components/Reveal'

// "What people say" slider. Slides move by themselves every 5 seconds.
export default function Testimonials() {
  const { data: reviews = [] } = useTestimonials()
  const [current, setCurrent] = useState(0)
  const total = reviews.length || 1

  const goTo = (index) => setCurrent((index + total) % total)

  useEffect(() => {
    const timer = setTimeout(() => goTo(current + 1), 5000)
    return () => clearTimeout(timer)
  }, [current, total])

  const arrowStyle = 'absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-navy shadow-lg hover:bg-navy hover:text-white'

  return (
    <section id="reviews" className="bg-navy-50 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <Reveal className="text-center">
          <h2 className="text-3xl font-extrabold sm:text-4xl">What People Say</h2>
          <p className="mt-3">Hear from people who use Ticket Master</p>
        </Reveal>

        <Reveal className="relative mt-12">
          <div className="overflow-hidden rounded-3xl shadow-xl">
            {/* all slides in a row, we move the row left/right */}
            <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${current * 100}%)` }}>
              {reviews.map((r) => (
                <div key={r.name} className="w-full shrink-0 bg-white p-8 sm:p-12">
                  <div className="flex gap-1 text-amber-400">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} size={20} fill="currentColor" />)}
                  </div>
                  <p className="mt-5 min-h-[110px] text-lg leading-relaxed">"{r.text}"</p>
                  <div className="mt-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-white"><User /></div>
                    <div>
                      <p className="font-bold text-navy-dark">{r.name}</p>
                      <p className="text-sm">{r.place}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button aria-label="Previous review" onClick={() => goTo(current - 1)} className={`${arrowStyle} -left-3 sm:-left-5`}><ChevronLeft size={20} /></button>
          <button aria-label="Next review" onClick={() => goTo(current + 1)} className={`${arrowStyle} -right-3 sm:-right-5`}><ChevronRight size={20} /></button>
        </Reveal>

        <div className="mt-6 flex justify-center gap-2">
          {reviews.map((_, i) => (
            <button key={i} aria-label={`Review ${i + 1}`} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? 'w-8 bg-navy' : 'w-2 bg-slate-300'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
