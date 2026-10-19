import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { QrCode } from '../../../components/QrCode'
import type { TicketRecord } from '../../../lib/tickets'

interface TicketConfirmationProps {
  tickets: TicketRecord[]
  onBuyAgain: () => void
}

export function TicketConfirmation({ tickets, onBuyAgain }: TicketConfirmationProps): ReactNode {
  const [ticket] = tickets

  return (
    <div>
      <span className="ok">✓ Purchase confirmed</span>
      <h1>Your ticket{tickets.length > 1 ? 's' : ''}</h1>
      <div className="split" style={{ marginTop: 14 }}>
        <div className="card row" style={{ alignItems: 'center', gap: 30, padding: 28 }}>
          <div>
            <h2>{ticket.eventName}</h2>
            <p className="m">📅 {ticket.date}</p>
            <p className="m">📍 {ticket.venue}, {ticket.city}</p>
            <p className="m">Ticket type: {ticket.ticketType}</p>
            <p className="m">Holder: {ticket.holder}</p>
            <p>
              <b>{ticket.id}</b>
            </p>
            {tickets.length > 1 && (
              <p className="m">+{tickets.length - 1} more ticket(s) in this order</p>
            )}
          </div>
          <QrCode value={ticket.id} />
        </div>
        <div className="card">
          <h2>Actions</h2>
          <Link
            to="/tickets/$ticketId"
            params={{ ticketId: ticket.id }}
            className="btn w"
            style={{ marginTop: 0 }}
          >
            View in My Tickets
          </Link>
          <a
            className="btn o w"
            href={`data:text/plain,${encodeURIComponent(ticket.id)}`}
            download={`${ticket.id}.txt`}
          >
            ⬇ Download ticket
          </a>
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
