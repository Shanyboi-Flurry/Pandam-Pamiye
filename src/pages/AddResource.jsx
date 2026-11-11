import { useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ImagePlus, X } from 'lucide-react'
import { useStore } from '../store'
import { canManage } from '../lib/logic'
import { CATEGORIES, CONDITIONS, POINTS, TYPES } from '../lib/constants'
import { cx, fileToDataURL } from '../lib/utils'
import { PageHeader, Section } from '../components/ui'

export default function AddResource() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user, resourceById, addResource, updateResource, notify } = useStore()
  const editing = id ? resourceById(id) : null

  const [form, setForm] = useState(() =>
    editing
      ? { ...editing, tags: editing.tags.join(', ') }
      : {
          title: '', description: '', category: 'books', condition: 'Good',
          type: TYPES[params.get('type')] ? params.get('type') : 'lend',
          maxDays: 7, wanted: '', tags: '', image: null, schoolOwned: false,
        }
  )
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (id && !editing) return <Navigate to="/listings" replace />
  if (editing && !canManage(user, editing)) return <Navigate to={`/resource/${id}`} replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const canMarkSchool = user.role !== 'student'

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Choose an image file (JPG, PNG, or WebP).')
    setBusy(true)
    try {
      const image = await fileToDataURL(file)
      setForm((f) => ({ ...f, image }))
      setError('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = (e) => {
    e.preventDefault()
    if (form.title.trim().length < 3) return setError('Give the listing a title of at least 3 characters.')
    if (form.description.trim().length < 10) return setError('Add a short description so people know what they are getting.')
    const maxDays = Number(form.maxDays)
    if (form.type === 'lend' && !(maxDays >= 1 && maxDays <= 60)) return setError('Set a maximum loan between 1 and 60 days.')
    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      condition: form.condition,
      type: form.type,
      maxDays: form.type === 'lend' ? maxDays : null,
      wanted: form.type === 'exchange' ? form.wanted.trim() : '',
      tags: form.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      image: form.image,
      schoolOwned: canMarkSchool && !!form.schoolOwned,
    }
    if (editing) {
      const res = updateResource(editing.id, data)
      if (!res.ok) return setError(res.error)
      notify(res.resubmitted ? 'Listing resubmitted for approval.' : 'Listing updated.')
      navigate(`/resource/${editing.id}`)
    } else {
      const res = addResource(data)
      if (!res.ok) return setError(res.error)
      notify(res.pending ? 'Submitted! Your listing goes live once the administrator approves it.' : `Listing published. You earned ${POINTS.list} EcoPoints.`)
      navigate(`/resource/${res.resource.id}`)
    }
  }

  return (
    <>
      <PageHeader
        title={editing ? 'Edit listing' : 'Add a resource'}
        subtitle={editing ? 'Update the details people see in Resources.' : `Share something you are not using. The administrator reviews new listings before they go live. You earn ${POINTS.list} EcoPoints when yours is approved.`}
      />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]" noValidate>
        <div className="space-y-6">
          <Section title="How do you want to share it?">
            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Sharing type">
              {Object.entries(TYPES).map(([k, t]) => (
                <label key={k} className={cx('cursor-pointer rounded-lg border p-3', form.type === k ? 'border-spruce-600 bg-spruce-50' : 'border-slate-300 hover:bg-slate-50')}>
                  <input type="radio" name="type" value={k} checked={form.type === k} onChange={set('type')} className="sr-only" />
                  <t.icon size={20} className="text-spruce-600" aria-hidden="true" />
                  <p className="mt-2 font-display font-bold text-spruce-900">{t.label}</p>
                  <p className="text-xs text-slate-600">{t.desc}</p>
                </label>
              ))}
            </div>
          </Section>

          <Section title="Details">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="label">Title</label>
                <input id="title" className="input" value={form.title} onChange={set('title')} placeholder="Casio fx-991EX Scientific Calculator" maxLength={80} />
              </div>
              <div>
                <label htmlFor="desc" className="label">Description</label>
                <textarea id="desc" rows={4} className="input" value={form.description} onChange={set('description')} placeholder="What is it, what comes with it, and any rules for using it?" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="cat" className="label">Category</label>
                  <select id="cat" className="input" value={form.category} onChange={set('category')}>
                    {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="cond" className="label">Condition</label>
                  <select id="cond" className="input" value={form.condition} onChange={set('condition')}>
                    {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {form.type === 'lend' && (
                <div>
                  <label htmlFor="days" className="label">Longest loan (days)</label>
                  <input id="days" type="number" min={1} max={60} className="input sm:w-40" value={form.maxDays} onChange={set('maxDays')} />
                </div>
              )}
              {form.type === 'exchange' && (
                <div>
                  <label htmlFor="wanted" className="label">What would you like in return?</label>
                  <input id="wanted" className="input" value={form.wanted} onChange={set('wanted')} placeholder="Statistics or Pre-Calculus textbook" />
                </div>
              )}
              <div>
                <label htmlFor="tags" className="label">Tags</label>
                <input id="tags" className="input" value={form.tags} onChange={set('tags')} placeholder="calculator, math, exam" />
                <p className="hint">Separate with commas. Tags help Smart Match find your listing.</p>
              </div>
              {canMarkSchool && (
                <label className="flex items-start gap-3 rounded-lg bg-spruce-50 p-3 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-spruce-700" checked={!!form.schoolOwned} onChange={(e) => setForm({ ...form, schoolOwned: e.target.checked })} />
                  <span>
                    <span className="font-semibold text-spruce-900">This is an official school resource</span>
                    <span className="block text-slate-600">Staff and administrators can manage requests for it.</span>
                  </span>
                </label>
              )}
            </div>
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Photo">
            {form.image ? (
              <div className="relative">
                <img src={form.image} alt="Listing preview" className="h-56 w-full rounded-lg object-cover" />
                <button type="button" onClick={() => setForm({ ...form, image: null })} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow hover:bg-white" aria-label="Remove photo">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 text-sm text-slate-600 hover:border-spruce-400 hover:bg-spruce-50">
                <ImagePlus size={28} className="text-spruce-500" aria-hidden="true" />
                <span className="font-semibold">{busy ? 'Processing photo...' : 'Add a photo'}</span>
                <span className="text-xs">Optional. It is resized and saved in your browser.</span>
                <input type="file" accept="image/*" className="sr-only" onChange={onFile} />
              </label>
            )}
          </Section>

          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-3">
            <button className="btn-primary flex-1" disabled={busy}>{editing ? 'Save changes' : 'Publish listing'}</button>
            <Link to={editing ? `/resource/${editing.id}` : '/listings'} className="btn-ghost">Cancel</Link>
          </div>
        </div>
      </form>
    </>
  )
}
