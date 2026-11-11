import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, MessageSquare, Pause, Pencil, Play, Trash2, TrendingUp } from 'lucide-react'
import { useStore } from '../store'
import { availabilityOf, canManage, hasConflict } from '../lib/logic'
import { CAT, ROLES, TYPES } from '../lib/constants'
import { addDays, cx, daysBetween, fmtDate, fmtShort } from '../lib/utils'
import { Avatar, EmptyState, Section, ToneBadge, ResourceCard, MonthCalendar, ResourceThumb } from '../components/ui'
import { BorrowingCard, ClaimCard, ExchangeCard } from '../components/RequestCards'

function BorrowPanel({ resource }) {
  const { state, today, requestBorrow, notify } = useStore()
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [error, setError] = useState('')

  const days = start && end && end >= start ? daysBetween(start, end) + 1 : 0
  const conflict = start && end && end >= start ? hasConflict(state.borrowings, resource.id, start, end) : null
  const tooLong = days > resource.maxDays
  const bookings = state.borrowings.filter((b) => b.resourceId === resource.id && b.status === 'approved')

  const pick = (iso) => {
    if (iso < today) return
    setError('')
    if (!start || (start && end) || iso < start) {
      setStart(iso)
      setEnd('')
    } else setEnd(iso)
  }

  const bookedOn = (iso) => bookings.some((b) => iso >= b.start && iso <= b.end)
  const inSel = (iso) => start && iso >= start && iso <= (end || start)

  const submit = (e) => {
    e.preventDefault()
    const res = requestBorrow({ resourceId: resource.id, start, end, purpose })
    if (!res.ok) return setError(res.error)
    notify('Request sent. The owner will review it.')
    setStart(''); setEnd(''); setPurpose(''); setError('')
  }

  return (
    <Section title="Request to borrow">
      <p className="mb-3 text-sm text-slate-600">Pick your pickup and return dates. Maximum loan: {resource.maxDays} days.</p>
      <MonthCalendar
        compact
        today={today}
        onDayClick={pick}
        cellClass={(iso) => cx(iso < today && 'text-slate-300', bookedOn(iso) ? '!bg-red-100 text-red-800' : inSel(iso) ? '!bg-spruce-200' : '')}
        renderCell={(iso) => (bookedOn(iso) ? <span className="absolute bottom-0.5 left-1 text-[9px] font-semibold">Booked</span> : null)}
      />
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-red-100" /> Booked</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-spruce-200" /> Your dates</span>
      </div>

      <form onSubmit={submit} className="mt-4 space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start" className="label">Pickup</label>
            <input id="start" type="date" min={today} className="input" value={start} onChange={(e) => { setStart(e.target.value); setError('') }} />
          </div>
          <div>
            <label htmlFor="end" className="label">Return by</label>
            <input id="end" type="date" min={start || today} max={start ? addDays(start, resource.maxDays - 1) : undefined} className="input" value={end} onChange={(e) => { setEnd(e.target.value); setError('') }} />
          </div>
        </div>
        <div>
          <label htmlFor="purpose" className="label">What will you use it for?</label>
          <input id="purpose" className="input" placeholder="Physics long exam" value={purpose} onChange={(e) => setPurpose(e.target.value)} />
        </div>
        {conflict && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> Already reserved from {fmtShort(conflict.start)} to {fmtShort(conflict.end)}. Choose different dates.
          </p>
        )}
        {!conflict && tooLong && <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">That is {days} days. This item can be borrowed for up to {resource.maxDays}.</p>}
        {!conflict && !tooLong && days > 0 && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">Free for those {days} {days === 1 ? 'day' : 'days'}. Ready to send.</p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full" disabled={!start || !end || !!conflict || tooLong}>Send borrow request</button>
      </form>
    </Section>
  )
}

function ClaimPanel({ resource }) {
  const { requestClaim, notify } = useStore()
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const res = requestClaim({ resourceId: resource.id, message })
    if (!res.ok) return setError(res.error)
    notify('Request sent to the donor.')
    setMessage(''); setError('')
  }
  return (
    <Section title="Claim this item for free">
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label htmlFor="msg" className="label">Tell the donor why you need it</label>
          <textarea id="msg" rows={3} className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="I am joining the art club and would use these every week." />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full">Send claim request</button>
      </form>
    </Section>
  )
}

