import { useState } from 'react'
import { ShieldAlert, DollarSign, Check, X, Users } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { listAllEvents, saveEvent, type StoredEvent } from '../../../lib/events'
import { listAllKYC, saveKYC, type OrganizerKYC } from '../../../lib/verification'
import { useToast } from '../../toast'
import StatCard from '../../organizer/components/StatCard'

export function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [events, setEvents] = useState<StoredEvent[]>(listAllEvents())
  const [kycs, setKycs] = useState<OrganizerKYC[]>(listAllKYC())
  const [activeTab, setActiveTab] = useState<'events' | 'organizers'>('organizers')

  const totalRevenue = events.reduce((sum, event) => sum + event.ticketTypes.reduce((tSum, type) => tSum + (type.sold * type.price), 0), 0)
  const pendingEvents = events.filter(e => e.status === 'Pending').length
  const pendingKyc = kycs.filter(k => k.status === 'Pending').length

  function updateEventStatus(event: StoredEvent, newStatus: 'Published' | 'Draft' | 'Pending') {
    saveEvent({ ...event, status: newStatus })
    setEvents(listAllEvents())
    queryClient.invalidateQueries({ queryKey: ['events'] })
    if (newStatus === 'Published') {
      showToast('Event approved and published', 'success')
    } else if (newStatus === 'Draft') {
      showToast('Event rejected', 'info')
    }
  }

  function updateKycStatus(kyc: OrganizerKYC, newStatus: 'Verified' | 'Rejected') {
    saveKYC({ ...kyc, status: newStatus })
    setKycs(listAllKYC())
    if (newStatus === 'Verified') {
      showToast('Organizer verified', 'success')
    } else if (newStatus === 'Rejected') {
      showToast('Organizer verification rejected', 'info')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold sm:text-4xl text-navy-dark">Admin Control Center</h1>
          <p className="mt-2 text-slate-600">Verify organizers and moderate events to prevent scams.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <StatCard label="Total Platform Revenue" value={`MK ${totalRevenue.toLocaleString()}`} icon={DollarSign} />
          <StatCard label="Pending Events" value={pendingEvents.toString()} icon={ShieldAlert} detail="Needs approval" />
          <StatCard label="Pending KYC" value={pendingKyc.toString()} icon={Users} detail="Organizers to verify" />
        </div>

        <div className="flex gap-4 mb-4 border-b border-slate-200">
          <button onClick={() => setActiveTab('organizers')} className={`pb-3 font-semibold text-sm ${activeTab === 'organizers' ? 'border-b-2 border-navy text-navy' : 'text-slate-500 hover:text-slate-700'}`}>Organizer Verification</button>
          <button onClick={() => setActiveTab('events')} className={`pb-3 font-semibold text-sm ${activeTab === 'events' ? 'border-b-2 border-navy text-navy' : 'text-slate-500 hover:text-slate-700'}`}>Event Moderation</button>
        </div>

        {activeTab === 'organizers' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold mb-4 text-navy-dark">Organizer KYC Reviews</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Business Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">ID Number</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {kycs.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No organizer verifications submitted yet.</td></tr>
                  )}
                  {kycs.map((kyc) => (
                    <tr key={kyc.userId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-navy-dark">{kyc.businessName}</td>
                      <td className="px-4 py-3">{kyc.phoneNumber}</td>
                      <td className="px-4 py-3 font-mono text-xs">{kyc.nationalId}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${kyc.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' : kyc.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                          {kyc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {kyc.status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateKycStatus(kyc, 'Verified')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"><Check size={14} /> Approve</button>
                            <button onClick={() => updateKycStatus(kyc, 'Rejected')} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"><X size={14} /> Reject</button>
                          </div>
                        )}
                        {kyc.status === 'Verified' && <span className="text-xs text-emerald-600 font-semibold">Verified ✓</span>}
                        {kyc.status === 'Rejected' && <span className="text-xs text-red-600 font-semibold">Rejected</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold mb-4 text-navy-dark">Event Moderation</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Event Name</th>
                    <th className="px-4 py-3">Organizer</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-navy-dark">{event.title}</td>
                      <td className="px-4 py-3">{event.organizer}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${event.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : event.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>{event.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {event.status === 'Pending' && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => updateEventStatus(event, 'Published')} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"><Check size={14} /> Approve</button>
                            <button onClick={() => updateEventStatus(event, 'Draft')} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"><X size={14} /> Reject</button>
                          </div>
                        )}
                        {event.status === 'Published' && (
                          <button onClick={() => updateEventStatus(event, 'Draft')} className="text-xs font-semibold text-red-600 hover:underline">Unpublish</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

