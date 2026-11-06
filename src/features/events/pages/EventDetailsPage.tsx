import { useState } from 'react'
import { useParams, Link } from '@tanstack/react-router'
import { Calendar, Clock, MapPin, Users } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import { remainingSeats, fromPrice, type Event, type TicketType } from '../../../types/event'
import Reveal from '../../../components/Reveal'

function formatMoney(amount: number): string {
  return amount === 0 ? 'Free' : `MK ${amount.toLocaleString()}`
}

export function EventDetailsPage() {
  const { eventId } = useParams({ from: '/events/$eventId' })
  const { data: events = [], isLoading, isError } = useEvents()
  const event = events.find((e: Event) => e.id === eventId)

  const [quantity, setQuantity] = useState(1)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
        <div className="h-96 animate-pulse rounded-3xl bg-slate-100" />
      </div>
    )
  }

  if (isError || !event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Event not found</h1>
        <Link to="/events" className="mt-6 inline-block rounded-full bg-navy px-6 py-2 text-white">
          Browse events
        </Link>
      </div>
    )
  }

  const types = event.ticketTypes
  const selectedType = types.find((t) => t.id === (selectedTypeId ?? types[0]?.id)) ?? types[0]
  const from = fromPrice(event)

  const remaining = selectedType ? remainingSeats(selectedType) : 0
  const qty = Math.max(1, quantity)
  const canBuy = selectedType && remaining > 0 && qty <= remaining
  const total = selectedType ? selectedType.price * qty : 0

  const checkoutLink = selectedType
    ? `/checkout/${event.id}?type=${selectedType.id}&qty=${qty}`
    : `/checkout/${event.id}`

  return (
    <div className="min-h-screen pb-16 pt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl shadow-2xl">
            <img src={event.image} alt={event.title} className="h-80 w-full object-cover sm:h-[420px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-dark/90 via-navy-dark/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <span className="inline-block rounded-full bg-white px-3 py-1 text-xs font-semibold text-navy">
                {event.category}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-5xl">{event.title}</h1>
              <p className="mt-3 flex flex-wrap items-center gap-4 text-white/90 sm:text-lg">
                <span className="flex items-center gap-2">
                  <Calendar size={18} /> {new Date(event.date).toLocaleDateString('en-GB')}
                </span>
                <span className="flex items-center gap-2">
                  <Clock size={18} /> {event.time}
                </span>
                <span className="flex items-center gap-2">
                  <MapPin size={18} /> {event.venue}, {event.city}
                </span>
              </p>
            </div>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          <Reveal delay={100} className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold">About this event</h2>
              <p className="mt-4 leading-relaxed text-slate-700">{event.description}</p>
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t pt-6">
                <div>
                  <p className="text-sm text-slate-500">Organized by</p>
                  <p className="font-semibold text-navy-dark">{event.organizer}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Tickets from</p>
                  <p className="text-2xl font-extrabold text-navy">{formatMoney(from)}</p>
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={200}>
            <div className="sticky top-24 space-y-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold">Get tickets</h2>

              <div className="space-y-3">
                {types.map((type: TicketType) => {
                  const rem = remainingSeats(type)
                  const soldOut = rem <= 0
                  return (
                    <label
                      key={type.id}
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                        soldOut
                          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                          : selectedType?.id === type.id
                            ? 'border-navy bg-navy-50'
                            : 'border-slate-200 hover:border-navy'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="ticketType"
                          value={type.id}
                          checked={selectedType?.id === type.id}
                          onChange={() => setSelectedTypeId(type.id)}
                          disabled={soldOut}
                        />
                        <div>
                          <p className="font-semibold">{type.name}</p>
                          <p className="text-sm text-slate-600">{formatMoney(type.price)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {soldOut ? (
                          <span className="text-xs font-semibold text-red-600">Sold out</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <Users size={14} /> {rem} left
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>

              <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                <label className="text-sm font-medium">Quantity</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border bg-white hover:bg-slate-100"
                    disabled={qty <= 1}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={remaining}
                    value={qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10)
                      setQuantity(Number.isNaN(val) ? 1 : Math.min(Math.max(1, val), remaining))
                    }}
                    className="w-16 rounded-xl border bg-white px-2 py-1 text-center"
                    disabled={remaining <= 0}
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border bg-white hover:bg-slate-100"
                    disabled={remaining <= 0 || qty >= remaining}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Total</span>
                  <span className="text-2xl font-extrabold text-navy">{formatMoney(total)}</span>
                </div>
                <Link
                  to={checkoutLink}
                  className={`mt-4 block w-full rounded-xl py-3 text-center font-semibold text-white transition ${
                    canBuy ? 'bg-navy hover:bg-navy-dark' : 'cursor-not-allowed bg-slate-400'
                  }`}
                  aria-disabled={!canBuy}
                  onClick={(e) => {
                    if (!canBuy) e.preventDefault()
                  }}
                >
                  {selectedType && remaining <= 0 ? 'Sold out' : 'Buy ticket'}
                </Link>
                <p className="mt-2 text-center text-xs text-slate-500">
                  You’ll be asked to sign in if you’re not logged in.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  )
}
