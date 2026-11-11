import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, CalendarDays, Gift, Leaf, Search, ShieldCheck, Sparkles, Store, Trophy, Handshake, PackageCheck, Recycle,
} from 'lucide-react'
import { useStore } from '../store'
import { isPublic, wasteStats } from '../lib/logic'
import { CATEGORIES, ROLES } from '../lib/constants'
import { Logo } from '../components/ui'

const PROBLEMS = [
  ['Students buy materials they only need for a week.', 'Borrow it from a classmate for the exact dates you need it.'],
  ['Unused supplies and equipment sit in drawers and go to waste.', 'List it once. Lend it, give it away, or swap it for something useful.'],
  ['Nobody knows who is willing to lend.', 'Every listing shows what is free, what can be borrowed, and what is open to swaps.'],
  ['There is no single place for school materials.', 'One place for books, gadgets, supplies, sports gear, art materials, and event equipment.'],
  ['Borrowed items are hard to track and return.', 'Due dates, overdue reminders, and a return log keep every loan on record.'],
]

const STEPS = [
  { icon: Search, title: 'Find what you need', text: 'Search the resources or describe your need and let Smart Match suggest items.' },
  { icon: Handshake, title: 'Send a request', text: 'Pick your dates. Overlapping reservations are blocked before you send.' },
  { icon: PackageCheck, title: 'Meet and share', text: 'The owner approves. You arrange a pickup on campus.' },
  { icon: Leaf, title: 'Return and earn', text: 'Return on time and both of you earn EcoPoints and badges.' },
]

const FEATURES = [
  { icon: Store, title: 'Resource sharing', text: 'Filter by category, condition, type, and availability.' },
  { icon: CalendarDays, title: 'Availability calendar', text: 'See booked dates and upcoming returns at a glance.' },
  { icon: Gift, title: 'Donation and exchange hub', text: 'Give things away or trade for what you need.' },
  { icon: Sparkles, title: 'Smart Match', text: 'Describe your need in plain words and get ranked suggestions.' },
  { icon: Trophy, title: 'EcoPoints and badges', text: 'Earn points for lending, donating, and returning on time.' },
  { icon: BarChart3, title: 'Sustainability analytics', text: 'Track items shared, demand by category, and waste avoided.' },
]

export default function Landing() {
  const { user, state } = useStore()
    const waste = wasteStats(state)
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Logo school />
        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex" aria-label="Page sections">
          <a href="#problem" className="hover:text-spruce-700">Why Pandam Pamiye</a>
          <a href="#how" className="hover:text-spruce-700">How it works</a>
          <a href="#features" className="hover:text-spruce-700">Features</a>
          <a href="#roles" className="hover:text-spruce-700">Who it is for</a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Link to="/dashboard" className="btn-primary">Open dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">Log in</Link>
              <Link to="/register" className="btn-primary hidden sm:inline-flex">Sign up</Link>
            </>
          )}
        </div>
      </header>

      <section className="hero-gradient">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-marker-yellow ring-1 ring-white/20">
              Angeles University Foundation
            </p>
            <h1 className="text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Share more. Waste less. <span className="text-marker-yellow">Grow together.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-spruce-100">
              Pandam Pamiye is where students, teachers, and school staff lend, borrow, donate, and swap what they already own. Skip buying something you need for one week.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="btn-accent !px-5 !py-3 text-base">
                Create an account <ArrowRight size={18} />
              </Link>
            </div>
            <p className="mt-3 text-sm text-spruce-200">Already have an account? <Link to="/login" className="font-semibold text-white underline">Log in</Link></p>
          </div>
          <div className="relative mx-auto grid w-full max-w-md grid-cols-2 gap-4 lg:max-w-none" aria-label="What you can share">
            {CATEGORIES.slice(0, 6).map((c, i) => (
              <div key={c.id} className={`card flex items-center gap-3 p-4 ${['-rotate-2', 'rotate-1', 'rotate-2', '-rotate-1', '-rotate-1', 'rotate-2'][i]}`}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c.hex}22` }}>
                  <c.icon size={22} style={{ color: c.hex }} aria-hidden="true" />
                </span>
                <span className="text-sm font-bold text-spruce-900">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-label="Community totals">
        <dl className="grid grid-cols-2 gap-6 text-center sm:grid-cols-4">
          {[
            [state.resources.filter(isPublic).length, 'resources listed'],
            [waste.shares, 'completed shares'],
            [`${waste.kg} kg`, 'goods kept in use'],
            [state.users.filter((u) => u.role !== 'admin').length, 'community members'],
          ].map(([v, l]) => (
            <div key={l}>
              <dd className="font-display text-3xl font-extrabold text-spruce-700">{v}</dd>
              <dt className="text-sm text-slate-600">{l}</dt>
            </div>
          ))}
        </dl>
      </section>

      <section id="problem" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-bold text-spruce-900">Small school problems, one shared fix</h2>
        <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
          {PROBLEMS.map(([p, s]) => (
            <div key={p} className="grid gap-2 p-5 md:grid-cols-2 md:gap-8">
              <p className="text-slate-600">{p}</p>
              <p className="flex gap-3 font-semibold text-spruce-900">
                <Recycle size={20} className="mt-0.5 shrink-0 text-spruce-500" aria-hidden="true" />
                {s}
              </p>
            </div>
          ))}
        </div>
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Resource categories">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <Link to={`/marketplace?category=${c.id}`} className={`badge ${c.tint} !px-3 !py-1.5 hover:brightness-95`}>
                <c.icon size={14} aria-hidden="true" /> {c.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section id="how" className="bg-spruce-900 py-14 text-spruce-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white">How a loan works</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-xl bg-spruce-800 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-marker-yellow text-spruce-950">
                  <s.icon size={20} aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-white">
                  {i + 1}. {s.title}
                </h3>
                <p className="mt-1 text-sm text-spruce-200">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-3xl font-bold text-spruce-900">Built for a school community</h2>
        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-spruce-100 text-spruce-700">
                <f.icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-bold text-spruce-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-spruce-900">One platform, four roles</h2>
          <p className="mt-2 max-w-2xl text-slate-600">The dashboard and tools adapt to who is logged in.</p>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLES).map(([k, r]) => (
              <div key={k} className="rounded-xl border border-slate-200 p-5">
                <dt className="flex items-center gap-2 font-display text-lg font-bold text-spruce-900">
                  {k === 'admin' && <ShieldCheck size={18} className="text-spruce-600" aria-hidden="true" />}
                  {r.label}
                </dt>
                <dd className="mt-1 text-sm text-slate-600">{r.blurb}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-marker-yellow p-6">
            <div>
              <p className="font-display text-2xl font-bold text-spruce-950">Have something sitting unused?</p>
              <p className="text-spruce-900">List it in under a minute and earn your first EcoPoints.</p>
            </div>
            <Link to="/register" className="btn-primary !px-5 !py-3">Get started</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        <Logo school className="justify-center" />
        <p className="mt-3">Share more. Waste less. Grow together.</p>
        <p className="mt-1">Capstone demo. Accounts and listings are stored only in your browser.</p>
      </footer>
    </div>
  )
}
