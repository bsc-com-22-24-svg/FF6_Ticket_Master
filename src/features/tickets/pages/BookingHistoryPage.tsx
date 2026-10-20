import { useState } from 'react';
import { BookingCard } from '../components/BookingCard';
import { useBookings } from '../hooks/useBookings';
import type { BookingStatus } from '../bookingTypes';
import styles from './BookingHistoryPage.module.css';

type Filter = 'all' | BookingStatus;

const filters: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export function BookingHistoryPage() {
  const { data, isLoading, isError, refetch } = useBookings();
  const [filter, setFilter] = useState<Filter>('all');

  const visible = (data ?? []).filter(
    (b) => filter === 'all' || b.status === filter,
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Booking History</h1>
        <p className={styles.sub}>All your past and upcoming bookings</p>
      </header>

      <div className={styles.filters}>
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`${styles.pill} ${filter === f.key ? styles.pillActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && <p className={styles.state}>Loading your bookings...</p>}

      {isError && (
        <p className={styles.state}>
          Could not load bookings.{' '}
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Try again
          </button>
        </p>
      )}

      {!isLoading && !isError && visible.length === 0 && (
        <p className={styles.state}>No bookings to show.</p>
      )}

      <div className={styles.list}>
        {visible.map((b) => (
          <BookingCard key={b.id} booking={b} />
        ))}
      </div>
    </div>
  );
}
