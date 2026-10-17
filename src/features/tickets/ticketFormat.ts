export function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMoney(amount: number): string {
  return `MK ${amount.toLocaleString()}`;
}

// true when the event date is today or later
export function isUpcoming(iso: string): boolean {
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
  return iso >= today;
}
