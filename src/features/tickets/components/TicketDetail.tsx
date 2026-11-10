import type { Ticket } from '../ticketTypes';
import { formatDate } from '../ticketFormat';
import { downloadTicketImage, ticketFromView } from '../ticketImage';
import styles from './TicketDetail.module.css';

// The ticket itself: status, event, QR code and the download button.
// The full details (venue, price, purchase time...) are in TicketInfoTable.
export function TicketDetail({ ticket }: { ticket: Ticket }) {
  const statusClass = ticket.status === 'valid' ? styles.valid : styles.used;

  return (
    <article className={styles.card}>
      <div className={styles.info}>
        <span className={`${styles.badge} ${statusClass}`}>{ticket.status}</span>
        <h2 className={styles.title}>{ticket.eventTitle}</h2>
        <p className={styles.venue}>
          {ticket.venue}, {ticket.city}
        </p>
        <p className={styles.venue}>
          {formatDate(ticket.date)} · {ticket.time}
        </p>

        <button
          type="button"
          className={styles.download}
          disabled={!ticket.qrCodeDataUrl}
          onClick={() => void downloadTicketImage(ticketFromView(ticket), null, ticket.qrCodeDataUrl)}
        >
          Download ticket
        </button>
      </div>

      <div className={styles.qrBox}>
        {ticket.qrCodeDataUrl ? (
          <img
            src={ticket.qrCodeDataUrl}
            width={168}
            height={168}
            alt=""
            style={{ width: 168, height: 168, objectFit: 'contain' }}
          />
        ) : (
          <p className={styles.qrNote}>A QR code is unavailable for this ticket.</p>
        )}
        <p className={styles.qrId}>{ticket.id}</p>
        <p className={styles.qrNote}>
          {ticket.status === 'valid'
            ? 'Show this code at the entrance'
            : ticket.status === 'used'
              ? 'This ticket has already been used'
              : `This ticket is ${ticket.status}`}
        </p>
      </div>
    </article>
  );
}
