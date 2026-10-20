export function formatDate(iso: string): string {
  if (!iso) return 'TBD';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
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
