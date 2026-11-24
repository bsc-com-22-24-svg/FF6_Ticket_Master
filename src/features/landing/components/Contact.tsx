import { useState, type FormEvent } from 'react'
import { Mail, MapPin, Phone, Check } from 'lucide-react'
import Reveal from '../../../components/Reveal'
import { sendContact } from '../../../lib/contact'

const details = [
  { icon: MapPin, text: 'Lilongwe, Central Region, Malawi' },
  { icon: Phone, text: '+265 999 000 000' },
  { icon: Mail, text: 'support@ticketmaster.mw' },
]

const inputStyle = 'w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-navy'
const emptyForm = { name: '', email: '', subject: '', message: '', website: '' }

// Contact section. The message is saved by the backend (POST /contact).
export default function Contact() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const set = (key: keyof typeof emptyForm) => (e: { target: { value: string } }) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.name.trim().length < 2) return setError('Enter your name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Enter a valid email address.')
    if (form.message.trim().length < 5) return setError('Write a message of at least 5 characters.')
    setSending(true)
    try {
      await sendContact({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      })
      setForm(emptyForm)
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contact" className="py-20">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-navy">Contact us</p>
          <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">Let's talk about your event</h2>
          <p className="mt-4">Have a question about tickets, or want to host an event? Send us a message and we will reply within 24 hours.</p>
          <ul className="mt-8 space-y-4">
            {details.map((d) => (
              <li key={d.text} className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy"><d.icon size={20} /></span>
                {d.text}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150}>
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center rounded-3xl bg-navy-50 p-10 text-center">
              <Check size={56} className="text-navy" />
              <h3 className="mt-4 text-2xl font-bold">Message sent!</h3>
              <p className="mt-2">Thank you, we will get back to you soon.</p>
              <button onClick={() => setSent(false)} className="mt-6 font-semibold text-navy">Send another message</button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="space-y-4 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl sm:p-8">
              <div className="grid gap-4 sm:grid-cols-2">
                <input placeholder="Your name" aria-label="Your name" value={form.name} onChange={set('name')} className={inputStyle} />
                <input type="email" placeholder="Email address" aria-label="Email address" value={form.email} onChange={set('email')} className={inputStyle} />
              </div>
              <input placeholder="Subject" aria-label="Subject" value={form.subject} onChange={set('subject')} className={inputStyle} />
              <textarea rows={5} placeholder="Your message" aria-label="Your message" value={form.message} onChange={set('message')} className={inputStyle} />
              <input
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={form.website}
                onChange={set('website')}
                style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
              />
              {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={sending} className="w-full rounded-xl bg-navy py-3 font-semibold text-white hover:bg-navy-dark disabled:opacity-60">
                {sending ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}
