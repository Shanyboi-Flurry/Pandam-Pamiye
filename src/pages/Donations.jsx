import { Link, useSearchParams } from 'react-router-dom'
import { Gift, HandHeart } from 'lucide-react'
import { useStore } from '../store'
import { availabilityOf, canManage } from '../lib/logic'
import { EmptyState, PageHeader, StatCard, Tabs, ResourceCard } from '../components/ui'
import { ClaimCard } from '../components/RequestCards'

export default function Donations() {
  const { user, state, today, resourceById, userById } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = ['mine', 'claims'].includes(params.get('tab')) ? params.get('tab') : 'browse'

  const free = state.resources.filter((r) => r.type === 'donate' && r.status === 'active' && r.ownerId !== user.id)
  const managed = state.claims.filter((c) => canManage(user, resourceById(c.resourceId)))
  const needAnswer = managed.filter((c) => c.status === 'pending')
  const inProgress = managed.filter((c) => c.status === 'approved')
  const history = managed.filter((c) => ['completed', 'rejected', 'cancelled'].includes(c.status))
  const myClaims = state.claims.filter((c) => c.requesterId === user.id)
  const donated = state.claims.filter((c) => c.ownerId === user.id && c.status === 'completed').length
  const received = state.claims.filter((c) => c.requesterId === user.id && c.status === 'completed').length

  const Group = ({ title, items, as }) =>
    items.length ? (
      <section className="mb-8" aria-label={title}>
        <h2 className="mb-3 text-lg font-bold text-spruce-900">{title} <span className="text-sm font-medium text-slate-500">({items.length})</span></h2>
        <div className="space-y-3">{items.map((c) => <ClaimCard key={c.id} c={c} as={as} />)}</div>
      </section>
    ) : null

  return (
    <>
      <PageHeader
        title="Donations"
        subtitle="Give away what you no longer need, or claim something free from the community."
        actions={<Link to="/add?type=donate" className="btn-primary"><Gift size={16} /> Donate an item</Link>}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Gift} label="Free items available" value={free.length} />
        <StatCard icon={HandHeart} label="Items you donated" value={donated} tone="sky" />
        <StatCard icon={Gift} label="Items you received" value={received} tone="amber" />
      </div>
      <Tabs
        value={tab}
        onChange={(t) => setParams(t === 'browse' ? {} : { tab: t })}
        tabs={[
          { id: 'browse', label: 'Browse free items', count: free.length },
          { id: 'mine', label: 'My donations', count: needAnswer.length + inProgress.length, alert: needAnswer.length > 0 },
          { id: 'claims', label: 'My requests', count: myClaims.filter((c) => ['pending', 'approved'].includes(c.status)).length },
        ]}
      />

      {tab === 'browse' &&
        (free.length === 0 ? (
          <EmptyState icon={Gift} title="No free items right now" text="Check back soon, or donate something you no longer use." action={<Link to="/add?type=donate" className="btn-primary">Donate an item</Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {free.map((r) => <ResourceCard key={r.id} resource={r} availability={availabilityOf(r, state.borrowings, today)} owner={userById(r.ownerId)} />)}
          </div>
        ))}

      {tab === 'mine' &&
        (managed.length === 0 ? (
          <EmptyState icon={HandHeart} title="No donation activity yet" text="List an item as a donation and requests will appear here." action={<Link to="/add?type=donate" className="btn-primary">Donate an item</Link>} />
        ) : (
          <>
            <Group title="Needs your answer" items={needAnswer} as="manager" />
            <Group title="Approved, waiting for handover" items={inProgress} as="manager" />
            <Group title="Donation history" items={history} as="manager" />
          </>
        ))}

      {tab === 'claims' &&
        (myClaims.length === 0 ? (
          <EmptyState icon={Gift} title="You have not asked for anything" text="Browse free items and send a short note to the donor." action={<button className="btn-primary" onClick={() => setParams({})}>Browse free items</button>} />
        ) : (
          <Group title="Your requests" items={myClaims} as="requester" />
        ))}
    </>
  )
}
