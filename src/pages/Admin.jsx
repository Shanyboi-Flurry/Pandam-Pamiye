import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ClipboardCheck, XCircle } from 'lucide-react'
import { useStore } from '../store'
import { CAT, TYPES } from '../lib/constants'
import { cx, fmtShort } from '../lib/utils'
import { Avatar, EmptyState, Modal, PageHeader, StatCard, Tabs, ResourceThumb } from '../components/ui'

function RejectModal({ resource, onClose }) {
  const { rejectResource, notify } = useStore()
  const [note, setNote] = useState('')
  const submit = (e) => {
    e.preventDefault()
    const res = rejectResource(resource.id, note)
    if (!res.ok) return notify(res.error, 'error')
    notify('Listing rejected. The owner can edit and resubmit it.')
    onClose()
  }
  return (
    <Modal title="Reject this listing" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm text-slate-600">"{resource.title}" will not be shown in Resources. Tell the owner what to fix.</p>
        <label htmlFor="note" className="label">Reason (optional)</label>
        <textarea id="note" rows={3} className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Please add a clearer description and the correct condition." autoFocus />
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-danger">Reject listing</button>
        </div>
      </form>
    </Modal>
  )
}

function ReviewCard({ r, rejecting }) {
  const { userById, approveResource, notify } = useStore()
  const owner = userById(r.ownerId)
  const t = TYPES[r.type]
  const cat = CAT[r.category]
  const approve = () => {
    const res = approveResource(r.id)
    res.ok ? notify(`"${r.title}" is now live.`) : notify(res.error, 'error')
  }
  return (
    <div className="card flex flex-col gap-4 p-4 md:flex-row">
      <div className="w-full shrink-0 md:w-40"><ResourceThumb resource={r} /></div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-spruce-900">{r.title}</h3>
          <span className={cx('badge', t.cls)}>{t.label}</span>
          {cat && <span className="badge bg-slate-100 text-slate-700">{cat.label}</span>}
          <span className="badge bg-slate-100 text-slate-700">{r.condition}</span>
          {r.schoolOwned && <span className="badge bg-sky-100 text-sky-800">School property</span>}
        </div>
        <p className="mt-2 text-sm text-slate-700">{r.description}</p>
        <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
          {r.type === 'lend' && <div>Max loan: {r.maxDays} days</div>}
          {r.type === 'exchange' && r.wanted && <div>Wants in return: {r.wanted}</div>}
          {r.tags?.length > 0 && <div>Tags: {r.tags.join(', ')}</div>}
          <div>Submitted {fmtShort(r.createdAt)}</div>
        </dl>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <Avatar name={owner?.name} size="sm" /> {owner?.name} <span className="text-slate-400">({owner?.role})</span>
        </p>
      </div>
      <div className="flex gap-2 md:flex-col md:justify-center">
        <button className="btn-primary" onClick={approve}><CheckCircle2 size={16} /> Approve</button>
        <button className="btn-ghost text-red-700" onClick={() => rejecting(r)}><XCircle size={16} /> Reject</button>
      </div>
    </div>
  )
}

export default function Admin() {
  const { state, userById } = useStore()
  const [tab, setTab] = useState('pending')
  const [rejecting, setRejecting] = useState(null)

  const pending = state.resources.filter((r) => r.status === 'pending').sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const reviewed = state.resources.filter((r) => r.reviewedAt).sort((a, b) => b.reviewedAt.localeCompare(a.reviewedAt))
  const approvedCount = state.resources.filter((r) => r.reviewedAt && r.status !== 'rejected').length
  const rejectedCount = state.resources.filter((r) => r.status === 'rejected').length

  return (
    <>
      <PageHeader title="Listing approvals" subtitle="New resources stay hidden until you approve them. Approved listings go live in Resources right away." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={ClipboardCheck} label="Waiting for review" value={pending.length} tone={pending.length ? 'amber' : 'spruce'} />
        <StatCard icon={CheckCircle2} label="Approved" value={approvedCount} />
        <StatCard icon={XCircle} label="Rejected" value={rejectedCount} tone="coral" />
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'pending', label: 'To review', count: pending.length, alert: true },
          { id: 'history', label: 'History' },
        ]}
      />

      {tab === 'pending' &&
        (pending.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Nothing to review" text="When a member adds a new resource it appears here for your approval." />
        ) : (
          <div className="space-y-4">{pending.map((r) => <ReviewCard key={r.id} r={r} rejecting={setRejecting} />)}</div>
        ))}

      {tab === 'history' &&
        (reviewed.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="No decisions yet" text="Listings you approve or reject will be recorded here." />
        ) : (
          <div className="card divide-y divide-slate-100">
            {reviewed.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 p-4 text-sm">
                <span className={cx('badge', r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800')}>{r.status === 'rejected' ? 'Rejected' : 'Approved'}</span>
                {r.status === 'rejected' ? <span className="font-semibold text-spruce-900">{r.title}</span> : <Link to={`/resource/${r.id}`} className="font-semibold text-spruce-900 hover:text-spruce-600">{r.title}</Link>}
                <span className="text-slate-500">by {userById(r.ownerId)?.name}</span>
                {r.reviewNote && <span className="text-slate-600">· {r.reviewNote}</span>}
                <span className="ml-auto text-xs text-slate-500">{fmtShort(r.reviewedAt)}</span>
              </div>
            ))}
          </div>
        ))}

      {rejecting && <RejectModal resource={rejecting} onClose={() => setRejecting(null)} />}
    </>
  )
}
