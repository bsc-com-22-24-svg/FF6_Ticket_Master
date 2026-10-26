import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  // Handle Escape key & Body Scroll Lock
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    // Save current focus and lock scroll
    previousFocus.current = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    
    // Move focus into the modal
    setTimeout(() => {
      const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (focusable && focusable.length > 0) {
        (focusable[0] as HTMLElement).focus()
      }
    }, 10)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      // Restore focus to where it was
      if (previousFocus.current) previousFocus.current.focus()
    }
  }, [isOpen, onClose])

  // Trap focus inside the modal
  const handleTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) return
    
    const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (focusableElements.length === 0) return
    
    const first = focusableElements[0] as HTMLElement
    const last = focusableElements[focusableElements.length - 1] as HTMLElement

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={handleTabKey}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 id="modal-title" className="text-lg font-bold text-navy-dark">{title}</h2>
          <button onClick={onClose} aria-label="Close modal" className="rounded-full p-2 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
