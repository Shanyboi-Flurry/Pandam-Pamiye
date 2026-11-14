import { Lock } from 'lucide-react'
import { useStore } from '../store'
import { badgesFor, levelFor, userStats } from '../lib/logic'
import { LEVELS, POINT_RULES } from '../lib/constants'
import { cx, fmtDate } from '../lib/utils'
import { PageHeader, Section } from '../components/ui'
import { GrowthScene } from '../components/GrowthScene'

const SKY = [
  'linear-gradient(#0b1a48, #12306e)',
  'linear-gradient(#12306e, #1b5a8a)',
  'linear-gradient(#1b5a8a, #2a86a8)',
  'linear-gradient(#2a86a8, #58b8c8)',
  'linear-gradient(#3a9bc4, #9bdcf0)',
]

export default function EcoPoints() {
  const { user, state } = useStore()
  const stats = userStats(state, user.id)
  const lvl = levelFor(stats.points)
  const stage = LEVELS.findIndex((l) => l.name === lvl.current.name)
  const badges = badgesFor(stats)
  const history = state.activity.filter((a) => a.userId === user.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12)

  return (
    <>
      <PageHeader title="EcoPoints" subtitle="Points reward you for keeping things in use. Every completed loan, donation, swap, and on-time return counts." />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <div className="card relative overflow-hidden bg-spruce-900 p-6 text-white">
          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-semibold text-spruce-200">Your total</p>
              <p className="mt-1 font-display text-6xl font-extrabold text-marker-yellow">{stats.points}</p>
              <p className="mt-1 text-lg font-bold">
                {lvl.current.name} <span className="ml-1 text-xs font-semibold text-spruce-300">Stage {stage + 1} of {LEVELS.length}</span>
              </p>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-spruce-700" role="progressbar" aria-valuenow={lvl.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next level">
                <div className="h-full rounded-full bg-marker-yellow transition-all duration-1000" style={{ width: `${lvl.progress}%` }} />
              </div>
              <p className="mt-2 text-sm text-spruce-200">{lvl.next ? `${lvl.toNext} more points to reach ${lvl.next.name}.` : 'You reached the highest level.'}</p>
            </div>
            <div className="mx-auto h-[210px] w-[210px] rounded-2xl p-2 ring-1 ring-white/15" style={{ background: SKY[stage] }}>
              <GrowthScene key={stage} stage={stage} />
            </div>
          </div>
          <ol className="mt-7 grid grid-cols-5 gap-1 text-center" aria-label="Growth path">
            {LEVELS.map((l, i) => {
              const reached = stats.points >= l.min
              return (
                <li key={l.name} className="relative flex flex-col items-center">
                  {i < LEVELS.length - 1 && (
                    <span className={cx('absolute left-1/2 top-7 h-0.5 w-full', stats.points >= LEVELS[i + 1].min ? 'bg-marker-yellow' : 'bg-white/15')} aria-hidden="true" />
                  )}
                  <span className={cx('relative z-10 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-spruce-800', i === stage ? 'ring-2 ring-marker-yellow' : reached && 'ring-1 ring-white/25')}>
                    <GrowthScene compact stage={i} className={cx('h-12 w-12', !reached && 'opacity-30 grayscale')} />
                  </span>
                  <span className={cx('mt-2 text-xs font-bold', reached ? 'text-white' : 'text-spruce-400')}>{l.name}</span>
                  <span className="text-[11px] text-spruce-300">{l.min}+</span>
                  {i === stage && <span className="mt-1 rounded-full bg-marker-yellow px-2 py-0.5 text-[10px] font-bold text-spruce-950">Current</span>}
                </li>
              )
            })}
          </ol>
        </div>

        <Section title="Your contributions">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Listings published', stats.listings],
              ['Loans completed', stats.lends],
              ['Donations given', stats.donations],
              ['Swaps completed', stats.swaps],
              ['On-time returns', `${stats.onTime} of ${stats.returns}`],
              ['Items received free', stats.received],
            ].map(([k, v]) => (
              <div key={k}>
                <dd className="font-display text-2xl font-bold text-spruce-900">{v}</dd>
                <dt className="text-slate-600">{k}</dt>
              </div>
            ))}
          </dl>
        </Section>
      </div>

      <h2 className="mb-3 mt-8 text-xl font-bold text-spruce-900">Badges</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((b) => (
          <div key={b.id} className={cx('card p-4', b.earned ? 'border-marker-yellow bg-marker-yellow/20' : 'opacity-80')}>
            <span className={cx('flex h-11 w-11 items-center justify-center rounded-full', b.earned ? 'bg-spruce-700 text-marker-yellow' : 'bg-slate-200 text-slate-500')}>
              {b.earned ? <b.icon size={22} aria-hidden="true" /> : <Lock size={20} aria-hidden="true" />}
            </span>
            <p className="mt-3 font-display font-bold text-spruce-900">{b.name}</p>
            <p className="text-sm text-slate-600">{b.desc}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-spruce-600" style={{ width: `${(b.current / b.goal) * 100}%` }} />
            </div>
            <p className="mt-1 text-xs font-semibold text-slate-600">{b.earned ? 'Unlocked' : `${b.current} of ${b.goal}`}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section title="How to earn points">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {POINT_RULES.map((r) => (
                <tr key={r.type}>
                  <td className="py-2 text-slate-700">{r.label}</td>
                  <td className="py-2 text-right font-display font-bold text-spruce-800">+{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
        <Section title="Recent points">
          {history.length === 0 ? (
            <p className="text-sm text-slate-600">No points yet. List an item to earn your first {POINT_RULES[0].points}.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate text-slate-800">{a.text}</span>
                    <span className="text-xs text-slate-500">{fmtDate(a.date)}</span>
                  </span>
                  <span className="shrink-0 font-display font-bold text-spruce-800">+{a.points}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  )
}
