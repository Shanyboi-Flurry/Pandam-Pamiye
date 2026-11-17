import UserHover from '../components/UserHover'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Search, ShieldCheck, Trash2, UserX, Users } from 'lucide-react'
import { useStore } from '../store'
import { ROLES } from '../lib/constants'
import { repTone, reputationFor, userStats } from '../lib/logic'
import { cx, fmtShort } from '../lib/utils'
import { useConfirm } from '../components/Confirm'
import { Avatar, EmptyState, PageHeader, StatCard, ToneBadge } from '../components/ui'

export default function Members() {
  const { state, today, removeMember, notify } = useStore()
  const confirm = useConfirm()
  const [q, setQ] = useState('')
  const [role, setRole] = useState('all')

  const members = useMemo(() => state.users.filter((u) => u.role !== 'admin'), [state.users])
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return members
      .filter((u) => (role === 'all' || u.role === role) && (!needle || `${u.name} ${u.email} ${u.dept}`.toLowerCase().includes(needle)))
      .map((u) => ({ u, rep: reputationFor(state, u.id, today), points: userStats(state, u.id).points }))
      .sort((a, b) => a.u.name.localeCompare(b.u.name))
  }, [members, q, role, state, today])

  const lowRep = members.filter((u) => reputationFor(state, u.id, today) < 50).length

  const remove = async (u) => {
    const ok = await confirm({
      title: `Remove ${u.name}?`,
      message: 'Their account, listings, requests and messages will be erased for good. They will be logged out. This cannot be undone.',
      confirmLabel: 'Yes, remove account',
    })
    if (!ok) return
    const res = removeMember(u.id)
    notify(res.ok ? `${u.name} was removed.` : res.error, res.ok ? 'success' : 'error')
  }

  return (
    <>
      <PageHeader title="Members" subtitle="Everyone who has joined. Message a member, check their reputation, or remove an account." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Total members" value={members.length} />
        <StatCard icon={ShieldCheck} label="Low reputation (under 50)" value={lowRep} tone={lowRep ? 'coral' : 'spruce'} />
        <StatCard icon={UserX} label="Shown now" value={rows.length} tone="sky" />
      </div>

      <div className="card mb-4 flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[220px] flex-1">
          <label htmlFor="mq" className="sr-only">Search members</label>
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="mq" className="input !pl-9" placeholder="Search by name, email or course" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div role="group" aria-label="Role" className="inline-flex rounded-lg border border-slate-300 bg-surface p-0.5 text-sm font-semibold">
          {[['all', 'All'], ['student', 'Students'], ['teacher', 'Teachers'], ['staff', 'Staff']].map(([k, l]) => (
            <button key={k} aria-pressed={role === k} onClick={() => setRole(k)} className={cx('rounded-md px-3 py-1.5', role === k ? 'bg-spruce-700 text-white' : 'text-slate-600')}>{l}</button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Users} title="No members found" text="Try a different name or role." />
      ) : (
        <div className="space-y-3">
          {rows.map(({ u, rep, points }) => (
            <div key={u.id} className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <Avatar name={u.name} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-spruce-900"><UserHover id={u.id}>{u.name}</UserHover></p>
                  <span className="badge bg-slate-200 text-slate-700">{ROLES[u.role].label}</span>
                  <ToneBadge tone={repTone(rep)}>Reputation {rep}</ToneBadge>
                </div>
                <p className="mt-1 truncate text-sm text-slate-600">{u.email}{u.dept ? ` · ${u.dept}` : ''}</p>
                <p className="text-xs text-slate-500">Joined {fmtShort(u.joined)} · {points} EcoPoints</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/messages?to=${u.id}`} className="btn-ghost btn-sm"><MessageSquare size={14} /> Message</Link>
                <button className="btn-ghost btn-sm text-red-700" onClick={() => remove(u)}><Trash2 size={14} /> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
