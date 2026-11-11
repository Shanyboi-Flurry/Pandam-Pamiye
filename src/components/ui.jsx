import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { CAT, TYPES } from '../lib/constants'
import { cx, fmtShort, initials, parseISO, toISO } from '../lib/utils'
import { useStore } from '../store'

const AVATAR_COLORS = ['bg-spruce-600', 'bg-sky-600', 'bg-violet-600', 'bg-amber-600', 'bg-pink-600', 'bg-teal-600', 'bg-orange-600']
const AVATAR_SIZES = { sm: 'h-7 w-7 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-14 w-14 text-lg' }

export function Avatar({ name = '?', size = 'md' }) {
  const hash = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white', AVATAR_COLORS[hash % AVATAR_COLORS.length], AVATAR_SIZES[size])} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

const STATUS = {
  pending: ['Pending', 'bg-amber-100 text-amber-800'],
  approved: ['Approved', 'bg-sky-100 text-sky-800'],
  accepted: ['Accepted', 'bg-sky-100 text-sky-800'],
  rejected: ['Declined', 'bg-slate-200 text-slate-700'],
  cancelled: ['Cancelled', 'bg-slate-200 text-slate-700'],
  returned: ['Returned', 'bg-emerald-100 text-emerald-800'],
  completed: ['Completed', 'bg-emerald-100 text-emerald-800'],
  overdue: ['Overdue', 'bg-red-100 text-red-700'],
}
export function StatusBadge({ status }) {
  const [label, cls] = STATUS[status] || [status, 'bg-slate-200 text-slate-700']
  return <span className={cx('badge', cls)}>{label}</span>
}

const TONES = {
  ok: 'bg-emerald-100 text-emerald-800',
  warn: 'bg-amber-100 text-amber-800',
  bad: 'bg-red-100 text-red-700',
  muted: 'bg-slate-200 text-slate-600',
}
export function ToneBadge({ tone = 'muted', children }) {
  return <span className={cx('badge', TONES[tone])}>{children}</span>
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-spruce-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-600">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Section({ title, action, children, className }) {
  return (
    <section className={cx('card p-5', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold text-spruce-900">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function StatCard({ icon: Icon, label, value, hint, tone = 'spruce' }) {
  const tones = {
    spruce: 'bg-spruce-100 text-spruce-700',
    coral: 'bg-red-100 text-red-700',
    amber: 'bg-amber-100 text-amber-800',
    sky: 'bg-sky-100 text-sky-700',
  }
  return (
    <div className="card flex items-start gap-3 p-4">
      <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="font-display text-2xl font-bold leading-none text-spruce-900">{value}</p>
        <p className="mt-1 text-sm font-medium text-slate-600">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      {Icon && <Icon size={28} className="mb-3 text-spruce-400" aria-hidden="true" />}
      <p className="font-display text-lg font-bold text-spruce-900">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-600">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-spruce-950/50 p-4 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-spruce-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100" aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-5 flex gap-1 overflow-x-auto border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors',
            value === t.id ? 'border-spruce-600 text-spruce-800' : 'border-transparent text-slate-500 hover:text-slate-800'
          )}
        >
          {t.label}
          {t.count > 0 && <span className={cx('rounded-full px-1.5 text-xs', t.alert ? 'bg-marker-coral text-white' : 'bg-slate-200 text-slate-700')}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={cx('pointer-events-auto flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg', t.kind === 'error' ? 'bg-red-700' : 'bg-spruce-800')}>
          {t.kind === 'error' ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="opacity-80 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}

// A library-card style stamp showing when an item is due back.
export function DueStamp({ date, state = 'normal', label = 'Due back' }) {
  const styles = {
    normal: 'border-spruce-400 text-spruce-700 bg-spruce-50',
    soon: 'border-amber-500 text-amber-800 bg-amber-50',
    overdue: 'border-marker-coral text-red-700 bg-red-50',
    done: 'border-slate-300 text-slate-500 bg-slate-50',
  }
  return (
    <div className={cx('due-stamp -rotate-2', styles[state])}>
      <p className="text-[10px] font-semibold leading-none">{label}</p>
      <p className="mt-1 text-base">{fmtShort(date)}</p>
    </div>
  )
}

// AUF seal + app name. On dark backgrounds the seal sits on a white disc so its blue outline stays visible.
export function Logo({ light = false, className, school = false }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5', className)}>
      <span className={cx('flex shrink-0 items-center justify-center rounded-full', light ? 'h-12 w-12 bg-white' : 'h-12 w-12')}>
        <img src="/auf-seal.png" alt="" className={cx('object-contain', light ? 'h-10 w-10' : 'h-12 w-12')} />
      </span>
      <span className="flex flex-col leading-none">
        <span className={cx('font-display text-lg font-extrabold whitespace-nowrap', light ? 'text-white' : 'text-spruce-900')}>Pandam Pamiye</span>
        {school && <span className={cx('mt-1 text-[10px] font-semibold uppercase tracking-wider', light ? 'text-marker-yellow' : 'text-spruce-600')}>Angeles University Foundation</span>}
      </span>
    </span>
  )
}

export function ResourceThumb({ resource, className, iconSize = 40 }) {
  const cat = CAT[resource.category]
  const Icon = cat.icon
  if (resource.image) {
    return <img src={resource.image} alt={resource.title} className={cx('object-cover', className)} />
  }
  return (
    <div className={cx('flex items-center justify-center', className)} style={{ background: `linear-gradient(135deg, ${cat.hex}1f, ${cat.hex}45)` }} role="img" aria-label={cat.label}>
      <Icon size={iconSize} style={{ color: cat.hex }} aria-hidden="true" />
    </div>
  )
}

export function ResourceCard({ resource, availability, owner, reasons }) {
  const type = TYPES[resource.type]
  return (
    <Link to={`/resource/${resource.id}`} className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <div className="relative">
        <ResourceThumb resource={resource} className="h-36 w-full" />
        <span className={cx('badge absolute left-3 top-3', type.cls)}>{type.tag}</span>
        {resource.schoolOwned && <span className="badge absolute right-3 top-3 bg-spruce-800 text-white">School</span>}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base font-bold leading-snug text-spruce-900 group-hover:text-spruce-600">{resource.title}</h3>
        <p className="text-xs text-slate-500">
          {CAT[resource.category].short} &middot; {resource.condition}
          {owner ? <> &middot; {owner.name}</> : null}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-1">
          <ToneBadge tone={availability.tone}>{availability.label}</ToneBadge>
          {reasons?.slice(0, 2).map((r) => (
            <span key={r} className="badge bg-marker-yellow/60 text-spruce-900">
              {r}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Generic month grid. The parent decides what each day shows and how it is styled,
 * so the same component serves item availability and personal schedules.
 */
export function MonthCalendar({ today, renderCell, cellClass, onDayClick, compact = false }) {
  const [cursor, setCursor] = useState(() => {
    const d = parseISO(today)
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const offset = cursor.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const rows = Math.ceil((offset + daysInMonth) / 7)

  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const date = new Date(year, month, i - offset + 1)
    return { iso: toISO(date), day: date.getDate(), inMonth: date.getMonth() === month }
  })

  const shift = (n) => setCursor(new Date(year, month + n, 1))
  const title = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold text-spruce-900">{title}</h3>
        <div className="flex gap-1">
          <button className="btn-ghost btn-sm" onClick={() => shift(-1)} aria-label="Previous month">
            <ChevronLeft size={16} />
          </button>
          <button className="btn-ghost btn-sm" onClick={() => { const d = parseISO(today); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)) }}>
            Today
          </button>
          <button className="btn-ghost btn-sm" onClick={() => shift(1)} aria-label="Next month">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm">
        {WEEKDAYS.map((w) => (
          <div key={w} className="bg-slate-50 py-1.5 text-center text-xs font-semibold text-slate-500">
            {w}
          </div>
        ))}
        {cells.map((c) => {
          const base = cx(
            'relative bg-white text-left',
            compact ? 'h-10 p-1' : 'min-h-[88px] p-1.5',
            !c.inMonth && 'bg-slate-50 text-slate-400',
            c.iso === today && 'ring-2 ring-inset ring-spruce-500',
            cellClass?.(c.iso, c.inMonth)
          )
          const inner = (
            <>
              <span className={cx('text-xs font-semibold', c.iso === today && 'text-spruce-700')}>{c.day}</span>
              {renderCell?.(c.iso, c.inMonth)}
            </>
          )
          return onDayClick ? (
            <button key={c.iso} type="button" className={cx(base, 'hover:bg-spruce-50')} onClick={() => onDayClick(c.iso)} aria-label={c.iso}>
              {inner}
            </button>
          ) : (
            <div key={c.iso} className={base}>
              {inner}
            </div>
          )
        })}
      </div>
    </div>
  )
}
