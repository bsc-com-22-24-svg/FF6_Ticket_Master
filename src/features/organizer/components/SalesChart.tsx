const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SalesChart({ values }: { values: number[] }) {
  const data = DAYS.map((day, i) => ({ day, value: values[i] ?? 0 }));
  const max = Math.max(...data.map((x) => x.value), 1);
  return (
    <div
      className="flex h-64 items-end justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
      role="img"
      aria-label="Ticket sales this week"
    >
      {data.map(({ day, value }) => (
        <div className="flex flex-1 flex-col items-center justify-end gap-2" key={day} title={`${day}: ${value} tickets`}>
          <span className="text-xs font-semibold">{value || ''}</span>
          <div className="relative flex h-full w-full items-end justify-center">
            <div
              className="w-2/3 rounded-t-lg bg-navy transition-all"
              style={{ height: `${Math.max((value / max) * 100, value ? 8 : 2)}%` }}
            />
          </div>
          <span className="text-xs text-slate-600">{day}</span>
        </div>
      ))}
    </div>
  );
}
