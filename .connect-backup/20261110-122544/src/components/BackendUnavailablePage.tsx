import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

interface BackendUnavailablePageProps {
  title: string
  feature: string
  backTo?: '/events' | '/organizer/dashboard'
  children?: ReactNode
}

export function BackendUnavailablePage({
  title,
  feature,
  backTo = '/events',
  children,
}: BackendUnavailablePageProps) {
  return (
    <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-20 sm:px-6">
      <Link to={backTo} className="text-sm font-semibold text-slate-600 hover:text-navy">
        ← {backTo === '/events' ? 'Events' : 'Organizer dashboard'}
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold text-navy-dark">{title}</h1>
      <p role="status" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {feature} is unavailable because the connected backend does not currently provide the required API.
        No local or demo data is being shown or saved.
      </p>
      {children && <div className="mt-4">{children}</div>}
    </main>
  )
}
