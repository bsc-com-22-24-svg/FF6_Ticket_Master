import { useMemo } from 'react'

interface AttendeeListProps {
  eventId?: string
}

export function AttendeeList({ eventId }: AttendeeListProps) {
  const attendees = useMemo(() => {
    if (!eventId) return []
    try {
      // 1. Gather all possible user profiles / accounts from localStorage
      const userLookup = new Map()
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const val = localStorage.getItem(key)
        try {
          const parsed = JSON.parse(val || '')
          const list = Array.isArray(parsed) ? parsed : [parsed]
          for (const item of list) {
            if (item && typeof item === 'object') {
              const uid = item.id || item.userId || item.uid
              const uEmail = item.email || item.userEmail || item.buyerEmail
              const uName = item.name || item.userName || item.buyerName || item.fullName
              
              if (uEmail) {
                if (uid) userLookup.set(String(uid), { name: uName || uEmail.split('@')[0], email: uEmail })
                userLookup.set(String(uEmail).toLowerCase(), { name: uName || uEmail.split('@')[0], email: uEmail })
              }
            }
          }
        } catch {}
      }

      // 2. Scan for tickets / bookings matching this eventId
      const rawTickets: any[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key) continue
        const val = localStorage.getItem(key)
        try {
          const parsed = JSON.parse(val || '')
          
          function findTickets(obj: any, parentInfo: any = {}) {
            if (!obj || typeof obj !== 'object') return
            if (Array.isArray(obj)) {
              for (const item of obj) findTickets(item, parentInfo)
              return
            }

            const currentInfo = {
              name: obj.userName || obj.buyerName || obj.name || obj.customerName || parentInfo.name,
              email: obj.userEmail || obj.buyerEmail || obj.email || obj.customerEmail || parentInfo.email,
              userId: obj.userId || obj.user_id || parentInfo.userId,
            }

            const isMatch = 
              obj.eventId === eventId || 
              obj.event_id === eventId || 
              obj.id === eventId || 
              (obj.event && obj.event.id === eventId)

            // If it looks like a ticket item
            if (isMatch && (obj.ticketNumber || obj.type || obj.typeName || obj.ticketType || obj.price !== undefined)) {
              if (!obj.password && !obj.role && !obj.ticketTypes) {
                rawTickets.push({ ...obj, ...currentInfo })
              }
            }

            for (const k of Object.keys(obj)) {
              if (typeof obj[k] === 'object' && obj[k] !== null) {
                findTickets(obj[k], currentInfo)
              }
            }
          }

          findTickets(parsed)
        } catch {}
      }

      // 3. Map and format with actual user details resolved
      const uniqueMap = new Map()
      for (const t of rawTickets) {
        const tid = t.id || t.ticketNumber || Math.random().toString()
        if (!uniqueMap.has(tid)) {
          let resolvedName = t.name
          let resolvedEmail = t.email

          // Try lookup by userId or email
          if (t.userId && userLookup.has(String(t.userId))) {
            const u = userLookup.get(String(t.userId))
            resolvedName = u.name
            resolvedEmail = u.email
          } else if (resolvedEmail && userLookup.has(String(resolvedEmail).toLowerCase())) {
            const u = userLookup.get(String(resolvedEmail).toLowerCase())
            resolvedName = u.name || resolvedName
          }

          uniqueMap.set(tid, {
            id: tid,
            ticketNumber: t.ticketNumber || String(tid).slice(0, 8).toUpperCase(),
            typeName: t.typeName || t.ticketTypeName || t.type || 'Standard',
            buyerName: resolvedName && resolvedName !== 'Customer' ? resolvedName : (resolvedEmail ? resolvedEmail.split('@')[0] : 'Event Attendee'),
            buyerEmail: resolvedEmail || 'attendee@ticket.com',
            purchasedAt: t.createdAt || t.date ? new Date(t.createdAt || t.date).toLocaleString() : new Date().toLocaleString(),
            checkedIn: t.checkedIn || false,
          })
        }
      }

      return Array.from(uniqueMap.values())
    } catch {
      return []
    }
  }, [eventId])

  if (attendees.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8 text-center">
        <h3 className="text-xl font-bold">Ticket Purchases & Attendees</h3>
        <p className="mt-2 text-sm text-slate-500">No ticket purchases recorded for this specific event yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Ticket Purchases & Attendees</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {attendees.length} total sold for this event
        </span>
      </div>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 text-xs font-semibold uppercase text-slate-500">
              <th className="pb-3 pr-4">Ticket #</th>
              <th className="pb-3 px-4">Buyer Name</th>
              <th className="pb-3 px-4">Email</th>
              <th className="pb-3 px-4">Type</th>
              <th className="pb-3 px-4">Purchased At</th>
              <th className="pb-3 pl-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {attendees.map((att) => (
              <tr key={att.id} className="hover:bg-slate-50/50">
                <td className="py-3.5 pr-4 font-mono font-semibold text-navy">{att.ticketNumber}</td>
                <td className="py-3.5 px-4 font-medium text-slate-900">{att.buyerName}</td>
                <td className="py-3.5 px-4 text-slate-600">{att.buyerEmail}</td>
                <td className="py-3.5 px-4 text-slate-600">{att.typeName}</td>
                <td className="py-3.5 px-4 text-slate-500">{att.purchasedAt}</td>
                <td className="py-3.5 pl-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    att.checkedIn ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {att.checkedIn ? 'Checked In' : 'Valid'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
