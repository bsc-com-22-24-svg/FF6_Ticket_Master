import { describe, expect, it } from 'vitest'
import {
  defaultFilters,
  filtersFromSearch,
  searchFromFilters,
  validateEventSearch,
} from './filters'

describe('event search params', () => {
  it('keeps valid non-default filters', () => {
    expect(
      validateEventSearch({
        search: 'jazz',
        category: 'Concerts',
        city: 'Lilongwe',
        price: 'under20',
        sort: 'low',
      }),
    ).toEqual({
      search: 'jazz',
      category: 'Concerts',
      city: 'Lilongwe',
      price: 'under20',
      sort: 'low',
    })
  })

  it('omits defaults so the URL stays clean', () => {
    expect(
      validateEventSearch({
        search: '',
        category: 'All',
        city: 'All cities',
        price: 'any',
        sort: 'date',
      }),
    ).toEqual({})
  })

  it('falls back to defaults for invalid values', () => {
    expect(validateEventSearch({ category: 'Wat', city: 'Atlantis', price: 'cheap', sort: 'random' })).toEqual(
      {},
    )

    const filters = filtersFromSearch(validateEventSearch({ category: 'Wat' }))
    expect(filters).toEqual(defaultFilters)
  })

  it('round-trips a full filter state through the URL', () => {
    const filters = {
      search: 'lake',
      category: 'Festivals',
      city: 'Mangochi',
      price: 'under20',
      sort: 'high',
    }
    const url = searchFromFilters(filters)
    expect(filtersFromSearch(validateEventSearch(url))).toEqual(filters)
  })

  it('turns a reset into an empty search object', () => {
    expect(searchFromFilters(defaultFilters)).toEqual({})
  })
})
