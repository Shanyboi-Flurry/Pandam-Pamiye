import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, ArrowUp, CalendarDays, Gift, Leaf, MessageSquare, Search, ShieldCheck, Store, Trophy, Handshake, PackageCheck, Recycle,
} from 'lucide-react'
import { useStore } from '../store'
import { isPublic, wasteStats } from '../lib/logic'
import { CATEGORIES, ROLES } from '../lib/constants'
import { Logo, ThemeToggle } from '../components/ui'

const PROBLEMS = [
  ['Students buy materials they only need for a week.', 'Borrow it from a classmate for the exact dates you need it.'],
  ['Unused supplies and equipment sit in drawers and go to waste.', 'List it once. Lend it, give it away, or swap it for something useful.'],
  ['Nobody knows who is willing to lend.', 'Every listing shows what is free, what can be borrowed, and what is open to swaps.'],
  ['There is no single place for school materials.', 'One place for books, gadgets, supplies, sports gear, art materials, and event equipment.'],
  ['Borrowed items are hard to track and return.', 'Due dates, overdue reminders, and a return log keep every loan on record.'],
]

const STEPS = [
  { icon: Search, title: 'Find what you need', text: 'Search the resources by title, tag, or owner and filter by category.' },
  { icon: Handshake, title: 'Send a request', text: 'Pick your dates. Overlapping reservations are blocked before you send.' },
  { icon: PackageCheck, title: 'Meet and share', text: 'The owner approves. You arrange a pickup on campus.' },
  { icon: Leaf, title: 'Return and earn', text: 'Return on time and both of you earn EcoPoints and badges.' },
]

const FEATURES = [
  { icon: Store, title: 'Resource sharing', text: 'Filter by category, condition, type, and availability.' },
  { icon: CalendarDays, title: 'Availability calendar', text: 'See booked dates and upcoming returns at a glance.' },
  { icon: Gift, title: 'Donation and exchange hub', text: 'Give things away or trade for what you need.' },
  { icon: MessageSquare, title: 'Campus messaging', text: 'Chat with other students, teachers, and staff around school to arrange pickups.' },
  { icon: Trophy, title: 'EcoPoints and badges', text: 'Earn points for lending, donating, and returning on time.' },
]

function CountUp({ to }) {
  const ref = useRef(null)
  const started = useRef(false)
  const [n, setN] = useState(0)
  useEffect(() => {
    if (started.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(to)
      return
    }
    let raf
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      started.current = true
      const t0 = performance.now()
      const tick = (t) => {
        const p = Math.min((t - t0) / 1400, 1)
        setN(Math.round(to * (1 - (1 - p) ** 3)))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    })
    io.observe(ref.current)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to])
  return <span ref={ref}>{n.toLocaleString()}</span>
}

