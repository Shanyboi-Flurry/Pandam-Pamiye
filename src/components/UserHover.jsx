import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ShieldCheck } from 'lucide-react'
import { useStore } from '../store'
import { ROLES, LEVELS } from '../lib/constants'
import { levelFor, repTone, reputationFor, userStats } from '../lib/logic'
import { cx, fmtShort } from '../lib/utils'
import { Avatar } from './ui'

const W = 288
const TONE = {
  ok: { bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'Trusted' },
  warn: { bar: 'bg-amber-500', text: 'text-amber-700', label: 'Fair' },
  bad: { bar: 'bg-red-500', text: 'text-red-700', label: 'Low' },
}

function Card({ user, pos }) {
  const { state, today } = useStore()
  const rep = reputationFor(state, user.id, today)
  const tone = TONE[repTone(rep)]
  const stats = userStats(state, user.id)
  const lvl = levelFor(stats.points).current.name
  const shared = stats.lends + stats.donations + stats.swaps
  return createPortal(
    <div role="tooltip" style={{ position: 'fixed', top: pos.top, left: pos.left, width: W }} className="pop-in pointer-events-none z-[90] rounded-2xl border border-slate-200 bg-surface p-4 shadow-2xl shadow-black/30">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-bold text-spruce-900">{user.name}</p>
          <p className="truncate text-xs text-slate-600">{ROLES[user.role]?.label}{user.dept ? `, ${user.dept}` : ''}</p>
          <p className="text-xs text-slate-500">Joined {fmtShort(user.joined)}</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-slate-100 p-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600"><ShieldCheck size={14} aria-hidden="true" /> Reputation</span>
          <span className={cx('text-xs font-bold', tone.text)}>{tone.label}</span>
        </div>
        <p className="mt-1 font-display text-2xl font-extrabold text-spruce-900">{rep}<span className="text-sm font-semibold text-slate-500"> / 100</span></p>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-300" role="progressbar" aria-valuenow={rep} aria-valuemin={0} aria-valuemax={100} aria-label="Reputation">
          <div className={cx('h-full rounded-full transition-all', tone.bar)} style={{ width: `${rep}%` }} />
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <div><dd className="font-display text-base font-bold text-spruce-900">{stats.points}</dd><dt className="text-slate-500">EcoPoints</dt></div>
        <div><dd className="font-display text-base font-bold text-spruce-900">{shared}</dd><dt className="text-slate-500">Shared</dt></div>
        <div><dd className="font-display text-base font-bold text-spruce-900">{stats.returns ? `${stats.onTime}/${stats.returns}` : '-'}</dd><dt className="text-slate-500">On time</dt></div>
      </dl>
      <p className="mt-2 text-center text-[11px] font-semibold text-slate-500">{lvl} level</p>
    </div>,
    document.body,
  )
}

// Wrap a person's name: hovering (or focusing) it shows their profile card with reputation.
export default function UserHover({ id, children, className }) {
  const { state } = useStore()
  const user = state.users.find((u) => u.id === id)
  const ref = useRef(null)
  const [pos, setPos] = useState(null)
  if (!user) return <span className={className}>{children}</span>

  const show = () => {
    const r = ref.current.getBoundingClientRect()
    const left = Math.max(8, Math.min(r.left, window.innerWidth - W - 8))
    const below = window.innerHeight - r.bottom > 270
    setPos({ left, top: below ? r.bottom + 8 : Math.max(8, r.top - 8 - 262) })
  }
  const hide = () => setPos(null)

  return (
    <span ref={ref} tabIndex={0} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} className={cx('cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-marker-yellow', className)}>
      {children}
      {pos && <Card user={user} pos={pos} />}
    </span>
  )
}
