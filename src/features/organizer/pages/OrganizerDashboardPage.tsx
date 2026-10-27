import { useMemo, useState, type FormEvent } from 'react'
import { Users, Ticket, Coins, CheckCircle, Plus, Pencil, RotateCcw, ShieldAlert } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAllEvents } from '../../events'
import { resetTicketStore } from '../../../lib/tickets'
import { resetEvents } from '../../../lib/events'
import { useAuth } from '../../authentication'
import { getKYC, saveKYC, type KYCStatus } from '../../../lib/verification'
import { Modal } from '../../../components/ui/Modal'
import StatCard from '../components/StatCard'
import SalesChart from '../components/SalesChart'
import { useSalesSeries } from '../hooks/useSalesSeries'
import { EMPTY_EVENT_STATS, useEventStats } from '../hooks/useEventStats'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { useToast } from '../../toast'

export function OrganizerDashboardPage() {
  const { user } = useAuth()
  const { data: events = [], isLoading } = useAllEvents()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { showToast } = useToast()
  
  // KYC State
  const [kyc, setKyc] = useState(() => user ? getKYC(user.id) : null)
  const [showKycForm, setShowKycForm] = useState(false)
  const [kycError, setKycError] = useState<string | null>(null)
  const [formData, setFormData] = useState({ businessName: '', phoneNumber: '', nationalId: '' })
  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const selected = useMemo(
    () => events.find((event) => event.id === (selectedId ?? events[0]?.id)),
    [events, selectedId],
  )

  // Sales and attendance come from the same reactive query source, so buying
  // or checking in a ticket updates the dashboard without a reload.
  const { data: stats = EMPTY_EVENT_STATS } = useEventStats(selected?.id)
  const { data: series = [] } = useSalesSeries(selected?.id)

  function confirmReset() {
    resetEvents()
    resetTicketStore()
    showToast('Demo data reset', 'success')
    window.location.reload()
  }

  function submitKYC(e: FormEvent) {
    e.preventDefault()
    setKycError(null)

    // Inline Validation
    if (!formData.businessName.trim()) {
      return setKycError('Business name is required.')
    }
    const phoneClean = formData.phoneNumber.replace(/\s+/g, '')
    if (!/^(\+?265|0)[89]\d{8}$/.test(phoneClean)) {
      return setKycError('Enter a valid Malawian phone number (e.g. 0991 234 567).')
    }
    if (!formData.nationalId.trim()) {
      return setKycError('National ID is required.')
    }

    if (!user) return
    const newKyc = {
      userId: user.id,
      businessName: formData.businessName,
      phoneNumber: formData.phoneNumber,
      nationalId: formData.nationalId,
      status: 'Pending' as KYCStatus,
      submittedAt: new Date().toISOString()
    }
    saveKYC(newKyc)
    setKyc(newKyc)
    setShowKycForm(false)
    showToast('Verification submitted', 'success')
  }

  const kycStatus = kyc?.status || 'Unverified'

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        
        {/* Banner showing Verification Status */}
        {kycStatus !== 'Verified' && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-amber-800">
              <ShieldAlert size={28} />
              <div>
                <h3 className="font-bold text-lg">Account Verification Required</h3>
                <p className="text-sm">You must verify your identity before you can publish events.</p>
              </div>
            </div>
            {kycStatus === 'Pending' ? (
              <span className="rounded-full bg-amber-200 px-4 py-2 text-sm font-bold text-amber-800">Under Review</span>
            ) : (
              <button onClick={() => setShowKycForm(true)} className="rounded-full bg-navy px-6 py-2 text-sm font-semibold text-white hover:bg-navy-dark whitespace-nowrap">
                {kycStatus === 'Rejected' ? 'Try Again' : 'Verify Now'}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">Organizer Dashboard</h1>
            <p className="mt-2 text-slate-600">Track sales and attendance for your events</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <RotateCcw size={16} /> Reset demo data
            </button>
            {kycStatus === 'Verified' ? (
              <Link to="/organizer/events/new" className="flex items-center gap-2 rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
                <Plus size={16} /> Create event
              </Link>
            ) : (
              <div className="flex flex-col items-start gap-1">
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="flex items-center gap-2 rounded-full bg-slate-400 px-5 py-2 text-sm font-semibold text-white cursor-not-allowed"
                >
                  <Plus size={16} /> Create event
                </button>
                <p className="text-xs text-slate-600">
                  You need to verify your account before you can create events.{' '}
                  <button
                    type="button"
                    onClick={() => setShowKycForm(true)}
                    className="font-semibold text-navy underline hover:no-underline"
                  >
                    Verify now
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-semibold">Select event</label>
            <select value={selected?.id ?? ''} onChange={(e) => setSelectedId(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-navy">
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} {event.status === 'Draft' ? '(draft)' : event.status === 'Pending' ? '(pending)' : ''}
                </option>
              ))}
            </select>
            {isLoading && <p className="mt-2 text-sm text-slate-500">Loading events…</p>}
            {!isLoading && events.length === 0 && <p className="mt-2 text-sm text-slate-500">No events yet — create one to get started.</p>}
            
            {selected && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${selected.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : selected.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                    {selected.status}
                  </span>
                </div>
                <Link to="/organizer/events/$eventId/edit" params={{ eventId: selected.id }} className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50">
                  <Pencil size={14} /> Edit event
                </Link>
              </div>
            )}
          </div>

          <StatCard label="Tickets sold" value={stats.sold.toLocaleString()} detail={`${stats.capacity.toLocaleString()} total`} icon={Ticket} />
          <StatCard label="Remaining" value={stats.remaining.toLocaleString()} detail="seats left" icon={Users} />
          <StatCard label="Revenue" value={`MK ${stats.revenue.toLocaleString()}`} detail={stats.fees > 0 ? `incl. MK ${stats.fees.toLocaleString()} fees` : 'from sales'} icon={Coins} />
          <StatCard label="Checked in" value={stats.checkedIn.toLocaleString()} detail="attendees admitted" icon={CheckCircle} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Sales this week</h2>
            <div className="mt-6">
              <SalesChart data={series} eventName={selected?.title} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Ticket types</h2>
            <div className="mt-4 space-y-3">
              {selected?.ticketTypes.map((type) => (
                <div key={type.id} className="flex items-center justify-between rounded-xl border p-3">
                  <div>
                    <p className="font-semibold">{type.name}</p>
                    <p className="text-sm text-slate-600">MK {type.price.toLocaleString()} · {type.capacity} cap</p>
                  </div>
                  <span className="text-sm font-semibold">{type.sold} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <ConfirmDialog
          open={showResetConfirm}
          onClose={() => setShowResetConfirm(false)}
          onConfirm={confirmReset}
          title="Reset demo data"
          description="Reset all demo data (events, tickets and bookings)? This action cannot be undone."
          confirmLabel="Reset"
          cancelLabel="Cancel"
          variant="danger"
        />
      </div>

      {/* KYC Form Modal */}
      <Modal isOpen={showKycForm} onClose={() => setShowKycForm(false)} title="Organizer Verification">
        <p className="text-sm text-slate-600 mb-6">Please provide your legal details to prevent fraud and ensure secure payouts.</p>
        <form onSubmit={submitKYC} className="space-y-4">
          {kycError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600 border border-red-200">{kycError}</div>}
          
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Business / Organizer Name</span>
            <input required value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-navy" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone Number</span>
            <input required type="tel" placeholder="0991 234 567" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-navy" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">National ID / Registration Number</span>
            <input required value={formData.nationalId} onChange={e => setFormData({...formData, nationalId: e.target.value})} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-navy" />
          </label>
          <div className="flex gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={() => setShowKycForm(false)} className="flex-1 rounded-xl border py-2 text-sm font-semibold hover:bg-slate-50">Cancel</button>
            <button type="submit" className="flex-1 rounded-xl bg-navy py-2 text-sm font-semibold text-white hover:bg-navy-dark">Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

