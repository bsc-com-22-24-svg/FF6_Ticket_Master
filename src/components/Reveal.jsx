import { useEffect, useRef } from 'react'

// Fades its children in when they scroll into view.
// delay (in ms) staggers items in a grid. The animation itself is in index.css
export default function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('is-visible')
        observer.disconnect() // only animate once
      }
    }, { threshold: 0.12 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ '--d': `${delay}ms` }} className={`reveal ${className}`}>
      {children}
    </div>
  )
}
