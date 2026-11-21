import { useEffect, useState, type FocusEvent } from 'react'

// true when the visitor asked their device for less motion
function usePrefersReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  )

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(query)
    const onChange = () => setReduced(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  return reduced
}

// Auto-advance for a carousel (WCAG 2.2.2 Pause, Stop, Hide).
// The timer only runs when ALL of these are true:
//   - the visitor has not pressed the pause button
//   - the mouse is not over the carousel
//   - keyboard focus is not inside the carousel
//   - the device does not ask for reduced motion
// `advance` must change whenever the slide changes so the timer restarts.
export function useAutoplay(delayMs: number, advance: () => void) {
  const reducedMotion = usePrefersReducedMotion()
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const running = !paused && !hovered && !focused && !reducedMotion

  useEffect(() => {
    if (!running) return
    const timer = setTimeout(advance, delayMs)
    return () => clearTimeout(timer)
  }, [running, advance, delayMs])

  // spread these on the element that wraps the whole carousel
  const handlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    onFocus: (e: FocusEvent<HTMLElement>) => {
      // only keyboard focus pauses; clicking an arrow with the mouse does not
      if (e.target.matches(':focus-visible')) setFocused(true)
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
  }

  return {
    running,
    paused,
    reducedMotion,
    togglePause: () => setPaused((value) => !value),
    handlers,
  }
}
