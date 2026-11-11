import { Link } from 'react-router-dom'
import { CheckCircle2, Inbox, Package, Pause, Pencil, Play, PlusCircle, Trash2, Store } from 'lucide-react'
import { useStore } from '../store'
import { availabilityOf } from '../lib/logic'
import { TYPES } from '../lib/constants'
import { cx } from '../lib/utils'
import { EmptyState, PageHeader, StatCard, ToneBadge, ResourceThumb } from '../components/ui'

export default function MyListings() {
  const { user, state, today, togglePause, removeResource, notify } = useStore()
  const school = user.role === 'staff' || user.role === 'admin'
  const list = state.resources
    .filter((r) => r.ownerId === user.id || (school && r.schoolOwned))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const pendingFor = (id) =>
    state.borrowings.filter((b) => b.resourceId === id && b.status === 'pending').length +
    state.claims.filter((c) => c.resourceId === id && c.status === 'pending').length +
    state.exchanges.filter((e) => e.resourceId === id && e.status === 'pending').length

  const run = (res, msg) => (res.ok ? notify(msg) : notify(res.error, 'error'))
  const active = list.filter((r) => r.status === 'active')
  const done = list.filter((r) => r.status === 'claimed' || r.status === 'exchanged')
  const pending = list.reduce((s, r) => s + pendingFor(r.id), 0)

  const title = { student: 'My listings', teacher: 'My shared resources', staff: 'School resources', admin: 'My listings' }[user.role]

  return (
    <>
      <PageHeader
        title={title}
        subtitle={school ? 'Resources you own, plus official school resources you can manage.' : 'Everything you are sharing. Pause a listing when you need the item yourself.'}
        actions={<Link to="/add" className="btn-primary"><PlusCircle size={16} /> Add a resource</Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Store} label="Live listings" value={active.length} />
        <StatCard icon={Inbox} label="Requests to answer" value={pending} tone="amber" />
        <StatCard icon={CheckCircle2} label="Given away or swapped" value={done.length} tone="sky" />
      </div>

      {list.length === 0 ? (
        <EmptyState icon={Package} title="You have not listed anything" text="Share something you are not using. You earn EcoPoints for every listing." action={<Link to="/add" className="btn-primary">Add your first resource</Link>} />
      ) : (
        <div className="space-y-3">
          {list.map((r) => {
            const a = availabilityOf(r, state.borrowings, today)
            const p = pendingFor(r.id)
            const t = TYPES[r.type]
            return (
              <div key={r.id} className={cx('card flex flex-col gap-3 p-4 md:flex-row md:items-center', r.status === 'removed' && 'opacity-60')}>
                <ResourceThumb resource={r} className="h-16 w-16 shrink-0 rounded-lg" iconSize={24} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link to={`/resource/${r.id}`} className="font-bold text-spruce-900 hover:text-spruce-600">{r.title}</Link>
                    <span className={cx('badge', t.cls)}>{t.tag}</span>
                    <ToneBadge tone={a.tone}>{a.label}</ToneBadge>
                    {r.schoolOwned && <span className="badge bg-spruce-800 text-white">School</span>}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {r.condition} &middot; listed {r.createdAt}
                    {r.ownerId !== user.id && ' · owned by a colleague'}
                  </p>
                  {r.status === 'rejected' && <p className="mt-1 text-sm text-red-700">Not approved{r.reviewNote ? `: ${r.reviewNote}` : '.'} Edit and save to resubmit.</p>}
                  {p > 0 && <p className="mt-1 text-sm font-semibold text-amber-700">{p} {p === 1 ? 'request needs' : 'requests need'} your answer</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/resource/${r.id}`} className="btn-ghost btn-sm">View</Link>
                  {r.status !== 'removed' && <Link to={`/add/${r.id}`} className="btn-ghost btn-sm"><Pencil size={14} /> Edit</Link>}
                  {(r.status === 'active' || r.status === 'paused') && (
                    <button className="btn-ghost btn-sm" onClick={() => run(togglePause(r.id), r.status === 'active' ? 'Listing paused.' : 'Listing is live again.')}>
                      {r.status === 'active' ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
                    </button>
                  )}
                  {r.status !== 'removed' && (
                    <button
                      className="btn-ghost btn-sm text-red-700"
                      onClick={() => window.confirm(`Remove "${r.title}"? Pending requests will be declined.`) && run(removeResource(r.id), 'Listing removed.')}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
