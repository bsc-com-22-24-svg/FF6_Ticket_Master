import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link } from '@tanstack/react-router'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useEvents } from '../../events'
import {
  categories,
  cities,
  priceOptions,
  sortOptions,
  defaultFilters,
  filterEvents,
  type Filters,
} from '../filters'

const selectStyle =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-700 outline-none focus:border-navy'

interface HighlightProps {
  text: string
  word: string
}

function Highlight({ text, word }: HighlightProps) {
  const start = text.toLowerCase().indexOf(word.toLowerCase())
  if (!word || start === -1) return <>{text}</>
  const end = start + word.length
  return (
    <>
      {text.slice(0, start)}
      <b className="text-navy">{text.slice(start, end)}</b>
      {text.slice(end)}
    </>
  )
}

interface SearchBarProps {
  filters: Filters
  setFilters: (f: Filters) => void
}

type OpenBox = 'none' | 'filters' | 'results'

export default function SearchBar({ filters, setFilters }: SearchBarProps) {
  const [openBox, setOpenBox] = useState<OpenBox>('none')
  const wrapperRef = useRef<HTMLDivElement>(null)
  const { data: events = [] } = useEvents()

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapperRef.current && !wrapperRef.current.contains(target)) setOpenBox('none')
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const update = (name: keyof Filters, value: string) => setFilters({ ...filters, [name]: value })

  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    update('search', e.target.value)
    setOpenBox(e.target.value.trim() ? 'results' : 'none')
  }

  const activeCount = (['category', 'city', 'price'] as const).filter(
    (name) => filters[name] !== defaultFilters[name],
  ).length

  const matches = filterEvents(events, filters)
  const word = filters.search.trim()

  const goToEvents = () => {
    setOpenBox('none')
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div ref={wrapperRef} className="relative mx-auto w-full max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goToEvents()
        }}
        className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-2xl"
      >
        <Search size={20} className="shrink-0 text-slate-400" />
        <input
          value={filters.search}
          onChange={handleTyping}
          placeholder="Search concerts, sports, workshops..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-700 outline-none sm:text-base"
        />

        <button
          type="button"
          aria-label="Filters"
          onClick={() => setOpenBox(openBox === 'filters' ? 'none' : 'filters')}
          className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
            openBox === 'filters' ? 'bg-navy text-white' : 'bg-navy-50 text-navy hover:bg-navy-100'
          }`}
        >
          <SlidersHorizontal size={20} />
          {activeCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-dark text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>

        <button
          type="submit"
          className="hidden h-11 rounded-full bg-navy px-6 text-sm font-semibold text-white hover:bg-navy-dark sm:block"
        >
          Search
        </button>
      </form>

      {openBox === 'results' && (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-2 text-left shadow-2xl">
          {matches.length === 0 && <p className="p-4 text-sm">No events found for "{word}"</p>}

          {matches.slice(0, 5).map((event) => (
            <Link
              key={event.id}
              to="/events/$eventId"
              params={{ eventId: String(event.id) }}
              onClick={() => setOpenBox('none')}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-navy-50"
            >
              <img src={event.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
              <span>
                <span className="block font-semibold text-slate-700">
                  <Highlight text={event.title} word={word} />
                </span>
                <span className="text-xs">
                  {event.category} · {event.city}
                </span>
              </span>
            </Link>
          ))}

          {matches.length > 0 && (
            <button
              onClick={goToEvents}
              className="w-full rounded-xl p-3 text-sm font-semibold text-navy hover:bg-navy-50"
            >
              See all {matches.length} result(s)
            </button>
          )}
        </div>
      )}

      {openBox === 'filters' && (
        <div className="absolute left-0 right-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-5 text-left shadow-2xl">
          <p className="text-sm font-semibold text-navy-dark">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => update('category', c)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                  filters.category === c ? 'bg-navy text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-sm font-semibold text-navy-dark">
              City
              <select value={filters.city} onChange={(e) => update('city', e.target.value)} className={selectStyle}>
                {cities.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-navy-dark">
              Price
              <select value={filters.price} onChange={(e) => update('price', e.target.value)} className={selectStyle}>
                {priceOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-navy-dark">
              Sort by
              <select value={filters.sort} onChange={(e) => update('sort', e.target.value)} className={selectStyle}>
                {sortOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={() => setFilters(defaultFilters)}
              className="text-sm font-semibold text-slate-500 hover:text-navy"
            >
              Reset all
            </button>
            <button
              onClick={goToEvents}
              className="rounded-full bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-dark"
            >
              Show {matches.length} event(s)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
