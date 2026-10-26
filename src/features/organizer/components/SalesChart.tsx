import type { SalesPoint } from '../hooks/useSalesSeries';

interface SalesChartProps {
  data: SalesPoint[];
  eventName?: string;
}

// Bar chart for the last seven days of real sales. The bars are paired with a
// screen-reader table so the numbers are available as text, not only via the
// visual role="img" summary.
export default function SalesChart({ data, eventName }: SalesChartProps) {
  const total = data.reduce((sum, point) => sum + point.tickets, 0);

  if (total === 0) {
    return (
      <div
        className="flex h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center"
        role="status"
      >
        <p className="font-semibold text-navy-dark">No ticket sales in the last 7 days</p>
        <p className="text-sm text-slate-600">
          Sales for {eventName ? `“${eventName}”` : 'this event'} will appear here after a
          customer checks out.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.map((point) => point.tickets), 1);

  return (
    <figure className="rounded-2xl">
      <div className="flex gap-2">
        <div
          className="flex h-52 flex-col justify-between pb-1 text-right text-[11px] text-slate-500"
          aria-hidden="true"
        >
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="relative h-52">
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {[0, 50, 100].map((percent) => (
                <div
                  key={percent}
                  className="absolute inset-x-0 border-t border-dashed border-slate-100"
                  style={{ top: `${percent}%` }}
                />
              ))}
            </div>

            <div className="relative flex h-full items-end justify-between gap-2">
              {data.map((point) => (
                <div
                  key={point.date}
                  className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs font-semibold text-navy-dark">
                    {point.tickets || ''}
                  </span>
                  <div className="relative flex h-full w-full items-end justify-center">
                    <div
                      className="relative w-2/3 rounded-t-lg bg-navy transition-all group-hover:bg-navy-dark"
                      style={{
                        height: `${Math.max((point.tickets / max) * 100, point.tickets ? 6 : 2)}%`,
                      }}
                      title={`${point.date}: ${point.tickets} ticket${point.tickets === 1 ? '' : 's'}`}
                    >
                      <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy-dark px-2 py-1 text-[11px] font-medium text-white group-hover:block">
                        {point.tickets} ticket{point.tickets === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-2 flex justify-between gap-2 text-xs text-slate-600" aria-hidden="true">
            {data.map((point) => (
              <span key={point.date} className="flex-1 text-center">
                {point.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <figcaption className="sr-only">
        Tickets sold per day{eventName ? ` for ${eventName}` : ''} over the last 7 days.
      </figcaption>

      <table className="sr-only">
        <caption>Ticket sales over the last 7 days</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Tickets sold</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.date}>
              <th scope="row">{point.date}</th>
              <td>{point.tickets}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{total}</td>
          </tr>
        </tfoot>
      </table>
    </figure>
  );
}
