import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../../authentication'
import { getKYC, saveKYC } from '../../../lib/verification'

// Shown to an organizer the first time they log in. The details are saved and accepted
// immediately: there is no admin review step.
export function OrganizerKycPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const existing = user ? getKYC(user.id) : null

  const [businessName, setBusinessName] = useState(existing?.businessName ?? '')
  const [phoneNumber, setPhoneNumber] = useState(existing?.phoneNumber ?? '')
  const [nationalId, setNationalId] = useState(existing?.nationalId ?? '')
  const [error, setError] = useState('')

  if (!user) return null

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!user) return
    if (!businessName.trim()) return setError('Enter your business or organization name.')
    if (!/^[+\d][\d\s-]{6,}$/.test(phoneNumber.trim())) return setError('Enter a valid phone number, for example +265 999 000 000.')
    if (nationalId.trim().length < 5) return setError('Enter your national ID number.')
    saveKYC({
      userId: user.id,
      businessName: businessName.trim(),
      phoneNumber: phoneNumber.trim(),
      nationalId: nationalId.trim(),
      status: 'Verified',
      submittedAt: new Date().toISOString(),
    })
    void navigate({ to: '/organizer/dashboard' })
  }

  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20'

  return (
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24">
      <form onSubmit={submit} className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8" noValidate>
        <h1 className="text-2xl font-extrabold text-navy-dark">Confirm your details</h1>
        <p className="mt-2 text-sm text-slate-600">
          Welcome, {user.name}. Before you create events, tell us about your business. This takes a minute and you only do it once.
        </p>

        {error && (
          <div role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <label className="mt-5 block text-sm font-semibold text-slate-700">
          Business or organization name
          <input className={field} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Nyasa Events" autoComplete="organization" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          Phone number
          <input className={field} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+265 999 000 000" inputMode="tel" autoComplete="tel" />
        </label>
        <label className="mt-4 block text-sm font-semibold text-slate-700">
          National ID number
          <input className={field} value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="Your national ID" />
        </label>

        <button type="submit" className="mt-6 w-full rounded-lg bg-navy px-4 py-3 font-semibold text-white hover:bg-navy-dark">
          Save and continue
        </button>
      </form>
    </div>
  )
}
