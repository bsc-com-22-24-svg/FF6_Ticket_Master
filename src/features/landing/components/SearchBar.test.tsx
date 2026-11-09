// @vitest-environment jsdom
import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SearchBar from './SearchBar'
import { defaultFilters, type Filters } from '../filters'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  events: [
    { id: 1, title: 'Lake of Stars Festival', category: 'Music', city: 'Salima', image: 'a.jpg' },
    { id: 2, title: 'Lake Malawi Marathon', category: 'Sports', city: 'Mangochi', image: 'b.jpg' },
    { id: 3, title: 'Zomba Tech Meetup', category: 'Tech', city: 'Zomba', image: 'c.jpg' },
  ],
}))

vi.mock('@tanstack/react-router', async () => {
  const { createElement } = await import('react')
  return {
    Link: ({ children, to, params, ...rest }: Record<string, unknown>) =>
      createElement('a', { href: to as string, ...rest }, children as never),
  }
})

vi.mock('../../events', () => ({ useEvents: () => ({ data: mocks.events }) }))

vi.mock('../filters', () => ({
  categories: ['All', 'Music', 'Sports'],
  cities: ['All'],
  priceOptions: [{ value: 'all', label: 'Any price' }],
  sortOptions: [{ value: 'date', label: 'Date' }],
  defaultFilters: { search: '', category: 'All', city: 'All', price: 'all', sort: 'date' },
  filterEvents: (events: { title: string }[], f: { search: string }) =>
    events.filter((e) => e.title.toLowerCase().includes(f.search.trim().toLowerCase())),
}))

function Harness() {
  const [filters, setFilters] = useState<Filters>(defaultFilters)
  return <SearchBar filters={filters} setFilters={setFilters} />
}

describe('SearchBar combobox', () => {
  let container: HTMLDivElement
  let root: Root

  const input = () => container.querySelector('input') as HTMLInputElement
  const options = () => [...container.querySelectorAll('[role=option]')] as HTMLElement[]

  function typeText(value: string) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    act(() => {
      setter?.call(input(), value)
      input().dispatchEvent(new Event('input', { bubbles: true }))
    })
  }

  function press(target: HTMLElement, key: string, init: KeyboardEventInit = {}) {
    act(() => {
      target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }))
    })
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
    act(() => root.render(<Harness />))
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('gives the input a name and combobox state', () => {
    expect(input().getAttribute('role')).toBe('combobox')
    expect(input().getAttribute('aria-label')).toBe('Search events')
    expect(input().getAttribute('aria-expanded')).toBe('false')

    typeText('lake')
    expect(input().getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[role=listbox]')?.getAttribute('aria-label')).toBe('Search results')
    expect(input().getAttribute('aria-controls')).toBe(container.querySelector('[role=listbox]')?.id)
    // 2 matching events + the "See all" option
    expect(options()).toHaveLength(3)
  })

  it('announces the result count', () => {
    typeText('lake')
    expect(container.querySelector('[role=status]')?.textContent).toBe('2 events found')
    typeText('zomba')
    expect(container.querySelector('[role=status]')?.textContent).toBe('1 event found')
    typeText('nothing')
    expect(container.querySelector('[role=status]')?.textContent).toBe('No events found for nothing')
  })

  it('moves focus with the arrow keys', () => {
    typeText('lake')
    act(() => input().focus())

    press(input(), 'ArrowDown')
    expect(document.activeElement).toBe(options()[0])
    expect(options()[0].getAttribute('aria-selected')).toBe('true')
    expect(options()[1].getAttribute('aria-selected')).toBe('false')

    press(options()[0], 'ArrowDown')
    expect(document.activeElement).toBe(options()[1])
    expect(options()[1].getAttribute('aria-selected')).toBe('true')

    press(options()[1], 'ArrowUp')
    expect(document.activeElement).toBe(options()[0])

    // up from the first option returns to the input
    press(options()[0], 'ArrowUp')
    expect(document.activeElement).toBe(input())
  })

  it('closes with Escape and returns focus to the input', () => {
    typeText('lake')
    act(() => input().focus())
    press(input(), 'ArrowDown')
    expect(document.activeElement).toBe(options()[0])

    press(options()[0], 'Escape')
    expect(container.querySelector('[role=listbox]')).toBeNull()
    expect(input().getAttribute('aria-expanded')).toBe('false')
    expect(document.activeElement).toBe(input())
  })

  it('closes the list with Tab', () => {
    typeText('lake')
    act(() => input().focus())
    press(input(), 'Tab')
    expect(container.querySelector('[role=listbox]')).toBeNull()
  })

  it('shows which category chip is selected and the filters state', () => {
    const trigger = container.querySelector('[aria-label=Filters]') as HTMLButtonElement
    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    act(() => trigger.click())
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(container.querySelector('[role=dialog]')?.getAttribute('aria-label')).toBe('Filters')

    const chip = (name: string) =>
      [...container.querySelectorAll('[aria-pressed]')].find((b) => b.textContent === name) as HTMLElement
    expect(chip('All').getAttribute('aria-pressed')).toBe('true')
    expect(chip('Music').getAttribute('aria-pressed')).toBe('false')

    act(() => chip('Music').click())
    expect(chip('Music').getAttribute('aria-pressed')).toBe('true')
    expect(chip('All').getAttribute('aria-pressed')).toBe('false')
  })
})
