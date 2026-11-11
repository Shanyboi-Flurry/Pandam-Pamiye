import { Link } from 'react-router-dom'
import { Check, PackageCheck, X } from 'lucide-react'
import { useStore } from '../store'
import { daysOverdue, hasConflict, isDueSoon, isOverdue } from '../lib/logic'
import { cx, fmtDate, fmtShort, plural } from '../lib/utils'
import { DueStamp, StatusBadge, ResourceThumb } from './ui'

function useRun() {
  const { notify } = useStore()
  return (res, msg) => (res.ok ? notify(typeof msg === 'function' ? msg(res) : msg) : notify(res.error, 'error'))
}

const Approve = ({ onClick, disabled, children = 'Approve' }) => (
  <button className="btn-primary btn-sm" disabled={disabled} onClick={onClick}>
    <Check size={14} /> {children}
  </button>
)
const Decline = ({ onClick }) => (
  <button className="btn-ghost btn-sm" onClick={onClick}>
    <X size={14} /> Decline
  </button>
)
const Cancel = ({ onClick }) => (
  <button className="btn-ghost btn-sm" onClick={onClick}>
    Cancel
  </button>
)
const Done = ({ onClick, children }) => (
  <button className="btn-primary btn-sm" onClick={onClick}>
    <PackageCheck size={14} /> {children}
  </button>
)

function Shell({ resource, children, stamp, actions, highlight }) {
  return (
    <div className={cx('card flex flex-col gap-3 p-4 md:flex-row md:items-center', highlight && 'border-red-300 bg-red-50/40')}>
      <ResourceThumb resource={resource} className="h-16 w-16 shrink-0 rounded-lg" iconSize={24} />
      <div className="min-w-0 flex-1">{children}</div>
      {stamp}
      {actions && <div className="flex flex-wrap gap-2 md:justify-end">{actions}</div>}
    </div>
  )
}

function Title({ resource, status, extra }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={`/resource/${resource.id}`} className="font-bold text-spruce-900 hover:text-spruce-600">{resource.title}</Link>
      <StatusBadge status={status} />
      {extra}
    </div>
  )
}

export function BorrowingCard({ b, as = 'borrower' }) {
  const { resourceById, userById, today, state, decideBorrow, markReturned, cancelBorrow } = useStore()
  const run = useRun()
  const r = resourceById(b.resourceId)
  if (!r) return null
  const overdue = isOverdue(b, today)
  const soon = isDueSoon(b, today)
  const other = userById(as === 'borrower' ? b.ownerId : b.borrowerId)
  const conflict = b.status === 'pending' && hasConflict(state.borrowings, b.resourceId, b.start, b.end, b.id)
  const stampState = overdue ? 'overdue' : soon ? 'soon' : ['returned', 'rejected', 'cancelled'].includes(b.status) ? 'done' : 'normal'

  const actions = []
  if (as === 'manager' && b.status === 'pending') {
    actions.push(
      <Approve key="a" disabled={!!conflict} onClick={() => run(decideBorrow(b.id, true), (res) => (res.declined ? `Approved. ${plural(res.declined, 'overlapping request')} declined automatically.` : 'Request approved.'))} />,
      <Decline key="d" onClick={() => run(decideBorrow(b.id, false), 'Request declined.')} />
    )
  }
  if (as === 'manager' && b.status === 'approved') {
    actions.push(
      <Done key="r" onClick={() => run(markReturned(b.id), (res) => (res.onTime ? 'Marked as returned. EcoPoints awarded.' : 'Marked as returned late.'))}>Mark as returned</Done>
    )
  }
  if (as === 'borrower' && (b.status === 'pending' || (b.status === 'approved' && b.start > today))) {
    actions.push(
      <Cancel key="c" onClick={() => run(cancelBorrow(b.id), 'Request cancelled.')} />
    )
  }

  return (
    <Shell
      resource={r}
      highlight={overdue}
      stamp={b.status === 'approved' || b.status === 'returned' ? <DueStamp date={b.end} state={stampState} label={b.status === 'returned' ? 'Was due' : 'Due back'} /> : null}
      actions={actions}
    >
      <Title resource={r} status={overdue ? 'overdue' : b.status} />
      <p className="mt-1 text-sm text-slate-600">
        {fmtShort(b.start)} to {fmtShort(b.end)} &middot; {as === 'borrower' ? 'Owner' : 'Borrower'}: {other?.name || 'Unknown'}
      </p>
      {b.purpose && <p className="text-sm text-slate-500">For: {b.purpose}</p>}
      {overdue && <p className="mt-1 text-sm font-semibold text-red-700">{plural(daysOverdue(b, today), 'day')} overdue. {as === 'borrower' ? 'Return it to the owner as soon as you can.' : 'Remind the borrower to return it.'}</p>}
      {b.status === 'returned' && <p className="mt-1 text-sm text-emerald-700">Returned {fmtDate(b.returnedAt)} {b.returnedAt <= b.end ? '(on time)' : '(late)'}</p>}
      {b.status === 'rejected' && b.note && <p className="mt-1 text-sm text-slate-500">Reason: {b.note}</p>}
      {conflict && <p className="mt-1 text-sm font-semibold text-amber-700">These dates overlap an approved booking ({fmtShort(conflict.start)} to {fmtShort(conflict.end)}), so this request cannot be approved.</p>}
    </Shell>
  )
}

