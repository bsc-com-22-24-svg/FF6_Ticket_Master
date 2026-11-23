import { Link } from '@tanstack/react-router'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-extrabold text-navy">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for doesn’t exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <Link to="/" className="rounded-full bg-navy px-6 py-2 font-semibold text-white hover:bg-navy-dark">
          Go home
        </Link>
        <Link to="/events" className="rounded-full border px-6 py-2 font-semibold hover:bg-slate-50">
          Browse events
        </Link>
      </div>
    </div>
  )
}
