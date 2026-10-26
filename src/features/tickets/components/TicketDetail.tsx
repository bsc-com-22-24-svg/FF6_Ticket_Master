import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Ticket } from '../ticketTypes';
import { formatDate, formatMoney } from '../ticketFormat';
import { downloadTicketImage, ticketFromView } from '../ticketImage';
import styles from './TicketDetail.module.css';

export function TicketDetail({ ticket }: { ticket: Ticket }) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const statusClass = ticket.status === 'valid' ? styles.valid : styles.used;

  return (
    <article className={styles.card}>
      <div className={styles.info}>
        <span className={`${styles.badge} ${statusClass}`}>{ticket.status}</span>
        <h2 className={styles.title}>{ticket.eventTitle}</h2>
        <p className={styles.venue}>{ticket.venue}, {ticket.city}</p>

        <div className={styles.details}>
          <div>
            <span className={styles.label}>Date</span>
            <span className={styles.value}>{formatDate(ticket.date)}</span>
          </div>
          <div>
            <span className={styles.label}>Time</span>
            <span className={styles.value}>{ticket.time}</span>
          </div>
          <div>
            <span className={styles.label}>Ticket</span>
            <span className={styles.value}>{ticket.ticketType}</span>
          </div>
          <div>
            <span className={styles.label}>Entry</span>
            <span className={styles.value}>{ticket.seat}</span>
          </div>
          <div>
            <span className={styles.label}>Price</span>
            <span className={styles.value}>{formatMoney(ticket.price)}</span>
          </div>
        </div>

        <button
          type="button"
          className={styles.download}
          onClick={() => void downloadTicketImage(ticketFromView(ticket), qrRef.current)}
        >
          Download ticket
        </button>
      </div>

      <div className={styles.qrBox}>
        <QRCodeCanvas
          ref={qrRef}
          value={`TICKET:${ticket.id}`}
          size={168}
          level="M"
        />
        <p className={styles.qrId}>{ticket.id}</p>
        <p className={styles.qrNote}>
          {ticket.status === 'valid'
            ? 'Show this code at the entrance'
            : 'This ticket has already been used'}
        </p>
      </div>
    </article>
  );
}
