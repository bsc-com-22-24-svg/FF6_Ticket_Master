import type { Ticket } from '../ticketTypes';
import { formatDate, formatDateTime, formatMoney } from '../ticketFormat';
import styles from './TicketInfoTable.module.css';

export function TicketInfoTable({ ticket }: { ticket: Ticket }) {
  const statusClass = ticket.status === 'valid' ? styles.valid : styles.used;

  return (
    <div className={styles.tables}>
      <div className={styles.wrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>Event details</caption>
          <tbody>
            <tr>
              <th scope="row">Event</th>
              <td>{ticket.eventTitle}</td>
            </tr>
            <tr>
              <th scope="row">Venue</th>
              <td>
                {ticket.venue}, {ticket.city}
              </td>
            </tr>
            <tr>
              <th scope="row">Date</th>
              <td>{formatDate(ticket.date)}</td>
            </tr>
            <tr>
              <th scope="row">Time</th>
              <td>{ticket.time}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.wrap}>
        <table className={styles.table}>
          <caption className={styles.caption}>Ticket details</caption>
          <tbody>
            <tr>
              <th scope="row">Ticket ID</th>
              <td>{ticket.id}</td>
            </tr>
            <tr>
              <th scope="row">Ticket type</th>
              <td>{ticket.ticketType}</td>
            </tr>
            <tr>
              <th scope="row">Entry</th>
              <td>{ticket.seat}</td>
            </tr>
            <tr>
              <th scope="row">Holder</th>
              <td>{ticket.holder}</td>
            </tr>
            <tr>
              <th scope="row">Price</th>
              <td>{formatMoney(ticket.price)}</td>
            </tr>
            <tr>
              <th scope="row">Status</th>
              <td>
                <span className={`${styles.badge} ${statusClass}`}>{ticket.status}</span>
              </td>
            </tr>
            <tr>
              <th scope="row">Purchased</th>
              <td>{ticket.purchasedAt ? formatDateTime(ticket.purchasedAt) : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
