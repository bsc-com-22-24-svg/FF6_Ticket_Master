import { useState } from 'react'
import { ShieldAlert, DollarSign, Ban, RotateCcw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { listAllEvents, saveEvent, type StoredEvent } from '../../../lib/events'
import { useToast } from '../../toast'
import StatCard from '../../organizer/components/StatCard'
import { UserManagement } from '../components/UserManagement'

export function AdminDashboardPage() {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [events, setEvents] = useState<StoredEvent[]>(listAllEvents())
  const [activeTab, setActiveTab] = useState<'events' | 'users'>('users')

  const totalRevenue = events.reduce((sum, event) => sum + event.ticketTypes.reduce((tSum, type) => tSum + (type.sold * type.price), 0), 0)

  function toggleEventStatus(event: StoredEvent) {
    const newStatus = event.status === 'Published' ? 'Draft' : 'Published'
    saveEvent({ ...event, status: newStatus })
    setEvents(listAllEvents())
    queryClient.invalidateQueries({ queryKey: ['events'] })
    showToast(`Event ${newStatus === 'Published' ? 'published' : 'unpublished'}`, 'success')
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
          
          <StatCard label="Total Events" value={events.length.toString()} icon={ShieldAlert} detail="Across all organizers" />
        </div>

        <div className="flex gap-4 mb-4 border-b border-slate-200">
          <button onClick={() => setActiveTab('users')} className={`pb-3 font-semibold text-sm ${activeTab === 'users' ? 'border-b-2 border-navy text-navy' : 'text-slate-500 hover:text-slate-700'}`}>User Management</button>
          <button onClick={() => setActiveTab('events')} className={`pb-3 font-semibold text-sm ${activeTab === 'events' ? 'border-b-2 border-navy text-navy' : 'text-slate-500 hover:text-slate-700'}`}>Event Moderation</button>
          
        </div>

        {activeTab === 'users' && <UserManagement />}

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
                  {events.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No events have been created yet.</td></tr>
                  )}
                  {events.map((event) => (
                    <tr key={event.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-navy-dark">{event.title}</td>
                      <td className="px-4 py-3">{event.organizer}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${event.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{event.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {event.status === 'Published' ? (
                          <button onClick={() => toggleEventStatus(event)} className="flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 ml-auto"><Ban size={14} /> Unpublish</button>
                        ) : (
                          <button onClick={() => toggleEventStatus(event)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 ml-auto"><RotateCcw size={14} /> Publish</button>
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
