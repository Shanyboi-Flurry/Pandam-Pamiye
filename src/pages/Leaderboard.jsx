import UserHover from '../components/UserHover'
import { useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useStore } from '../store'
import { badgesFor, levelFor, pointsInRange, userStats } from '../lib/logic'
import { ROLES } from '../lib/constants'
import { addDays, cx } from '../lib/utils'
import { Avatar, EmptyState, PageHeader } from '../components/ui'
import { GrowthScene } from '../components/GrowthScene'
import { LEVELS } from '../lib/constants'

// Small round picture of the member's current growth stage (seed, sprout, sapling, tree, forest).
const Stage = ({ stage, size = 'h-11 w-11' }) => (
  <span className={cx('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/20', size)} title={LEVELS[stage].name}>
    <GrowthScene compact stage={stage} className="h-full w-full" />
  </span>
)

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
        return { u, points: pointsInRange(state, u.id, since), stage: LEVELS.indexOf(levelFor(stats.points).current), badges: badgesFor(stats).filter((b) => b.earned).length }
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
        <div role="group" aria-label="Time period" className="inline-flex rounded-lg border border-slate-300 bg-surface p-0.5 text-sm font-semibold">
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
          <div className="mb-8 flex items-end justify-center gap-3 sm:gap-5" aria-label="Top three">
            {order.map((i) => {
              const r = podium[i]
              const first = i === 0
              return (
                <div key={r.u.id} className={cx('flex flex-col items-stretch text-center', first ? 'w-36 sm:w-56' : 'w-28 sm:w-44')}>
                  <div
                    className={cx('relative overflow-hidden rounded-2xl shadow-xl shadow-black/30 ring-1', first ? 'ring-2 ring-marker-yellow' : 'ring-white/20')}
                  >
                    <GrowthScene compact stage={r.stage} className={cx('w-full', first ? 'h-44 sm:h-60' : 'h-36 sm:h-48')} />
                    <span className="absolute left-2 top-2 rounded-full ring-2 ring-white/70"><Avatar name={r.u.name} size="sm" /></span>
                    <span className="absolute right-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[11px] font-bold text-white backdrop-blur">{LEVELS[r.stage].name}</span>
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/45 to-transparent px-2 pb-2 pt-8">
                      <p className={cx('truncate font-bold text-white drop-shadow', first ? 'text-base' : 'text-sm')}><UserHover id={r.u.id} className="decoration-white/50">{r.u.name}</UserHover></p>
                      <p className="text-xs font-semibold text-marker-yellow">{r.points} pts</p>
                    </div>
                  </div>
                  <div className={cx('mt-2 flex w-full items-start justify-center rounded-t-lg pt-2 font-display text-2xl font-extrabold', heights[i], first ? 'bg-marker-yellow text-spruce-950' : 'bg-spruce-200 text-spruce-900')}>
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
                        <Stage stage={r.stage} size="h-14 w-14" />
                        <span>
                          <span className="flex items-center gap-1.5 font-semibold text-spruce-900">
                            <UserHover id={r.u.id}>{r.u.name}</UserHover>{r.u.id === user.id && ' (you)'}
                          </span>
                          <span className="block text-xs text-slate-500">{ROLES[r.u.role].label}{r.u.dept ? `, ${r.u.dept}` : ''}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{LEVELS[r.stage].name}</td>
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
