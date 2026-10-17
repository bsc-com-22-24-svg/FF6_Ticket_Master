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
          {tickets.map((t) => (
            <tr key={t.id}>
              <td className={styles.event}>{t.eventTitle}</td>
              <td>{formatDate(t.date)}</td>
              <td>{t.id}</td>
              <td>{t.ticketType}</td>
              <td>{formatMoney(t.price)}</td>
              <td>
                <span
                  className={`${styles.badge} ${t.status === 'valid' ? styles.valid : styles.used}`}
                >
                  {t.status}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  className={styles.link}
                  onClick={() => onView(t.id)}
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
