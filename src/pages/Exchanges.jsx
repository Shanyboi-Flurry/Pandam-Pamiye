import { Link, useSearchParams } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { useStore } from '../store'
import { availabilityOf, canManage } from '../lib/logic'
import { EmptyState, PageHeader, Tabs, ResourceCard } from '../components/ui'
import { ExchangeCard } from '../components/RequestCards'

export default function Exchanges() {
  const { user, state, today, resourceById, userById } = useStore()
  const [params, setParams] = useSearchParams()
  const tab = ['incoming', 'offers', 'history'].includes(params.get('tab')) ? params.get('tab') : 'browse'

  const open = state.resources.filter((r) => r.type === 'exchange' && r.status === 'active' && r.ownerId !== user.id)
  const live = (e) => ['pending', 'accepted'].includes(e.status)
  const incoming = state.exchanges.filter((e) => canManage(user, resourceById(e.resourceId)) && live(e))
  const offers = state.exchanges.filter((e) => e.requesterId === user.id && live(e))
  const history = state.exchanges.filter((e) => !live(e) && (e.requesterId === user.id || canManage(user, resourceById(e.resourceId))))

  const List = ({ items, as, empty }) =>
    items.length === 0 ? (
      empty
    ) : (
      <div className="space-y-3">{items.map((e) => <ExchangeCard key={e.id} e={e} as={as} />)}</div>
    )

  return (
    <>
      <PageHeader
        title="Exchanges"
        subtitle="Swap something you have for something you need. No money involved."
        actions={<Link to="/add?type=exchange" className="btn-primary"><Repeat size={16} /> List an item to swap</Link>}
      />
      <Tabs
        value={tab}
        onChange={(t) => setParams(t === 'browse' ? {} : { tab: t })}
        tabs={[
          { id: 'browse', label: 'Browse swaps', count: open.length },
          { id: 'incoming', label: 'Offers on my items', count: incoming.length, alert: incoming.some((e) => e.status === 'pending') },
          { id: 'offers', label: 'My offers', count: offers.length },
          { id: 'history', label: 'History' },
        ]}
      />

      {tab === 'browse' &&
        (open.length === 0 ? (
          <EmptyState icon={Repeat} title="No swaps open right now" text="List something you would trade and say what you want in return." action={<Link to="/add?type=exchange" className="btn-primary">List an item</Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {open.map((r) => (
              <div key={r.id} className="flex flex-col gap-2">
                <ResourceCard resource={r} availability={availabilityOf(r, state.borrowings, today)} owner={userById(r.ownerId)} />
                {r.wanted && <p className="px-1 text-xs text-slate-600"><span className="font-semibold">Wants:</span> {r.wanted}</p>}
              </div>
            ))}
          </div>
        ))}
      {tab === 'incoming' && <List items={incoming} as="manager" empty={<EmptyState icon={Repeat} title="No offers to review" text="When someone offers a swap for your item, it appears here." />} />}
      {tab === 'offers' && <List items={offers} as="requester" empty={<EmptyState icon={Repeat} title="You have no open offers" text="Browse swaps and offer something in return." action={<button className="btn-primary" onClick={() => setParams({})}>Browse swaps</button>} />} />}
      {tab === 'history' && <List items={history} as={history.some((e) => e.requesterId === user.id) ? 'requester' : 'manager'} empty={<EmptyState icon={Repeat} title="No swap history yet" text="Completed, declined, and cancelled swaps are kept here." />} />}
    </>
  )
}
