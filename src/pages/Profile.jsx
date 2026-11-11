import { useState } from 'react'
import { useStore } from '../store'
import { levelFor, userStats } from '../lib/logic'
import { ROLES } from '../lib/constants'
import { fmtDate } from '../lib/utils'
import { Avatar, PageHeader, Section } from '../components/ui'

export default function Profile() {
  const { user, state, updateProfile, notify } = useStore()
  const [form, setForm] = useState({ name: user.name, dept: user.dept || '', bio: user.bio || '' })
  const [error, setError] = useState('')
  const stats = userStats(state, user.id)
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Your name cannot be empty.')
    updateProfile({ name: form.name.trim(), dept: form.dept.trim(), bio: form.bio.trim() })
    setError('')
    notify('Profile saved.')
  }

  return (
    <>
      <PageHeader title="Profile" subtitle="This is how other members see you when you share or request a resource." />
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Section>
          <div className="mb-5 flex items-center gap-4">
            <Avatar name={user.name} size="lg" />
            <div>
              <p className="font-display text-xl font-bold text-spruce-900">{user.name}</p>
              <p className="text-sm text-slate-600">{ROLES[user.role].label} &middot; joined {fmtDate(user.joined)}</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="pn" className="label">Full name</label>
              <input id="pn" className="input" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label htmlFor="pe" className="label">Email</label>
              <input id="pe" className="input bg-slate-50" value={user.email} readOnly />
            </div>
            <div>
              <label htmlFor="pd" className="label">{user.role === 'student' ? 'Grade and section' : 'Department'}</label>
              <input id="pd" className="input" value={form.dept} onChange={set('dept')} />
            </div>
            <div>
              <label htmlFor="pb" className="label">About you</label>
              <textarea id="pb" rows={3} className="input" value={form.bio} onChange={set('bio')} placeholder="What do you usually share? When are you free for pickups?" />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button className="btn-primary">Save changes</button>
          </form>
        </Section>
        <Section title="Your impact">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['EcoPoints', stats.points],
              ['Level', levelFor(stats.points).current.name],
              ['Listings', stats.listings],
              ['Loans completed', stats.lends],
              ['Donations', stats.donations],
              ['Swaps', stats.swaps],
            ].map(([k, v]) => (
              <div key={k}>
                <dd className="font-display text-2xl font-bold text-spruce-900">{v}</dd>
                <dt className="text-slate-600">{k}</dt>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  )
}
