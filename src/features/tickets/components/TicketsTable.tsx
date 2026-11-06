import { Link } from '@tanstack/react-router';
import type { Ticket } from '../ticketTypes';
import { formatDate, formatDateTime, formatMoney } from '../ticketFormat';
import styles from './TicketsTable.module.css';

export function TicketsTable({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <caption className="sr-only">Your tickets</caption>
        <thead>
          <tr>
            <th scope="col">Event</th>
            <th scope="col">Date</th>
            <th scope="col">Venue</th>
            <th scope="col">Type</th>
            <th scope="col">Price</th>
            <th scope="col">Status</th>
            <th scope="col">Purchased</th>
            <th scope="col">
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, index) => (
            /* fall back to the index so a ticket with a missing id cannot crash the list */
            <tr key={t.id || `fallback-${index}`}>
              <td>
                {t.id ? (
                  <Link to="/tickets/$ticketId" params={{ ticketId: t.id }} className={styles.link}>
                    {t.eventTitle || 'Unknown Event'}
                  </Link>
                ) : (
                  <span className={styles.event}>{t.eventTitle || 'Unknown Event'}</span>
                )}
              </td>
              <td>{t.date ? formatDate(t.date) : 'TBD'}</td>
              <td>{t.venue ? `${t.venue}, ${t.city}` : '—'}</td>
              <td>{t.ticketType || 'Standard'}</td>
              <td>{formatMoney(t.price ?? 0)}</td>
              <td>
                <span
                  className={`${styles.badge} ${t.status === 'valid' ? styles.valid : styles.used}`}
                >
                  {t.status || 'valid'}
                </span>
              </td>
              <td>{t.purchasedAt ? formatDateTime(t.purchasedAt) : '—'}</td>
              <td>
                {t.id && (
                  <Link to="/tickets/$ticketId" params={{ ticketId: t.id }} className={styles.link}>
                    View ticket
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
