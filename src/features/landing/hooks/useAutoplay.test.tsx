// @vitest-environment jsdom
import { act, useCallback, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAutoplay } from './useAutoplay'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let advanced = 0
let latest: ReturnType<typeof useAutoplay> | undefined

// tiny stand-in for a carousel: every advance changes `n`, like a new slide
function Probe() {
  const [n, setN] = useState(0)
  const advance = useCallback(() => {
    advanced += 1
    setN(n + 1)
  }, [n])
  latest = useAutoplay(1000, advance)
  return null
}

function mockMotionPreference(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: reduce,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList
}

describe('useAutoplay', () => {
  let container: HTMLDivElement
  let root: Root

  function mount() {
    container = document.createElement('div')
    root = createRoot(container)
    act(() => root.render(<Probe />))
  }

  beforeEach(() => {
    vi.useFakeTimers()
    advanced = 0
    latest = undefined
    mockMotionPreference(false)
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.useRealTimers()
  })

  it('advances after the delay', () => {
    mount()
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(advanced).toBe(1)
  })

  it('stops while the user has paused and continues on resume', () => {
    mount()
    act(() => latest?.togglePause())
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(advanced).toBe(0)

    act(() => latest?.togglePause())
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(advanced).toBe(1)
  })

  it('stops while the mouse is over the carousel', () => {
    mount()
    act(() => latest?.handlers.onMouseEnter())
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(advanced).toBe(0)

    act(() => latest?.handlers.onMouseLeave())
    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(advanced).toBe(1)
  })

  it('never advances when reduced motion is requested', () => {
    mockMotionPreference(true)
    mount()
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(advanced).toBe(0)
    expect(latest?.reducedMotion).toBe(true)
  })
})
