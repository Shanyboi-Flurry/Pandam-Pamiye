import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { canManage, daysOverdue, isOverdue } from '../lib/logic'
import { cx, fmtShort, plural, relDays } from '../lib/utils'
import { EmptyState, PageHeader, Section, Tabs, DueStamp, MonthCalendar } from '../components/ui'

function Schedule() {
  const { user, state, today, resourceById, userById } = useStore()
  const events = state.borrowings
    .filter((b) => ['approved', 'pending'].includes(b.status))
    .map((b) => {
      const r = resourceById(b.resourceId)
      const role = b.borrowerId === user.id ? 'borrow' : canManage(user, r) ? 'lend' : null
      return role ? { b, role, title: r?.title || 'Item' } : null
    })
    .filter(Boolean)

  const tone = (e) =>
    isOverdue(e.b, today) ? 'bg-red-200 text-red-900' : e.b.status === 'pending' ? 'bg-amber-100 text-amber-900' : e.role === 'borrow' ? 'bg-spruce-200 text-spruce-900' : 'bg-sky-200 text-sky-900'

  const upcoming = events
    .filter((e) => e.b.status === 'approved')
    .sort((a, b) => a.b.end.localeCompare(b.b.end))

  return (
    <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
      <Section>
        <MonthCalendar
          today={today}
          renderCell={(iso) => {
            const day = events.filter((e) => iso >= e.b.start && iso <= e.b.end)
            return (
              <div className="mt-1 space-y-0.5">
                {day.slice(0, 3).map((e) => (
                  <div key={e.b.id} className={cx('truncate rounded px-1 text-[10px] font-semibold leading-4', tone(e))} title={`${e.title} (${fmtShort(e.b.start)} to ${fmtShort(e.b.end)})`}>
                    {iso === e.b.end ? `Due: ${e.title}` : iso === e.b.start ? e.title : ' '}
                  </div>
                ))}
                {day.length > 3 && <p className="text-[10px] text-slate-500">+{day.length - 3} more</p>}
              </div>
            )
          }}
        />
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-spruce-200" /> You borrow</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-sky-200" /> You lend</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-100" /> Waiting for approval</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-200" /> Overdue</span>
        </div>
      </Section>

      <Section title="Upcoming returns">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-600">No active loans. Nothing is due.</p>
        ) : (
          <ul className="space-y-3">
            {upcoming.map(({ b, role, title }) => {
              const over = isOverdue(b, today)
              return (
                <li key={b.id} className="flex items-center gap-3">
                  <DueStamp date={b.end} state={over ? 'overdue' : 'normal'} label="Due" />
                  <div className="min-w-0 flex-1 text-sm">
                    <Link to={`/resource/${b.resourceId}`} className="block truncate font-semibold text-spruce-900 hover:text-spruce-600">{title}</Link>
                    <p className="text-slate-600">{role === 'borrow' ? `Return to ${userById(b.ownerId)?.name}` : `Borrowed by ${userById(b.borrowerId)?.name}`}</p>
                    <p className={over ? 'font-semibold text-red-700' : 'text-slate-500'}>{over ? `${plural(daysOverdue(b, today), 'day')} overdue` : `Due ${relDays(b.end, today)}`}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
    </div>
  )
}

function Availability() {
  const { state, today, userById } = useStore()
  const lendable = state.resources.filter((r) => r.type === 'lend' && r.status === 'active')
  const [id, setId] = useState(lendable[0]?.id || '')
  const resource = lendable.find((r) => r.id === id)
  const bookings = state.borrowings.filter((b) => b.resourceId === id && ['approved', 'pending'].includes(b.status)).sort((a, b) => a.start.localeCompare(b.start))
  const inRange = (iso, status) => bookings.some((b) => b.status === status && iso >= b.start && iso <= b.end)

  if (!lendable.length) return <EmptyState title="Nothing to schedule yet" text="Resources that can be borrowed will show their availability here." />

  return (
    <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
      <Section>
        <div className="mb-4">
          <label htmlFor="item" className="label">Choose an item</label>
          <select id="item" className="input" value={id} onChange={(e) => setId(e.target.value)}>
            {lendable.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </div>
        <MonthCalendar
          key={id}
          today={today}
          cellClass={(iso) => (inRange(iso, 'approved') ? '!bg-red-100' : inRange(iso, 'pending') ? '!bg-amber-50' : iso >= today ? '' : '')}
          renderCell={(iso) =>
            inRange(iso, 'approved') ? <span className="mt-1 block text-[10px] font-semibold text-red-800">Booked</span> : inRange(iso, 'pending') ? <span className="mt-1 block text-[10px] font-semibold text-amber-800">Requested</span> : iso >= today ? <span className="mt-1 block text-[10px] text-emerald-700">Free</span> : null
          }
        />
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100" /> Booked (approved)</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-200" /> Requested, not yet approved</span>
        </div>
      </Section>

      <Section title="Booking schedule">
        {resource && (
          <p className="mb-3 text-sm text-slate-600">
            {resource.title}: up to {resource.maxDays} days per loan.
          </p>
        )}
        {bookings.length === 0 ? (
          <p className="text-sm text-slate-600">No bookings yet. All upcoming dates are free.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {bookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span className="font-semibold text-spruce-900">{fmtShort(b.start)} to {fmtShort(b.end)}</span>
                <span className="text-slate-500">{b.status === 'approved' ? userById(b.borrowerId)?.name.split(' ')[0] : 'Requested'}</span>
              </li>
            ))}
          </ul>
        )}
        {resource && <Link to={`/resource/${resource.id}`} className="btn-primary mt-4 w-full">Request this item</Link>}
      </Section>
    </div>
  )
}

export default function CalendarPage() {
  const [tab, setTab] = useState('schedule')
  return (
    <>
      <PageHeader title="Calendar" subtitle="See your pickups and due dates, or check when an item is free before you ask for it." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'schedule', label: 'My schedule' }, { id: 'availability', label: 'Item availability' }]} />
      {tab === 'schedule' ? <Schedule /> : <Availability />}
    </>
  )
}
