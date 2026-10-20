import { useRef, type ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { QrCode } from '../../../components/QrCode'
import type { TicketRecord } from '../../../lib/tickets'
import { formatKwacha } from '../format'
import { downloadTicketImage, formatTicketDate } from '../ticketImage'

interface TicketConfirmationProps {
  tickets: TicketRecord[]
  onBuyAgain: () => void
}

export function TicketConfirmation({ tickets, onBuyAgain }: TicketConfirmationProps): ReactNode {
  return (
    <div>
      <span className="ok">✓ Purchase confirmed</span>
      <h1>Your ticket{tickets.length > 1 ? 's' : ''}</h1>
      <div className="split" style={{ marginTop: 14 }}>
        <div className="g">
          {tickets.map((ticket) => (
            <TicketPass key={ticket.id} ticket={ticket} />
          ))}
        </div>
        <div className="card">
          <h2>Actions</h2>
          <Link
            to="/tickets/$ticketId"
            params={{ ticketId: tickets[0].id }}
            className="btn w"
            style={{ marginTop: 0 }}
          >
            View in My Tickets
          </Link>
          <button type="button" className="btn o w" onClick={onBuyAgain}>
            Buy more tickets
          </button>
          <Link className="btn o w" to="/events">
            Browse more events
          </Link>
        </div>
      </div>
    </div>
  )
}

function TicketPass({ ticket }: { ticket: TicketRecord }): ReactNode {
  const qrRef = useRef<HTMLCanvasElement>(null)

  return (
    <article className="card ticket-pass">
      <div className="ticket-pass-info">
        <span className="tag">{ticket.status === 'valid' ? 'Valid' : 'Used'}</span>
        <h2 style={{ marginTop: 10 }}>{ticket.eventName}</h2>
        <p className="m">{ticket.venue}, {ticket.city}</p>
        <div className="g g2" style={{ marginTop: 14 }}>
          <div><span className="m">Date</span><br /><b>{formatTicketDate(ticket.date)}</b></div>
          <div><span className="m">Time</span><br /><b>{ticket.time}</b></div>
          <div><span className="m">Ticket</span><br /><b>{ticket.ticketType}</b></div>
          <div><span className="m">Entry</span><br /><b>{ticket.ticketType} Admission</b></div>
          <div><span className="m">Price</span><br /><b>{formatKwacha(ticket.price)}</b></div>
          <div><span className="m">Holder</span><br /><b>{ticket.holder}</b></div>
        </div>
        <p style={{ marginTop: 12 }}><b>{ticket.id}</b></p>
        <button
          type="button"
          className="btn"
          style={{ marginTop: 8 }}
          onClick={() => downloadTicketImage(ticket, qrRef.current)}
        >
          Download ticket PNG
        </button>
      </div>
      <div className="ticket-pass-qr">
        <QrCode value={ticket.id} canvasRef={qrRef} />
        <p className="m" style={{ marginTop: 8 }}>Scan at the entrance</p>
      </div>
    </article>
  )
}
