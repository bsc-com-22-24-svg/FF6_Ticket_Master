// Event dates are calendar dates without a time. Format them in UTC so the
// same ticket never renders on two different days (issue #73).
export function formatDate(iso: string): string {
  if (!iso) return 'TBD';
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'TBD';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'MK 0';
  return `MK ${amount.toLocaleString()}`;
}

// A moment in time (for example when a ticket was bought), shown in the
// viewer's own time zone: "24 Oct 2026, 18:00".
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const moment = new Date(iso);
  if (Number.isNaN(moment.getTime())) return '—';
  const day = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(moment);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(moment);
  return `${day}, ${time}`;
}

// true when the event date is today or later
export function isUpcoming(iso: string): boolean {
  if (!iso) return false;
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  return iso >= today;
}
