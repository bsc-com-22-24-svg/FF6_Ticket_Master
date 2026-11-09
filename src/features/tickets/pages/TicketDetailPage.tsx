import { Link, useParams } from '@tanstack/react-router';
import { TicketDetail } from '../components/TicketDetail';
import { TicketInfoTable } from '../components/TicketInfoTable';
import { useTickets } from '../hooks/useTickets';
import styles from './TicketDetailPage.module.css';

export function TicketDetailPage() {
  const { ticketId } = useParams({ strict: false }) as { ticketId?: string };
  const { data, isLoading, isError, refetch } = useTickets();
  const ticket = data?.find((t) => t.id === ticketId);

  return (
    <div className={styles.page}>
      <Link to="/tickets" className={styles.back}>
        ← My tickets
      </Link>
      <h1 className={styles.heading}>Ticket details</h1>

      {isLoading && <p className={styles.state}>Loading your ticket...</p>}

      {isError && (
        <p className={styles.state}>
          Could not load this ticket.{' '}
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Try again
          </button>
        </p>
      )}

      {!isLoading && !isError && !ticket && (
        <p className={styles.state}>
          We could not find that ticket. It may belong to a different account.
        </p>
      )}

      {ticket && (
        <>
          <TicketDetail ticket={ticket} />
          <TicketInfoTable ticket={ticket} />
        </>
      )}
    </div>
  );
}

export default TicketDetailPage;