function ScrollUI() {
  const [pos, setPos] = useState({ p: 0, show: false })
  useEffect(() => {
    const on = () => {
      const h = document.documentElement
      const max = h.scrollHeight - h.clientHeight
      setPos({ p: max > 0 ? h.scrollTop / max : 0, show: h.scrollTop > 500 })
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-marker-yellow to-spruce-400" style={{ transform: `scaleX(${pos.p})` }} aria-hidden="true" />
      <button
        type="button"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-spruce-700 text-white shadow-xl transition duration-300 hover:-translate-y-1 hover:bg-spruce-800 ${pos.show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}
      >
        <ArrowUp size={20} />
      </button>
    </>
  )
}

const toTop = (e) => {
  e.preventDefault()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const delay = (i, step = 0.08) => ({ '--d': `${i * step}s` })

export default function Landing() {
  const { state } = useStore()
  const waste = wasteStats(state)

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const stats = [
    [state.resources.filter(isPublic).length, 'resources listed'],
    [waste.shares, 'completed shares'],
    [state.activity.reduce((sum, a) => sum + a.points, 0), 'EcoPoints earned'],
    [state.users.filter((u) => u.role !== 'admin').length, 'community members'],
  ]

  return (
    <div className="min-h-screen bg-paper">
      <ScrollUI />
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-surface/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" onClick={toTop} aria-label="Pandam Pamiye, back to top"><Logo school /></a>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex" aria-label="Page sections">
            {[['#problem', 'Why Pandam Pamiye'], ['#how', 'How it works'], ['#features', 'Features'], ['#roles', 'Who it is for']].map(([h, l]) => (
              <a key={h} href={h} className="transition-colors hover:text-spruce-700">{l}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/register" className="btn-primary hidden sm:inline-flex">Sign up</Link>
          </div>
        </div>
      </header>

      <section className="hero pb-28">
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <span className="blob blob-a" />
          <span className="blob blob-b" />
          <span className="blob blob-c" />
        </div>
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="rise mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-marker-yellow ring-1 ring-white/20 backdrop-blur">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-marker-yellow opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-marker-yellow" />
              </span>
              Angeles University Foundation
            </p>
            <h1 className="rise text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl" style={delay(1, 0.12)}>
              Share more. Waste less. <span className="shimmer">Grow together.</span>
            </h1>
            <p className="rise mt-5 max-w-xl text-lg text-spruce-100" style={delay(2, 0.12)}>
              Pandam Pamiye is where students, teachers, and school staff lend, borrow, donate, and swap what they already own. Skip buying something you need for one week.
            </p>
            <div className="rise mt-8 flex flex-wrap items-center gap-3" style={delay(3, 0.12)}>
              <Link to="/register" className="btn-accent group !px-6 !py-3 text-base shadow-lg shadow-black/20 transition hover:-translate-y-0.5">
                Create an account <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a href="#how" className="btn !px-6 !py-3 text-base text-white ring-1 ring-white/30 transition hover:bg-white/10">See how it works</a>
            </div>
            <p className="rise mt-4 text-sm text-spruce-200" style={delay(4, 0.12)}>
              Already have an account? <Link to="/login" className="font-semibold text-white underline">Log in</Link>
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-md grid-cols-2 gap-4 lg:max-w-none" aria-label="What you can share">
            {CATEGORIES.slice(0, 6).map((c, i) => (
              <div key={c.id} className={`rise ${i % 2 ? 'sm:translate-y-6' : ''}`} style={delay(i + 2, 0.1)}>
                <div className="glass bob flex items-center gap-3 p-4" style={delay(i, 0.6)}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface shadow-inner">
                    <c.icon size={22} style={{ color: c.hex }} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-bold">{c.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 sm:px-6" aria-label="Community totals">
        <dl className="reveal grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-xl shadow-spruce-900/10 sm:grid-cols-4">
          {stats.map(([v, l]) => (
            <div key={l} className="bg-surface p-6 text-center">
              <dd className="font-display text-3xl font-extrabold text-spruce-700 sm:text-4xl"><CountUp to={v} /></dd>
              <dt className="mt-1 text-sm text-slate-600">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      <div className="overflow-hidden py-10" style={{ WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)', maskImage: 'linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent)' }} aria-hidden="true">
        <div className="marquee">
          {[0, 1].map((g) => (
            <div key={g} className="flex shrink-0 gap-3 pr-3">
              {CATEGORIES.map((c) => (
                <span key={c.id} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-surface px-4 py-2 text-sm font-semibold text-spruce-900 shadow-sm">
                  <c.icon size={16} style={{ color: c.hex }} /> {c.label}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <section id="problem" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="reveal max-w-2xl text-3xl font-bold text-spruce-900 sm:text-4xl">Small school problems, one shared fix</h2>
        <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-surface shadow-sm">
          {PROBLEMS.map(([p, s], i) => (
            <div key={p} className="reveal grid gap-2 p-5 md:grid-cols-2 md:gap-8" style={delay(i, 0.06)}>
              <p className="text-slate-600">{p}</p>
              <p className="flex gap-3 font-semibold text-spruce-900">
                <Recycle size={20} className="mt-0.5 shrink-0 text-spruce-500" aria-hidden="true" />
                {s}
              </p>
            </div>
          ))}
        </div>
        <ul className="reveal mt-6 flex flex-wrap gap-2" aria-label="Resource categories">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/marketplace?category=${c.id}`} className={`badge ${c.tint} !px-3 !py-1.5 transition hover:-translate-y-0.5 hover:shadow-md`}>
                <c.icon size={14} aria-hidden="true" /> {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className="hero py-16 text-spruce-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="reveal text-3xl font-bold text-white sm:text-4xl">How a loan works</h2>
          <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="reveal glass p-5" style={delay(i, 0.12)}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-marker-yellow text-spruce-950 shadow-lg shadow-black/20">
                  <s.icon size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">{i + 1}. {s.title}</h3>
                <p className="mt-1 text-sm text-spruce-100">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="reveal text-3xl font-bold text-spruce-900 sm:text-4xl">Built for a school community</h2>
        <div className="mt-10 flex flex-wrap justify-center gap-5">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="reveal w-full rounded-2xl border border-slate-200 bg-surface p-6 sm:w-[calc(50%-0.625rem)] lg:w-[calc(33.333%-0.84rem)]" style={delay(i % 3, 0.1)}>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-spruce-500 to-spruce-700 text-white shadow-md">
                <f.icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-spruce-900">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="border-t border-slate-200 bg-surface py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="reveal text-3xl font-bold text-spruce-900 sm:text-4xl">One platform, four roles</h2>
          <p className="reveal mt-2 max-w-2xl text-slate-600">The dashboard and tools adapt to who is logged in.</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLES).map(([k, r], i) => (
              <div key={k} className="reveal rounded-2xl border border-slate-200 p-5" style={delay(i, 0.1)}>
                <dt className="flex items-center gap-2 font-display text-lg font-bold text-spruce-900">
                  {k === 'admin' && <ShieldCheck size={18} className="text-spruce-600" aria-hidden="true" />}
                  {r.label}
                </dt>
                <dd className="mt-1 text-sm text-slate-600">{r.blurb}</dd>
              </div>
            ))}
          </dl>
          <div className="reveal shine mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-marker-yellow p-6 sm:p-8">
            <div className="relative z-10">
              <p className="font-display text-2xl font-bold text-spruce-950">Have something sitting unused?</p>
              <p className="text-spruce-950">List it in under a minute and earn your first EcoPoints.</p>
            </div>
            <Link to="/register" className="btn-primary relative z-10 !px-6 !py-3 transition hover:-translate-y-0.5">Get started</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <a href="/" onClick={toTop} aria-label="Pandam Pamiye, back to top" className="inline-block"><Logo school className="justify-center" /></a>
        <p className="mt-3">Share more. Waste less. Grow together.</p>
        <p className="mt-1">Capstone demo. Please do not use a real password.</p>
      </footer>
    </div>
  )
}