function SwapPanel({ resource }) {
  const { requestExchange, notify } = useStore()
  const [form, setForm] = useState({ offerTitle: '', offerDescription: '', message: '' })
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    const res = requestExchange({ resourceId: resource.id, ...form })
    if (!res.ok) return setError(res.error)
    notify('Swap offer sent.')
    setForm({ offerTitle: '', offerDescription: '', message: '' }); setError('')
  }
  return (
    <Section title="Offer a swap">
      {resource.wanted && <p className="mb-3 rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-900"><span className="font-semibold">Owner is looking for:</span> {resource.wanted}</p>}
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div>
          <label htmlFor="ot" className="label">What will you offer?</label>
          <input id="ot" className="input" value={form.offerTitle} onChange={set('offerTitle')} placeholder="Statistics textbook (Walpole)" />
        </div>
        <div>
          <label htmlFor="od" className="label">Condition and details</label>
          <input id="od" className="input" value={form.offerDescription} onChange={set('offerDescription')} placeholder="Clean copy, a few pencil notes" />
        </div>
        <div>
          <label htmlFor="om" className="label">Message (optional)</label>
          <textarea id="om" rows={2} className="input" value={form.message} onChange={set('message')} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full">Send swap offer</button>
      </form>
    </Section>
  )
}

export default function ResourceDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, state, today, resourceById, userById, demand, togglePause, removeResource, notify } = useStore()
  const resource = resourceById(id)

  const similar = useMemo(() => {
    if (!resource) return []
    return state.resources
      .filter((r) => r.id !== resource.id && r.status === 'active' && (r.category === resource.category || r.tags.some((t) => resource.tags.includes(t))))
      .slice(0, 3)
  }, [state.resources, resource])

  const hiddenFromUser = resource && ['pending', 'rejected'].includes(resource.status) && resource.ownerId !== user.id && user.role !== 'admin'
  if (!resource || hiddenFromUser || (resource.status === 'removed' && user.role !== 'admin')) {
    return <EmptyState title="This listing is not available" text="It may have been removed by its owner." action={<Link to="/marketplace" className="btn-primary">Back to resources</Link>} />
  }

  const owner = userById(resource.ownerId)
  const type = TYPES[resource.type]
  const cat = CAT[resource.category]
  const a = availabilityOf(resource, state.borrowings, today)
  const manage = canManage(user, resource)
  const isOwner = resource.ownerId === user.id
  const open = resource.status === 'active'

  const run = (res, msg) => (res.ok ? notify(msg) : notify(res.error, 'error'))
  const reqs = {
    borrow: state.borrowings.filter((b) => b.resourceId === resource.id && ['pending', 'approved'].includes(b.status)),
    claims: state.claims.filter((c) => c.resourceId === resource.id && ['pending', 'approved'].includes(c.status)),
    swaps: state.exchanges.filter((e) => e.resourceId === resource.id && ['pending', 'accepted'].includes(e.status)),
  }

  return (
    <>
      <Link to="/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-spruce-700 hover:underline">
        <ArrowLeft size={16} /> Back to resources
      </Link>

      {resource.status === 'pending' && (
        <div role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Awaiting administrator approval.</strong> Only you and the administrator can see this listing until it is approved.
        </div>
      )}
      {resource.status === 'rejected' && (
        <div role="alert" className="mb-4 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <strong>This listing was not approved.</strong> {resource.reviewNote || 'No reason was given.'} Edit it and save to send it for review again.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <ResourceThumb resource={resource} className="h-64 w-full sm:h-80" iconSize={72} />
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cx('badge', type.cls)}>{type.tag}</span>
                <ToneBadge tone={a.tone}>{a.label}</ToneBadge>
                {resource.schoolOwned && <span className="badge bg-spruce-800 text-white">School resource</span>}
                {resource.status === 'removed' && <span className="badge bg-red-100 text-red-700">Removed</span>}
                {a.note && <span className="text-xs text-slate-500">{a.note}</span>}
              </div>
              <h1 className="mt-3 text-2xl font-bold text-spruce-900 sm:text-3xl">{resource.title}</h1>
              <p className="mt-3 whitespace-pre-line text-slate-700">{resource.description}</p>

              <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                {[
                  ['Category', cat.label],
                  ['Condition', resource.condition],
                  ['Type', type.label],
                  resource.type === 'lend' ? ['Max loan', `${resource.maxDays} days`] : null,
                  resource.type === 'exchange' && resource.wanted ? ['Wants in return', resource.wanted] : null,
                  ['Listed', fmtDate(resource.createdAt)],
                ].filter(Boolean).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs font-semibold text-slate-500">{k}</dt>
                    <dd className="font-semibold text-spruce-900">{v}</dd>
                  </div>
                ))}
              </dl>

              {resource.tags.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Tags">
                  {resource.tags.map((t) => <li key={t} className="badge bg-slate-100 text-slate-700">{t}</li>)}
                </ul>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3">
                  <Avatar name={owner?.name} />
                  <div>
                    <p className="text-sm font-semibold text-spruce-900">{owner?.name}</p>
                    <p className="text-xs text-slate-500">{ROLES[owner?.role]?.label}{owner?.dept ? `, ${owner.dept}` : ''}</p>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-sm text-slate-600"><TrendingUp size={16} aria-hidden="true" /> Requested {demand[resource.id] || 0} {(demand[resource.id] || 0) === 1 ? 'time' : 'times'}</p>
                {!isOwner && owner && owner.role !== 'admin' && (
                  <Link to={`/messages?to=${owner.id}&resource=${resource.id}`} className="btn-ghost btn-sm ml-auto">
                    <MessageSquare size={14} /> Message {owner.name.split(' ')[0]}
                  </Link>
                )}
              </div>
            </div>
          </div>

          {manage && (
            <Section title={isOwner ? 'You own this listing' : 'You can manage this listing'}>
              <div className="flex flex-wrap gap-2">
                <Link to={`/add/${resource.id}`} className="btn-ghost"><Pencil size={16} /> Edit</Link>
                {(resource.status === 'active' || resource.status === 'paused') && (
                  <button className="btn-ghost" onClick={() => run(togglePause(resource.id), resource.status === 'active' ? 'Listing paused.' : 'Listing is live again.')}>
                    {resource.status === 'active' ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume</>}
                  </button>
                )}
                {resource.status !== 'removed' && (
                  <button className="btn-ghost text-red-700" onClick={() => { if (window.confirm('Remove this listing? Pending requests will be declined.')) { const res = removeResource(resource.id); if (res.ok) { notify('Listing removed.'); navigate('/listings') } else notify(res.error, 'error') } }}>
                    <Trash2 size={16} /> Remove
                  </button>
                )}
              </div>
              {reqs.borrow.length + reqs.claims.length + reqs.swaps.length > 0 && (
                <div className="mt-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Open requests</p>
                  {reqs.borrow.map((b) => <BorrowingCard key={b.id} b={b} as="manager" />)}
                  {reqs.claims.map((c) => <ClaimCard key={c.id} c={c} as="manager" />)}
                  {reqs.swaps.map((e) => <ExchangeCard key={e.id} e={e} as="manager" />)}
                </div>
              )}
            </Section>
          )}
        </div>

        <div className="space-y-6">
          {!isOwner && open && resource.type === 'lend' && <BorrowPanel resource={resource} />}
          {!isOwner && open && resource.type === 'donate' && <ClaimPanel resource={resource} />}
          {!isOwner && open && resource.type === 'exchange' && <SwapPanel resource={resource} />}
          {!isOwner && !open && resource.status !== 'removed' && (
            <Section title="Not open right now">
              <p className="text-sm text-slate-600">{resource.status === 'paused' ? 'The owner paused this listing.' : 'This item has already found a new home.'} Browse similar items below.</p>
            </Section>
          )}
          {isOwner && (
            <Section title="Your listing">
              <p className="text-sm text-slate-600">People will see this page when they find your resource. Requests appear below the details and in your dashboard.</p>
            </Section>
          )}
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-10" aria-label="Similar resources">
          <h2 className="mb-4 text-xl font-bold text-spruce-900">You may also like</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((r) => <ResourceCard key={r.id} resource={r} availability={availabilityOf(r, state.borrowings, today)} owner={userById(r.ownerId)} />)}
          </div>
        </section>
      )}
    </>
  )
}
