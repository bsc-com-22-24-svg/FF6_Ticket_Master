import type { LucideIcon } from 'lucide-react';

export default function StatCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="mt-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-600">{label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy">
          <Icon size={19} />
        </span>
      </div>
      <strong className="mt-2 block text-2xl font-extrabold text-navy-dark">{value}</strong>
      {detail && <small className="text-xs text-slate-500">{detail}</small>}
    </article>
  );
}
