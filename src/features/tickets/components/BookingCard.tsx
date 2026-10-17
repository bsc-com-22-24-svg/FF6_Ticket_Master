import type { Booking } from '../bookingTypes';
import styles from './BookingCard.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function BookingCard({ booking }: { booking: Booking }) {
  const statusClass =
    booking.status === 'confirmed' ? styles.confirmed : styles.cancelled;

  return (
    <article className={styles.card}>
      <div className={styles.info}>
        <h3 className={styles.title}>{booking.eventTitle}</h3>
        <p className={styles.meta}>
          {booking.venue} · {formatDate(booking.date)}
        </p>
        <p className={styles.meta}>
          {booking.id} · {booking.quantity} ticket{booking.quantity > 1 ? 's' : ''}
        </p>
      </div>
      <div className={styles.side}>
        <strong className={styles.total}>MK {booking.total.toLocaleString()}</strong>
        <span className={`${styles.badge} ${statusClass}`}>{booking.status}</span>
      </div>
    </article>
  );
}
