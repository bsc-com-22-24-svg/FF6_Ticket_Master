import { useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react'
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
  setFilters: (f: Filters, options?: { replace?: boolean }) => void
  onShowAll?: (filters: Filters) => void
}

type OpenBox = 'none' | 'filters' | 'results'

const MAX_RESULTS = 5

// Search box with a results list. It follows the ARIA "combobox" pattern:
//   - the input announces itself as a combobox and says if the list is open
//   - the results are a listbox of options; Arrow keys move focus through them
//   - Enter opens the focused option, Escape closes and returns to the input,
//     Tab closes the list
//   - a hidden live region announces how many events were found
export default function SearchBar({ filters, setFilters, onShowAll }: SearchBarProps) {
  const [openBox, setOpenBox] = useState<OpenBox>('none')
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: events = [] } = useEvents()

  // unique ids so two search bars on one page never clash
  const uid = useId()
  const resultsId = `${uid}-results`
  const filtersId = `${uid}-filters`
  const optionPrefix = `${uid}-option-`

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (wrapperRef.current && !wrapperRef.current.contains(target)) {
        setOpenBox('none')
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const update = (name: keyof Filters, value: string, options?: { replace?: boolean }) =>
    setFilters({ ...filters, [name]: value }, options)

  const handleTyping = (e: ChangeEvent<HTMLInputElement>) => {
    // Typeahead replaces the current entry; committed filters push a new one.
    update('search', e.target.value, { replace: true })
    setOpenBox(e.target.value.trim() ? 'results' : 'none')
    setActiveIndex(-1)
  }

  const activeCount = (['category', 'city', 'price'] as const).filter(
    (name) => filters[name] !== defaultFilters[name],
  ).length

  const matches = filterEvents(events, filters)
  const shown = matches.slice(0, MAX_RESULTS)
  // every shown event is an option, plus one last "See all" option
  const optionCount = matches.length > 0 ? shown.length + 1 : 0
  const word = filters.search.trim()

  const closeBox = (restoreFocus = false) => {
    setOpenBox('none')
    setActiveIndex(-1)
    if (restoreFocus) inputRef.current?.focus({ preventScroll: true })
  }

  const goToEvents = (restoreFocus = false) => {
    closeBox(restoreFocus)
    if (onShowAll) {
      onShowAll(filters)
      return
    }
    document.getElementById('events')?.scrollIntoView({ behavior: 'smooth' })
  }

  const focusOption = (index: number) => document.getElementById(`${optionPrefix}${index}`)?.focus()

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const onInput = target === inputRef.current
    const optionIndex = target.id.startsWith(optionPrefix)
      ? Number(target.id.slice(optionPrefix.length))
      : -1
    const onOption = optionIndex !== -1

    // Escape closes whichever panel is open and goes back to the input
    if (e.key === 'Escape' && openBox !== 'none') {
      e.preventDefault()
      closeBox(true)
      return
    }

    if (openBox === 'results' && optionCount > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        focusOption(onOption ? Math.min(optionIndex + 1, optionCount - 1) : 0)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (onInput) focusOption(optionCount - 1)
        else if (optionIndex <= 0) inputRef.current?.focus()
        else focusOption(optionIndex - 1)
        return
      }
      if (onOption && e.key === 'Home') {
        e.preventDefault()
        focusOption(0)
        return
      }
      if (onOption && e.key === 'End') {
        e.preventDefault()
        focusOption(optionCount - 1)
        return
      }
      // typing while an option has focus: go back to the input so typing continues
      if (onOption && (e.key === 'Backspace' || (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey))) {
        inputRef.current?.focus()
        return
      }
    }

    // Tab closes the results list
    if (e.key === 'Tab' && openBox === 'results') {
      if (onOption) {
        if (e.shiftKey) e.preventDefault()
        // focus goes back to the input; Tab then moves on from there
        inputRef.current?.focus()
      }
      closeBox()
      return
    }

    // ArrowDown in the input reopens the list for the current search text
    if (e.key === 'ArrowDown' && onInput && openBox === 'none' && word) {
      e.preventDefault()
      setOpenBox('results')
    }
  }

  // read out by screen readers when the number of results changes
  const resultsCount = `${matches.length} event${matches.length === 1 ? '' : 's'} found`
  const statusText =
    openBox === 'results' ? (matches.length === 0 ? `No events found for ${word}` : resultsCount) : ''

  return (
    <div ref={wrapperRef} onKeyDown={handleKeyDown} className="relative mx-auto w-full max-w-3xl">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          goToEvents()
        }}
        className="flex items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-2xl"
      >
        <Search size={20} className="shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Search events"
          aria-expanded={openBox === 'results'}
          aria-controls={resultsId}
          aria-autocomplete="list"
          autoComplete="off"
          value={filters.search}
          onChange={handleTyping}
          onFocus={() => setActiveIndex(-1)}
          placeholder="Search concerts, sports, workshops..."
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-slate-700 outline-none sm:text-base"
        />

        <button
          type="button"
          aria-label="Filters"
          aria-expanded={openBox === 'filters'}
          aria-controls={filtersId}
          aria-haspopup="dialog"
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

      <div role="status" aria-live="polite" className="sr-only">
        {statusText}
      </div>

      {openBox === 'results' && (
        <div
          id={resultsId}
          role={matches.length > 0 ? 'listbox' : undefined}
          aria-label={matches.length > 0 ? 'Search results' : undefined}
          className="absolute left-0 right-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-2 text-left shadow-2xl"
        >
          {matches.length === 0 && <p className="p-4 text-sm">No events found for "{word}"</p>}

          {shown.map((event, i) => (
            <Link
              key={event.id}
              id={`${optionPrefix}${i}`}
              role="option"
              aria-selected={activeIndex === i}
              tabIndex={-1}
              onFocus={() => setActiveIndex(i)}
              to="/events/$eventId"
              params={{ eventId: String(event.id) }}
              onClick={() => closeBox()}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-navy-50 focus:bg-navy-50 focus:outline-2 focus:outline-navy"
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
              type="button"
              id={`${optionPrefix}${shown.length}`}
              role="option"
              aria-selected={activeIndex === shown.length}
              tabIndex={-1}
              onFocus={() => setActiveIndex(shown.length)}
              onClick={(e) => goToEvents(e.detail === 0)}
              className="w-full rounded-xl p-3 text-sm font-semibold text-navy hover:bg-navy-50 focus:bg-navy-50 focus:outline-2 focus:outline-navy"
            >
              See all {matches.length} result(s)
            </button>
          )}
        </div>
      )}

      {openBox === 'filters' && (
        <div
          id={filtersId}
          role="dialog"
          aria-label="Filters"
          className="absolute left-0 right-0 top-full z-30 mt-3 max-h-[70vh] overflow-y-auto rounded-2xl bg-white p-5 text-left shadow-2xl"
        >
          <p className="text-sm font-semibold text-navy-dark">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={filters.category === c}
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
              type="button"
              onClick={() => setFilters(defaultFilters)}
              className="text-sm font-semibold text-slate-500 hover:text-navy"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={(e) => goToEvents(e.detail === 0)}
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
