import { UserManagement } from '../components/UserManagement'
import { AdminEventModeration } from '../components/AdminEventModeration'

export function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-20">
      <div className="mx-auto max-w-7xl space-y-6 sm:px-6">
        <header>
          <h1 className="text-3xl font-extrabold text-navy-dark sm:text-4xl">Admin Control Center</h1>
          <p className="mt-2 text-slate-600">Manage backend accounts and event status.</p>
        </header>

        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Audit logs are not exposed by the connected backend API. User creation, reversible account activation changes, and event status changes are sent to the backend.
        </p>

        <UserManagement />
        <AdminEventModeration />
      </div>
    </main>
  )
}
