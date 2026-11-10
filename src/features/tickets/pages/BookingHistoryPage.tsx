import { BookingCard } from '../components/BookingCard'
import { useBookings } from '../hooks/useBookings'
import styles from './BookingHistoryPage.module.css'

export function BookingHistoryPage() {
  const { data, isLoading, isError, error, refetch } = useBookings()

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Booking history</h1>
        <p className={styles.sub}>Orders and payment status from your account</p>
      </header>
      {isLoading && <p className={styles.state}>Loading your bookings...</p>}
      {isError && (
        <p className={styles.state} role="alert">
          {error instanceof Error ? error.message : 'Could not load your bookings.'}{' '}
          <button type="button" className={styles.retry} onClick={() => refetch()}>Try again</button>
        </p>
      )}
      {!isLoading && !isError && data?.length === 0 && (
        <p className={styles.state}>You have no bookings yet.</p>
      )}
      {!isLoading && !isError && data && data.length > 0 && (
        <section className={styles.list} aria-label="Your bookings">
          {data.map((booking) => <BookingCard key={booking.id} booking={booking} />)}
        </section>
      )}
    </main>
  )
}
