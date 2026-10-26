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

// true when the event date is today or later
export function isUpcoming(iso: string): boolean {
  if (!iso) return false;
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  return iso >= today;
}
