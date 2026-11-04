import { useMemo, useRef } from 'react'
import { CheckCircle, Download, Calendar, MapPin } from 'lucide-react'

interface TicketConfirmationProps {
  bookingId?: string
}

export function TicketConfirmation({ bookingId }: TicketConfirmationProps) {
  const ticketRefs = useRef<(HTMLDivElement | null)[]>([])

  const tickets = useMemo(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const txRef = bookingId || urlParams.get('tx_ref') || urlParams.get('bookingId')

      let matchedBooking: any = null
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const val = localStorage.getItem(key)
        try {
          const parsed = JSON.parse(val || '')
          const list = Array.isArray(parsed) ? parsed : Object.values(parsed || {})
          for (const item of list) {
            if (item && typeof item === 'object') {
              if (item.id === txRef || item.txRef === txRef || item.reference === txRef) {
                matchedBooking = item
                break
              }
            }
          }
        } catch {}
        if (matchedBooking) break
      }

      if (matchedBooking) {
        if (Array.isArray(matchedBooking.tickets) && matchedBooking.tickets.length > 0) {
          return matchedBooking.tickets.map((t: any, idx: number) => ({
            id: t.id || idx,
            ticketNumber: t.ticketNumber || String(t.id || idx).slice(0, 8).toUpperCase(),
            typeName: t.typeName || t.type || matchedBooking.ticketTypeName || 'Standard',
            eventTitle: t.eventTitle || matchedBooking.eventTitle || 'Event Ticket',
            date: t.date || matchedBooking.date || 'Upcoming',
            location: t.location || matchedBooking.location || 'Venue',
            holderName: t.userName || matchedBooking.userName || 'Attendee',
            price: t.price || (matchedBooking.totalAmount ? matchedBooking.totalAmount / matchedBooking.tickets.length : 0),
          }))
        }

        const qty = Number(matchedBooking.quantity || matchedBooking.count || matchedBooking.ticketsCount || 1)
        const generated = []
        for (let i = 0; i < qty; i++) {
          generated.push({
            id: `${matchedBooking.id}-${i}`,
            ticketNumber: `TM-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            typeName: matchedBooking.typeName || matchedBooking.ticketTypeName || 'Standard',
            eventTitle: matchedBooking.eventTitle || 'Event Ticket',
            date: matchedBooking.date || 'Upcoming',
            location: matchedBooking.location || 'Venue',
            holderName: matchedBooking.userName || 'Attendee',
            price: matchedBooking.price || (matchedBooking.totalAmount ? matchedBooking.totalAmount / qty : 0),
          })
        }
        if (generated.length > 0) return generated
      }

      return []
    } catch {
      return []
    }
  }, [bookingId])

  // Function to download an individual ticket card as an image using HTML5 Canvas
  function downloadSingleImage(element: HTMLDivElement | null, ticketNumber: string) {
    if (!element) return
    
    // Create an SVG representation of the ticket card for clean high-res export
    const html = element.outerHTML
    const blob = new Blob([`
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="220">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:sans-serif; background:white; padding:24px; border:1px solid #cbd5e1; border-radius:16px;">
            ${html}
          </div>
        </foreignObject>
      </svg>
    `], { type: 'image/svg+xml;charset=utf-8' })

    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 800
      canvas.height = 220
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const pngUrl = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.href = pngUrl
        downloadLink.download = `Ticket-${ticketNumber}.png`
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
  }

  function handleDownloadAllImages() {
    ticketRefs.current.forEach((el, idx) => {
      const ticketNum = tickets[idx]?.ticketNumber || `TICK-${idx + 1}`
      setTimeout(() => {
        downloadSingleImage(el, ticketNum)
      }, idx * 250) // Stagger downloads slightly so the browser handles all 11+ files smoothly
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 pt-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center print:hidden">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle size={32} />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-slate-900">Booking Confirmed!</h1>
          <p className="mt-2 text-slate-600">
            You successfully purchased <span className="font-bold text-slate-900">{tickets.length}</span> tickets in this order. Download them individually or all at once as images.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap justify-end gap-3 print:hidden">
          <button
            onClick={handleDownloadAllImages}
            className="flex items-center gap-2 rounded-xl bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-dark shadow-sm"
          >
            <Download size={16} /> Download All as PNG Images ({tickets.length})
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {tickets.map((ticket, idx) => (
            <div 
              key={ticket.id || idx} 
              ref={(el) => (ticketRefs.current[idx] = el)}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 break-inside-avoid"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-navy/10 px-3 py-1 font-mono text-xs font-bold text-navy">
                    {ticket.ticketNumber}
                  </span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    {ticket.typeName}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-slate-900">{ticket.eventTitle}</h3>
                <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {ticket.date}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} /> {ticket.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6">
                  <span className="text-xs text-slate-400 block">Holder</span>
                  <span className="text-sm font-semibold text-slate-800">{ticket.holderName}</span>
                  <span className="mt-1 block font-mono text-sm font-bold text-navy">MK {ticket.price.toLocaleString()}</span>
                </div>
                <button
                  onClick={() => downloadSingleImage(ticketRefs.current[idx], ticket.ticketNumber)}
                  className="print:hidden rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-600 hover:bg-slate-100 hover:text-navy"
                  title="Download Ticket PNG"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
