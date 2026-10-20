import type { Ticket } from '../ticketTypes';
import { formatDate, formatMoney } from '../ticketFormat';
import styles from './TicketsTable.module.css';

type TicketsTableProps = {
  tickets: Ticket[];
  onView: (id: string) => void;
};

export function TicketsTable({ tickets, onView }: TicketsTableProps) {
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Event</th>
            <th>Date</th>
            <th>Ticket ID</th>
            <th>Type</th>
            <th>Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t, index) => (
            /* Use ID if it exists, otherwise fallback to the array index to prevent duplicate key crashes */
            <tr key={t.id || `fallback-${index}`}>
              <td className={styles.event}>{t.eventTitle || 'Unknown Event'}</td>
              <td>{t.date ? formatDate(t.date) : 'TBD'}</td>
              <td>{t.id || 'N/A'}</td>
              <td>{t.ticketType || 'Standard'}</td>
              <td>{formatMoney(t.price ?? 0)}</td>
              <td>
                <span
                  className={`${styles.badge} ${t.status === 'valid' ? styles.valid : styles.used}`}
                >
                  {t.status || 'valid'}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => onView(t.id)}
                  disabled={!t.id}
                >
                  View ticket
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
