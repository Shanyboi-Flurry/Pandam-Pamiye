import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useStore } from '../store'
import { badgesFor, levelFor, pointsInRange, userStats } from '../lib/logic'
import { ROLES } from '../lib/constants'
import { addDays, cx } from '../lib/utils'
import { Avatar, EmptyState, PageHeader } from '../components/ui'

export default function Leaderboard() {
  const { user, state, today } = useStore()
  const [period, setPeriod] = useState('all')
  const [role, setRole] = useState('all')

  const rows = useMemo(() => {
    const since = period === '30' ? addDays(today, -30) : null
    return state.users
      .filter((u) => u.role !== 'admin' && !u.suspended && (role === 'all' || u.role === role))
      .map((u) => {
        const stats = userStats(state, u.id)
        return { u, points: pointsInRange(state, u.id, since), level: levelFor(stats.points).current.name, badges: badgesFor(stats).filter((b) => b.earned).length }
      })
      .sort((a, b) => b.points - a.points || a.u.name.localeCompare(b.u.name))
      .map((r, i) => ({ ...r, rank: i + 1 }))
  }, [state, today, period, role])

  const podium = rows.slice(0, 3)
  const heights = ['h-28', 'h-20', 'h-16']
  const order = podium.length === 3 ? [1, 0, 2] : podium.map((_, i) => i)

  return (
    <>
      <PageHeader title="Leaderboard" subtitle="See who is keeping the most resources in use. Rankings update as loans, donations, and swaps complete." />
      <div className="mb-6 flex flex-wrap gap-3">
        <div role="group" aria-label="Time period" className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm font-semibold">
          {[['all', 'All time'], ['30', 'Last 30 days']].map(([k, l]) => (
            <button key={k} aria-pressed={period === k} onClick={() => setPeriod(k)} className={cx('rounded-md px-3 py-1.5', period === k ? 'bg-spruce-700 text-white' : 'text-slate-600')}>{l}</button>
          ))}
        </div>
        <label className="sr-only" htmlFor="role">Filter by role</label>
        <select id="role" className="input !w-auto" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="all">Everyone</option>
          {['student', 'teacher', 'staff'].map((r) => <option key={r} value={r}>{ROLES[r].label}s</option>)}
        </select>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Trophy} title="Nobody on the board yet" text="Share something to take the first spot." />
      ) : (
        <>
          <div className="mb-8 flex items-end justify-center gap-3" aria-label="Top three">
            {order.map((i) => {
              const r = podium[i]
              return (
                <div key={r.u.id} className="flex w-28 flex-col items-center text-center sm:w-36">
                  <Avatar name={r.u.name} size="lg" />
                  <p className="mt-2 w-full truncate text-sm font-bold text-spruce-900">{r.u.name}</p>
                  <p className="text-xs text-slate-600">{r.points} pts</p>
                  <div className={cx('mt-2 flex w-full items-start justify-center rounded-t-lg pt-2 font-display text-2xl font-extrabold', heights[i], i === 0 ? 'bg-marker-yellow text-spruce-950' : 'bg-spruce-200 text-spruce-900')}>
                    {r.rank}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Rank</th>
                  <th className="px-4 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Badges</th>
                  <th className="px-4 py-3 text-right font-semibold">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.u.id} className={cx(r.u.id === user.id && 'bg-marker-yellow/25')}>
                    <td className="px-4 py-3 font-display font-bold text-spruce-800">{r.rank}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar name={r.u.name} size="sm" />
                        <span>
                          <span className="block font-semibold text-spruce-900">{r.u.name}{r.u.id === user.id && ' (you)'}</span>
                          <span className="block text-xs text-slate-500">{ROLES[r.u.role].label}{r.u.dept ? `, ${r.u.dept}` : ''}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{r.level}</td>
                    <td className="px-4 py-3 text-slate-700">{r.badges}</td>
                    <td className="px-4 py-3 text-right font-display text-lg font-bold text-spruce-800">{r.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