export function ClaimCard({ c, as = 'requester' }) {
  const { resourceById, userById, decideClaim, completeClaim, cancelClaim } = useStore()
  const run = useRun()
  const r = resourceById(c.resourceId)
  if (!r) return null
  const other = userById(as === 'requester' ? c.ownerId : c.requesterId)
  const actions = []
  if (as === 'manager' && c.status === 'pending') {
    actions.push(
      <Approve key="a" onClick={() => run(decideClaim(c.id, true), 'Approved. Arrange a handover with the requester.')} />,
      <Decline key="d" onClick={() => run(decideClaim(c.id, false), 'Request declined.')} />
    )
  }
  if (as === 'manager' && c.status === 'approved') {
    actions.push(
      <Done key="r" onClick={() => run(completeClaim(c.id), 'Donation completed. EcoPoints awarded.')}>Mark as handed over</Done>
    )
  }
  if (as === 'requester' && c.status === 'pending') {
    actions.push(
      <Cancel key="c" onClick={() => run(cancelClaim(c.id), 'Request cancelled.')} />
    )
  }
  return (
    <Shell resource={r} actions={actions}>
      <Title resource={r} status={c.status} />
      <p className="mt-1 text-sm text-slate-600">
        {as === 'requester' ? 'Donor' : 'Requested by'}: {other?.name || 'Unknown'} &middot; {fmtDate(c.createdAt)}
      </p>
      {c.message && <p className="text-sm text-slate-500">"{c.message}"</p>}
      {c.status === 'approved' && as === 'requester' && <p className="mt-1 text-sm text-sky-700">Approved. Contact the donor to arrange pickup.</p>}
      {c.status === 'completed' && <p className="mt-1 text-sm text-emerald-700">Handed over {fmtDate(c.completedAt)}</p>}
      {c.status === 'rejected' && c.note && <p className="mt-1 text-sm text-slate-500">Reason: {c.note}</p>}
    </Shell>
  )
}

export function ExchangeCard({ e, as = 'requester' }) {
  const { resourceById, userById, decideExchange, completeExchange, cancelExchange } = useStore()
  const run = useRun()
  const r = resourceById(e.resourceId)
  if (!r) return null
  const other = userById(as === 'requester' ? e.ownerId : e.requesterId)
  const actions = []
  if (as === 'manager' && e.status === 'pending') {
    actions.push(
      <Approve key="a" onClick={() => run(decideExchange(e.id, true), 'Offer accepted. Arrange the swap.')}>Accept</Approve>,
      <Decline key="d" onClick={() => run(decideExchange(e.id, false), 'Offer declined.')} />
    )
  }
  if (e.status === 'accepted') {
    actions.push(
      <Done key="r" onClick={() => run(completeExchange(e.id), 'Swap completed. EcoPoints awarded to both of you.')}>Mark swap as done</Done>
    )
  }
  if (as === 'requester' && e.status === 'pending') {
    actions.push(
      <Cancel key="c" onClick={() => run(cancelExchange(e.id), 'Offer cancelled.')} />
    )
  }
  return (
    <Shell resource={r} actions={actions}>
      <Title resource={r} status={e.status} />
      <p className="mt-1 text-sm text-slate-600">
        {as === 'requester' ? 'Owner' : 'Offer from'}: {other?.name || 'Unknown'} &middot; {fmtDate(e.createdAt)}
      </p>
      <p className="text-sm text-slate-700">
        <span className="font-semibold">Offering:</span> {e.offerTitle}
        {e.offerDescription ? <span className="text-slate-500"> ({e.offerDescription})</span> : null}
      </p>
      {e.message && <p className="text-sm text-slate-500">"{e.message}"</p>}
      {e.status === 'completed' && <p className="mt-1 text-sm text-emerald-700">Swapped {fmtDate(e.completedAt)}</p>}
      {e.status === 'rejected' && e.note && <p className="mt-1 text-sm text-slate-500">Reason: {e.note}</p>}
    </Shell>
  )
}
