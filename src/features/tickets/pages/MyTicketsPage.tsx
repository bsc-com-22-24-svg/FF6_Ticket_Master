import { useState } from 'react';
import { TicketsTable } from '../components/TicketsTable';
import { useTickets } from '../hooks/useTickets';
import { isUpcoming } from '../ticketFormat';
import styles from './MyTicketsPage.module.css';

type Tab = 'all' | 'upcoming' | 'past';

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];

export function MyTicketsPage() {
  const { data, isLoading, isError, refetch } = useTickets();
  const [tab, setTab] = useState<Tab>('all');

  const tickets = data ?? [];
  const visible = tickets.filter((t) => {
    if (tab === 'all') return true;
    return tab === 'upcoming' ? isUpcoming(t.date) : !isUpcoming(t.date);
  });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>My Tickets</h1>
        <p className={styles.sub}>Open a ticket to see its QR code, details and entry status</p>
      </header>

      {isLoading && <p className={styles.state}>Loading your tickets...</p>}

      {isError && (
        <p className={styles.state}>
          Could not load tickets.{' '}
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Try again
          </button>
        </p>
      )}

      {!isLoading && !isError && tickets.length === 0 && (
        <p className={styles.state}>You have no tickets yet.</p>
      )}

      {tickets.length > 0 && (
        <section className={styles.section}>
          <div className={styles.filters}>
            {tabs.map((tabItem) => (
              <button
                key={tabItem.key}
                type="button"
                className={`${styles.pill} ${tab === tabItem.key ? styles.pillActive : ''}`}
                onClick={() => setTab(tabItem.key)}
              >
                {tabItem.label}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className={styles.state}>No tickets to show.</p>
          ) : (
            <TicketsTable tickets={visible} />
          )}
        </section>
      )}
    </div>
  );
}

export default MyTicketsPage;
