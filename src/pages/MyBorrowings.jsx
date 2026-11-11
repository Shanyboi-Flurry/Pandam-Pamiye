import { useSearchParams, Link } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Search } from 'lucide-react'
import { useStore } from '../store'
import { canManage, isOverdue } from '../lib/logic'
import { plural } from '../lib/utils'
import { BorrowingCard } from '../components/RequestCards'
import { EmptyState, PageHeader, Tabs } from '../components/ui'

function Group({ title, items, as }) {
  if (!items.length) return null
  return (
    <section className="mb-8" aria-label={title}>
      <h2 className="mb-3 text-lg font-bold text-spruce-900">{title} <span className="text-sm font-medium text-slate-500">({items.length})</span></h2>
      <div className="space-y-3">{items.map((b) => <BorrowingCard key={b.id} b={b} as={as} />)}</div>
    </section>
  )
}

export default function MyBorrowings() {
  const { user, state, today, resourceById } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'incoming' ? 'incoming' : 'borrowing'

  const mine = state.borrowings.filter((b) => b.borrowerId === user.id)
  const managed = state.borrowings.filter((b) => b.borrowerId !== user.id && canManage(user, resourceById(b.resourceId)))
  const byStart = (a, b) => b.start.localeCompare(a.start)
  const byEnd = (a, b) => a.end.localeCompare(b.end)

  const overdueMine = mine.filter((b) => isOverdue(b, today)).sort(byEnd)
  const activeMine = mine.filter((b) => b.status === 'approved' && !isOverdue(b, today)).sort(byEnd)
  const pendingMine = mine.filter((b) => b.status === 'pending').sort(byStart)
  const historyMine = mine.filter((b) => ['returned', 'rejected', 'cancelled'].includes(b.status)).sort(byStart)

  const pendingIn = managed.filter((b) => b.status === 'pending').sort(byStart)
  const overdueIn = managed.filter((b) => isOverdue(b, today)).sort(byEnd)
  const activeIn = managed.filter((b) => b.status === 'approved' && !isOverdue(b, today)).sort(byEnd)
  const historyIn = managed.filter((b) => ['returned', 'rejected', 'cancelled'].includes(b.status)).sort(byStart)

  return (
    <>
      <PageHeader
        title="My borrowings"
        subtitle="Track what you borrowed, what others borrowed from you, and when everything is due."
        actions={<Link to="/marketplace" className="btn-primary"><Search size={16} /> Find something to borrow</Link>}
      />
      <Tabs
        value={tab}
        onChange={(t) => setParams(t === 'incoming' ? { tab: 'incoming' } : {})}
        tabs={[
          { id: 'borrowing', label: 'I am borrowing', count: overdueMine.length + activeMine.length + pendingMine.length, alert: overdueMine.length > 0 },
          { id: 'incoming', label: 'Lent out and requests', count: pendingIn.length + overdueIn.length, alert: true },
        ]}
      />

      {tab === 'borrowing' ? (
        <>
          {overdueMine.length > 0 && (
            <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
              <AlertTriangle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p>You have {plural(overdueMine.length, 'overdue item')}. Return {overdueMine.length === 1 ? 'it' : 'them'} to the owner. You cannot send new borrow requests until then.</p>
            </div>
          )}
          {mine.length === 0 ? (
            <EmptyState icon={ClipboardList} title="You have not borrowed anything yet" text="Find a calculator, a reviewer, or equipment for your next project." action={<Link to="/marketplace" className="btn-primary">Browse marketplace</Link>} />
          ) : (
            <>
              <Group title="Overdue" items={overdueMine} as="borrower" />
              <Group title="On loan" items={activeMine} as="borrower" />
              <Group title="Waiting for approval" items={pendingMine} as="borrower" />
              <Group title="History" items={historyMine} as="borrower" />
            </>
          )}
        </>
      ) : managed.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests yet" text="When someone asks to borrow one of your items, it shows up here." action={<Link to="/add" className="btn-primary">Add a resource</Link>} />
      ) : (
        <>
          <Group title="Needs your answer" items={pendingIn} as="manager" />
          <Group title="Overdue returns" items={overdueIn} as="manager" />
          <Group title="Currently on loan" items={activeIn} as="manager" />
          <Group title="History" items={historyIn} as="manager" />
        </>
      )}
    </>
  )
}
