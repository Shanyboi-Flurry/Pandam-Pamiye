import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, Clock, Gift, Inbox, Leaf, Package, PlusCircle, Repeat, Search, Store, Users, ShieldCheck, Truck, GraduationCap } from 'lucide-react'
import { useStore } from '../store'
import { availabilityOf, canManage, daysOverdue, isOverdue, levelFor, recommendFor, remindersFor, userStats } from '../lib/logic'
import { ROLES } from '../lib/constants'
import { fmtShort, plural, relDays } from '../lib/utils'
import { Avatar, EmptyState, PageHeader, Section, StatCard, ToneBadge, ResourceCard } from '../components/ui'

function ReminderList({ rem, user }) {
  const { resourceById, userById, today } = useStore()
  const items = []
  rem.overdue.forEach((b) =>
    items.push({ key: b.id, icon: AlertTriangle, tone: 'text-red-600', to: '/borrowings', text: `"${resourceById(b.resourceId)?.title}" is ${plural(daysOverdue(b, today), 'day')} overdue. Return it to ${userById(b.ownerId)?.name}.` })
  )
  rem.overdueOut.forEach((b) =>
    items.push({ key: b.id, icon: AlertTriangle, tone: 'text-red-600', to: '/borrowings?tab=incoming', text: `${userById(b.borrowerId)?.name} has not returned "${resourceById(b.resourceId)?.title}" (${plural(daysOverdue(b, today), 'day')} overdue).` })
  )
  rem.dueSoon.forEach((b) =>
    items.push({ key: b.id, icon: Clock, tone: 'text-amber-600', to: '/borrowings', text: `"${resourceById(b.resourceId)?.title}" is due ${relDays(b.end, today)} (${fmtShort(b.end)}).` })
  )
  if (rem.incomingBorrow.length) items.push({ key: 'ib', icon: Inbox, tone: 'text-spruce-600', to: '/borrowings?tab=incoming', text: `${plural(rem.incomingBorrow.length, 'borrow request')} waiting for your answer.` })
  if (rem.incomingClaims.length) items.push({ key: 'ic', icon: Gift, tone: 'text-spruce-600', to: '/donations?tab=mine', text: `${plural(rem.incomingClaims.length, 'donation request')} waiting for your answer.` })
  if (rem.incomingSwaps.length) items.push({ key: 'is', icon: Repeat, tone: 'text-spruce-600', to: '/exchanges?tab=incoming', text: `${plural(rem.incomingSwaps.length, 'swap offer')} waiting for your answer.` })
  if (rem.pendingApprovals.length) items.push({ key: 'pa', icon: ShieldCheck, tone: 'text-spruce-600', to: '/admin', text: `${plural(rem.pendingApprovals.length, 'new listing')} waiting for your approval.` })

  return (
    <Section title="Reminders">
      {items.length === 0 ? (
        <p className="text-sm text-slate-600">Nothing needs your attention. Your loans are on track.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {items.map((it) => (
            <li key={it.key}>
              <Link to={it.to} className="flex items-start gap-3 py-2.5 text-sm hover:text-spruce-700">
                <it.icon size={18} className={`mt-0.5 shrink-0 ${it.tone}`} aria-hidden="true" />
                <span className="flex-1">{it.text}</span>
                <ArrowRight size={16} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

function Recommended({ user }) {
  const { state, today, userById } = useStore()
  const recs = recommendFor(user, state, today, 4)
  return (
    <Section title="Recommended for you" action={<Link to="/marketplace" className="text-sm font-semibold text-spruce-700 hover:underline">Browse all</Link>}>
      {recs.length === 0 ? (
        <EmptyState icon={Search} title="No matches yet" text="Browse resources to find something to borrow." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {recs.map(({ resource, availability, reason }) => (
            <ResourceCard key={resource.id} resource={resource} availability={availability} owner={userById(resource.ownerId)} reasons={[reason]} />
          ))}
        </div>
      )}
    </Section>
  )
}

function EcoSnapshot({ stats }) {
  const lvl = levelFor(stats.points)
  return (
    <Section title="Your EcoPoints" action={<Link to="/ecopoints" className="text-sm font-semibold text-spruce-700 hover:underline">Details</Link>}>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-4xl font-extrabold text-spruce-800">{stats.points}</span>
        <span className="text-sm font-semibold text-slate-600">{lvl.current.name}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={lvl.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
        <div className="h-full rounded-full bg-marker-yellow" style={{ width: `${lvl.progress}%` }} />
      </div>
      <p className="mt-2 text-sm text-slate-600">{lvl.next ? `${lvl.toNext} points to reach ${lvl.next.name}.` : 'You reached the top level. Keep sharing.'}</p>
    </Section>
  )
}

function SchoolResources({ user }) {
  const { state, today, userById } = useStore()
  const school = state.resources.filter((r) => r.schoolOwned && r.status !== 'removed')
  return (
    <Section title="School resource status" action={<Link to="/listings" className="text-sm font-semibold text-spruce-700 hover:underline">Manage</Link>}>
      {school.length === 0 ? (
        <p className="text-sm text-slate-600">No school-owned resources yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr>
                <th className="pb-2 pr-3 font-semibold">Resource</th>
                <th className="pb-2 pr-3 font-semibold">Status</th>
                <th className="pb-2 font-semibold">Held by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {school.map((r) => {
                const a = availabilityOf(r, state.borrowings, today)
                const loan = state.borrowings.find((b) => b.resourceId === r.id && b.status === 'approved' && b.start <= today)
                return (
                  <tr key={r.id}>
                    <td className="py-2 pr-3"><Link to={`/resource/${r.id}`} className="font-semibold text-spruce-900 hover:text-spruce-600">{r.title}</Link></td>
                    <td className="py-2 pr-3"><ToneBadge tone={a.tone}>{a.label}</ToneBadge></td>
                    <td className="py-2 text-slate-600">{loan ? userById(loan.borrowerId)?.name : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  )
}

function AdminFeed() {
  const { state, userById } = useStore()
  const pending = state.resources.filter((r) => r.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt)).slice(0, 6)
  return (
    <Section title="Waiting for your approval" action={<Link to="/admin" className="text-sm font-semibold text-spruce-700 hover:underline">Review all</Link>}>
      {pending.length === 0 ? (
        <p className="text-sm text-slate-600">No new listings to review right now.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {pending.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5 text-sm">
              <Avatar name={userById(r.ownerId)?.name} size="sm" />
              <span className="flex-1"><span className="font-semibold">{r.title}</span> <span className="text-slate-500">by {userById(r.ownerId)?.name}</span></span>
              <span className="text-xs text-slate-500">{fmtShort(r.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

export default function Dashboard() {
  const { user, state, today, resourceById } = useStore()
  const rem = remindersFor(state, user, today)
  const stats = userStats(state, user.id)
  const role = user.role
  const manages = (b) => canManage(user, resourceById(b.resourceId))

  const myListings = state.resources.filter((r) => r.ownerId === user.id && r.status !== 'removed')
  const activeBorrowed = state.borrowings.filter((b) => b.borrowerId === user.id && b.status === 'approved' && b.start <= today)
  const loansOut = state.borrowings.filter((b) => b.status === 'approved' && b.start <= today && manages(b) && b.borrowerId !== user.id)
  const incoming = rem.incomingBorrow.length + rem.incomingClaims.length + rem.incomingSwaps.length
  const schoolRes = state.resources.filter((r) => r.schoolOwned && r.status !== 'removed')
  const schoolOut = loansOut.filter((b) => resourceById(b.resourceId)?.schoolOwned)
  const platformOverdue = state.borrowings.filter((b) => isOverdue(b, today))

  const cards = {
    student: [
      { icon: Clock, label: 'Items you are borrowing', value: activeBorrowed.length },
      { icon: AlertTriangle, label: 'Due soon or overdue', value: rem.overdue.length + rem.dueSoon.length, tone: rem.overdue.length ? 'coral' : 'amber' },
      { icon: Package, label: 'Your listings', value: myListings.length, tone: 'sky' },
      { icon: Leaf, label: 'EcoPoints', value: stats.points },
    ],
    teacher: [
      { icon: GraduationCap, label: 'Resources you share', value: myListings.length },
      { icon: Inbox, label: 'Requests to answer', value: incoming, tone: 'amber' },
      { icon: Truck, label: 'Items out on loan', value: loansOut.length, tone: 'sky' },
      { icon: Leaf, label: 'EcoPoints', value: stats.points },
    ],
    staff: [
      { icon: Package, label: 'School resources', value: schoolRes.length },
      { icon: Truck, label: 'School items on loan', value: schoolOut.length, tone: 'sky' },
      { icon: AlertTriangle, label: 'Overdue returns', value: rem.overdueOut.length + rem.overdue.length, tone: rem.overdueOut.length + rem.overdue.length ? 'coral' : 'spruce' },
      { icon: Inbox, label: 'Requests to answer', value: incoming, tone: 'amber' },
    ],
    admin: [
      { icon: Users, label: 'Community members', value: state.users.filter((u) => u.role !== 'admin').length },
      { icon: Store, label: 'Active listings', value: state.resources.filter((r) => r.status === 'active').length, tone: 'sky' },
      { icon: ShieldCheck, label: 'Waiting for approval', value: rem.pendingApprovals.length, tone: rem.pendingApprovals.length ? 'amber' : 'spruce' },
      { icon: AlertTriangle, label: 'Overdue loans', value: platformOverdue.length, tone: platformOverdue.length ? 'coral' : 'spruce' },
    ],
  }[role]

  const actions = {
    student: [['/marketplace', Search, 'Find a resource'], ['/add', PlusCircle, 'Lend something']],
    teacher: [['/add?type=lend', PlusCircle, 'Share a resource'], ['/marketplace', Search, 'Browse resources']],
    staff: [['/add', PlusCircle, 'Add school resource'], ['/listings', Package, 'Manage resources']],
    admin: [['/admin', ShieldCheck, 'Review listings'], ['/analytics', Store, 'View analytics']],
  }[role]

  return (
    <>
      <PageHeader
        title={`Hello, ${user.name.split(' ').slice(role === 'student' ? 0 : 0, role === 'student' ? 1 : 2).join(' ')}`}
        subtitle={ROLES[role].blurb}
        actions={actions.map(([to, Icon, label], i) => (
          <Link key={to} to={to} className={i === 0 ? 'btn-primary' : 'btn-ghost'}>
            <Icon size={16} aria-hidden="true" /> {label}
          </Link>
        ))}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <ReminderList rem={rem} user={user} />
        {role === 'admin' ? <AdminFeed /> : <EcoSnapshot stats={stats} />}
      </div>

      <div className="mt-6 space-y-6">
        {role === 'staff' && <SchoolResources user={user} />}
        {role === 'teacher' && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-marker-yellow p-5">
            <div>
              <p className="font-display text-xl font-bold text-spruce-950">Share an educational resource</p>
              <p className="text-sm text-spruce-900">Lab kits, classroom sets, and reference books can help other classes too.</p>
            </div>
            <Link to="/add?type=lend" className="btn-primary">Add resource</Link>
          </div>
        )}
        {role !== 'admin' && <Recommended user={user} />}
      </div>
    </>
  )
}
