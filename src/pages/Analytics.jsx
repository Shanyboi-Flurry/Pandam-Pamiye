import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts'
import { CheckCircle2, Cloud, Package, Recycle, Users } from 'lucide-react'
import { useStore } from '../store'
import { wasteStats, weeklySeries } from '../lib/logic'
import { CATEGORIES, CO2_PER_KG } from '../lib/constants'
import { daysBetween, plural } from '../lib/utils'
import { PageHeader, Section, StatCard } from '../components/ui'

// Reference palette: first three categorical slots, assigned per entity and kept consistent across charts.
const C = { borrow: '#203a9b', donate: '#d9a21b', swap: '#c8283c', grid: '#e1e0d9', axis: '#898781', ink: '#52514e', bar: '#203a9b' }

const tooltipStyle = { background: '#fcfcfb', border: '1px solid #e1e0d9', borderRadius: 8, fontSize: 13, color: '#0b0b0b' }

function Group({ title, rows }) {
  return (
    <Section title={title}>
      <dl className="space-y-2.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-3">
            <dt className="text-slate-600">{k}</dt>
            <dd className="font-display text-lg font-bold text-spruce-900">{v}</dd>
          </div>
        ))}
      </dl>
    </Section>
  )
}

export default function Analytics() {
  const { state, today, demand, resourceById } = useStore()
  const [table, setTable] = useState(false)

  const d = useMemo(() => {
    const { borrowings, claims, exchanges, resources, users } = state
    const waste = wasteStats(state)
    const returned = borrowings.filter((b) => b.status === 'returned')
    const decided = borrowings.filter((b) => ['approved', 'returned', 'rejected'].includes(b.status))
    const approved = borrowings.filter((b) => ['approved', 'returned'].includes(b.status))
    const pct = (n, of) => (of ? `${Math.round((n / of) * 100)}%` : 'n/a')
    const avgLoan = approved.length ? (approved.reduce((s, b) => s + daysBetween(b.start, b.end) + 1, 0) / approved.length).toFixed(1) : '0'

    const byCat = CATEGORIES.map((c) => ({
      name: c.short,
      Requests: resources.filter((r) => r.category === c.id).reduce((s, r) => s + (demand[r.id] || 0), 0),
    })).sort((a, b) => b.Requests - a.Requests)

    const mix = [
      { name: 'Lend', value: resources.filter((r) => r.type === 'lend' && r.status !== 'removed').length, color: C.borrow },
      { name: 'Donate', value: resources.filter((r) => r.type === 'donate' && r.status !== 'removed').length, color: C.donate },
      { name: 'Exchange', value: resources.filter((r) => r.type === 'exchange' && r.status !== 'removed').length, color: C.swap },
    ]

    const top = Object.entries(demand)
      .map(([id, n]) => ({ r: resourceById(id), n }))
      .filter((x) => x.r)
      .sort((a, b) => b.n - a.n)
      .slice(0, 6)

    return {
      waste,
      weekly: weeklySeries(state, today, 8),
      byCat,
      mix,
      top,
      borrow: [
        ['Total requests', borrowings.length],
        ['Approval rate', pct(approved.length, decided.length)],
        ['On-time returns', pct(returned.filter((b) => b.returnedAt <= b.end).length, returned.length)],
        ['Average loan length', `${avgLoan} days`],
      ],
      donate: [
        ['Items listed for donation', resources.filter((r) => r.type === 'donate' && r.status !== 'removed').length],
        ['Donations completed', claims.filter((c) => c.status === 'completed').length],
        ['Requests waiting', claims.filter((c) => c.status === 'pending').length],
      ],
      swap: [
        ['Items open to swaps', resources.filter((r) => r.type === 'exchange' && r.status === 'active').length],
        ['Swaps completed', exchanges.filter((e) => e.status === 'completed').length],
        ['Offers waiting', exchanges.filter((e) => e.status === 'pending').length],
      ],
      members: users.filter((u) => u.role !== 'admin').length,
    }
  }, [state, today, demand, resourceById])

  const maxTop = Math.max(1, ...d.top.map((t) => t.n))

  return (
    <>
      <PageHeader title="Sustainability analytics" subtitle="How much the community is sharing, what people ask for most, and the waste kept out of the bin." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Completed shares" value={d.waste.shares} hint="Returned loans, donations, and swaps" />
        <StatCard icon={Package} label="Active listings" value={state.resources.filter((r) => r.status === 'active').length} tone="sky" />
        <StatCard icon={Recycle} label="Waste kept in use (est.)" value={`${d.waste.kg} kg`} tone="amber" />
        <StatCard icon={Cloud} label="CO2e avoided (est.)" value={`${d.waste.co2} kg`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Section
          title="Requests per week"
          action={<button className="text-sm font-semibold text-spruce-700 hover:underline" onClick={() => setTable((t) => !t)}>{table ? 'Show chart' : 'View as table'}</button>}
        >
          {table ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500"><tr><th className="pb-2 font-semibold">Week of</th><th className="pb-2 font-semibold">Borrow</th><th className="pb-2 font-semibold">Donate</th><th className="pb-2 font-semibold">Swap</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {d.weekly.map((w) => <tr key={w.week}><td className="py-1.5">{w.week}</td><td>{w.Borrow}</td><td>{w.Donate}</td><td>{w.Swap}</td></tr>)}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-72" role="img" aria-label="Line chart of borrow, donation, and swap requests for each of the last 8 weeks">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={d.weekly} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke={C.grid} vertical={false} />
                  <XAxis dataKey="week" stroke={C.axis} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} />
                  <YAxis allowDecimals={false} stroke={C.axis} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: C.axis, strokeDasharray: '3 3' }} />
                  <Legend iconType="plainline" wrapperStyle={{ fontSize: 13, color: C.ink }} />
                  <Line type="monotone" dataKey="Borrow" stroke={C.borrow} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: '#fcfcfb' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Donate" stroke={C.donate} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: '#fcfcfb' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Swap" stroke={C.swap} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: '#fcfcfb' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Section>

        <Section title="Most requested categories">
          <div className="h-72" role="img" aria-label="Bar chart of total requests for each resource category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.byCat} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }} barCategoryGap={10}>
                <CartesianGrid stroke={C.grid} horizontal={false} />
                <XAxis type="number" allowDecimals={false} stroke={C.axis} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={76} stroke={C.axis} tick={{ fill: C.ink, fontSize: 13 }} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(42,120,214,0.08)' }} />
                <Bar dataKey="Requests" fill={C.bar} radius={[0, 4, 4, 0]} maxBarSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Group title="Borrowing" rows={d.borrow} />
        <Group title="Donations" rows={d.donate} />
        <Group title="Exchanges" rows={d.swap} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section title="Resource demand: most requested items">
          {d.top.length === 0 ? (
            <p className="text-sm text-slate-600">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.top.map(({ r, n }) => (
                <li key={r.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <Link to={`/resource/${r.id}`} className="truncate font-semibold text-spruce-900 hover:text-spruce-600">{r.title}</Link>
                    <span className="shrink-0 text-slate-600">{plural(n, 'request')}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-r bg-[#203a9b]" style={{ width: `${(n / maxTop) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Listings by sharing type">
          <div className="h-52" role="img" aria-label="Bar chart of listing counts: lend, donate, exchange">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.mix} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid stroke={C.grid} vertical={false} />
                <XAxis dataKey="name" stroke={C.axis} tick={{ fill: C.ink, fontSize: 13 }} tickLine={false} />
                <YAxis allowDecimals={false} stroke={C.axis} tick={{ fill: C.axis, fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                <Bar dataKey="value" name="Listings" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {d.mix.map((m) => <Cell key={m.name} fill={m.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>
      </div>

      <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-xs text-slate-600">
        <Users size={14} className="mr-1 inline" aria-hidden="true" />
        How waste is estimated: each completed loan, donation, or swap counts as one new purchase avoided. Weight uses a fixed average per category (books 0.5 kg, gadgets 0.4 kg, supplies 0.2 kg, sports gear 1 kg, art materials 0.4 kg, event equipment 4 kg), and CO2e uses {CO2_PER_KG} kg per kg of goods. These are simple demo estimates, not audited figures.
      </p>
    </>
  )
}
