import { Search, ShieldCheck, QrCode, TrendingUp } from 'lucide-react'
import Reveal from '../../../components/Reveal'

// the small feature cards
const features = [
  { icon: Search, title: 'Discover events', text: 'Find concerts, sports, workshops and gatherings near you.' },
  { icon: ShieldCheck, title: 'Safe booking', text: 'Clear prices and a reliable proof of purchase.' },
  { icon: QrCode, title: 'QR tickets', text: 'Get a digital ticket and enter with one scan.' },
  { icon: TrendingUp, title: 'Organizer tools', text: 'Create events and watch your sales live.' },
]

// this section  explains what the website is about in detail.....
export default function About() {
  return (
    <section id="about" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-navy">About Ticket Master</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">One simple place for every event</h2>
          <p className="mt-4 text-lg leading-relaxed">
            Events need good ticketing to control capacity, track attendance and manage entry. Ticket Master replaces manual
            registration and scattered tools with one platform. Organizers create and price events quickly, and attendees find
            events near them and get a QR ticket in just a few steps.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 120}>
              <div className="h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-sm hover:-translate-y-1 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy"><f.icon size={24} /></div>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
