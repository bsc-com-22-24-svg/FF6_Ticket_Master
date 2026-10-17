import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { TicketDetail } from '../components/TicketDetail';
import { TicketsTable } from '../components/TicketsTable';
import { useTickets } from '../hooks/useTickets';
import { formatDate, isUpcoming } from '../ticketFormat';
import type { Ticket } from '../ticketTypes';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // route is /tickets/$ticketId - show that ticket first when the id matches
  const { ticketId } = useParams({ strict: false }) as { ticketId?: string };
  const activeId = selectedId ?? ticketId ?? null;

  const tickets = data ?? [];
  const featured: Ticket | undefined =
    tickets.find((t) => t.id === activeId) ?? tickets[0];
  const others = tickets.filter((t) => t.id !== featured?.id);

  const visible = tickets.filter((t) => {
    if (tab === 'all') return true;
    return tab === 'upcoming' ? isUpcoming(t.date) : !isUpcoming(t.date);
  });

  function handleView(id: string) {
    setSelectedId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>My Tickets</h1>
        <p className={styles.sub}>Your tickets, QR codes and entry status</p>
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

      {!isLoading && !isError && !featured && (
        <p className={styles.state}>You have no tickets yet.</p>
      )}

      {featured && <TicketDetail ticket={featured} />}

      {others.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Other tickets</h2>
          <div className={styles.list}>
            {others.map((t) => (
              <article key={t.id} className={styles.item}>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemTitle}>{t.eventTitle}</h3>
                  <p className={styles.meta}>
                    {t.venue} · {formatDate(t.date)}
                  </p>
                </div>
                <div className={styles.itemSide}>
                  <span
                    className={`${styles.badge} ${t.status === 'valid' ? styles.valid : styles.used}`}
                  >
                    {t.status}
                  </span>
                  <button
                    type="button"
                    className={styles.retry}
                    onClick={() => handleView(t.id)}
                  >
                    View ticket
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tickets.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>All bookings</h2>

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
            <TicketsTable tickets={visible} onView={handleView} />
          )}
        </section>
      )}
    </div>
  );
}

export default MyTicketsPage;
