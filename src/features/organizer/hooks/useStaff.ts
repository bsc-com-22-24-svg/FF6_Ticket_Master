import { useState } from 'react'

export function useStaff() {
  const [search, setSearch] = useState('')

  return {
    staff: [],
    totalStaff: 0,
    activeStaff: 0,
    disabledStaff: 0,
    search,
    setSearch,
  }
}
