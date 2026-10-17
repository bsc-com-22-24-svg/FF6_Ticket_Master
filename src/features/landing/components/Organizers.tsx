import { Link } from '@tanstack/react-router'
import { CalendarPlus, TrendingUp, ScanLine } from 'lucide-react'
import Reveal from '../../../components/Reveal'

const perks = [
  { icon: CalendarPlus, title: 'Create in minutes', text: 'Add your event, set the price and publish it.' },
  { icon: TrendingUp, title: 'Track your sales', text: 'See tickets sold and money earned in real time.' },
  { icon: ScanLine, title: 'Easy entry', text: 'Scan the QR code at the door to confirm every ticket.' },
]

export default function Organizers() {
  return (
    <section
      id="organizers"
      className="relative bg-navy-dark bg-cover bg-center py-24"
      style={{ backgroundImage: "url('/images/organizers-bg.jpg')" }}
    >
      <div className="absolute inset-0 bg-navy-dark/60" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-navy-100">For event organizers</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            Hosting an event? Sell your tickets with us
          </h2>
          <p className="mt-4 text-lg text-slate-200">
            Stop using forms and manual registration. Create your event, set your prices and let people book online.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {perks.map((p, i) => (
            <Reveal key={p.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-white/20 bg-white/10 p-6 text-white backdrop-blur-sm">
                <p.icon size={28} />
                <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{p.text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 text-center">
          <Link
            to="/organizer/dashboard"
            className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-navy-dark shadow-lg hover:bg-navy-50"
          >
            Create an event
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
