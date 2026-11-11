import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Sparkles, SearchX } from 'lucide-react'
import { useStore } from '../store'
import { availabilityOf, isPublic, matchResources } from '../lib/logic'
import { CATEGORIES, CONDITIONS, TYPES } from '../lib/constants'
import { cx } from '../lib/utils'
import { EmptyState, PageHeader, ResourceCard } from '../components/ui'

const EXAMPLES = ['calculator for my physics exam', 'sound system for a school program', 'something to draw with', 'equipment for intramurals']

export default function Marketplace() {
  const { state, today, demand, userById } = useStore()
  const [params] = useSearchParams()
  const [q, setQ] = useState('')
  const [smart, setSmart] = useState(false)
  const [category, setCategory] = useState(params.get('category') || '')
  const [type, setType] = useState(params.get('type') || '')
  const [condition, setCondition] = useState('')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sort, setSort] = useState('newest')

  const rows = useMemo(() => {
    const base = state.resources.filter(isPublic)
    let list
    if (smart && q.trim()) {
      list = matchResources(q, base, state.borrowings, today, demand).map((m) => ({ resource: m.resource, reasons: m.reasons }))
    } else {
      const needle = q.trim().toLowerCase()
      list = base
        .filter((r) => {
          if (!needle) return true
          const hay = `${r.title} ${r.description} ${r.tags.join(' ')} ${userById(r.ownerId)?.name || ''}`.toLowerCase()
          return needle.split(/\s+/).every((w) => hay.includes(w))
        })
        .map((r) => ({ resource: r, reasons: [] }))
    }
    list = list
      .map((x) => ({ ...x, availability: availabilityOf(x.resource, state.borrowings, today) }))
      .filter(({ resource: r, availability: a }) =>
        (!category || r.category === category) && (!type || r.type === type) && (!condition || r.condition === condition) && (!availableOnly || a.available)
      )
    if (!(smart && q.trim())) {
      list.sort((a, b) => {
        if (sort === 'popular') return (demand[b.resource.id] || 0) - (demand[a.resource.id] || 0)
        if (sort === 'az') return a.resource.title.localeCompare(b.resource.title)
        return b.resource.createdAt.localeCompare(a.resource.createdAt)
      })
    }
    return list
  }, [state, today, demand, q, smart, category, type, condition, availableOnly, sort, userById])

  const reset = () => {
    setQ(''); setCategory(''); setType(''); setCondition(''); setAvailableOnly(false); setSort('newest')
  }

  return (
    <>
      <PageHeader title="Resources" subtitle="Find something to borrow, claim for free, or swap. Everything here is shared by people in your school." />

      <div className="card space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div role="group" aria-label="Search mode" className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm font-semibold">
            <button onClick={() => setSmart(false)} aria-pressed={!smart} className={cx('flex items-center gap-1.5 rounded-md px-3 py-1.5', !smart ? 'bg-spruce-700 text-white' : 'text-slate-600')}>
              <Search size={14} /> Keyword
            </button>
            <button onClick={() => setSmart(true)} aria-pressed={smart} className={cx('flex items-center gap-1.5 rounded-md px-3 py-1.5', smart ? 'bg-spruce-700 text-white' : 'text-slate-600')}>
              <Sparkles size={14} /> Smart Match
            </button>
          </div>
          <label className="sr-only" htmlFor="q">{smart ? 'Describe what you need' : 'Search resources'}</label>
          <input
            id="q"
            className="input min-w-[220px] flex-1"
            placeholder={smart ? 'Describe what you need, like "calculator for my physics exam"' : 'Search by title, tag, or owner'}
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {smart && !q.trim() && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-600">Try:</span>
            {EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => setQ(ex)} className="badge bg-marker-yellow/60 !px-3 !py-1 text-spruce-900 hover:bg-marker-yellow">
                {ex}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
          <button onClick={() => setCategory('')} aria-pressed={!category} className={cx('badge !px-3 !py-1.5', !category ? 'bg-spruce-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
            All categories
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(category === c.id ? '' : c.id)} aria-pressed={category === c.id} className={cx('badge !px-3 !py-1.5', category === c.id ? 'bg-spruce-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}>
              <c.icon size={14} aria-hidden="true" /> {c.short}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label htmlFor="type" className="sr-only">Resource type</label>
            <select id="type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t.label} ({t.tag.toLowerCase()})</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="cond" className="sr-only">Condition</label>
            <select id="cond" className="input" value={condition} onChange={(e) => setCondition(e.target.value)}>
              <option value="">Any condition</option>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sort" className="sr-only">Sort</label>
            <select id="sort" className="input" value={sort} onChange={(e) => setSort(e.target.value)} disabled={smart && !!q.trim()}>
              <option value="newest">Newest first</option>
              <option value="popular">Most requested</option>
              <option value="az">Title A to Z</option>
            </select>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">
            <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="h-4 w-4 accent-spruce-700" />
            Available now only
          </label>
          <button onClick={reset} className="btn-ghost">Clear filters</button>
        </div>
      </div>

      <p className="mb-3 mt-5 text-sm text-slate-600" aria-live="polite">
        {smart && q.trim() ? `Best matches for "${q.trim()}": ` : 'Showing '}
        <span className="font-semibold text-spruce-900">{rows.length}</span> {rows.length === 1 ? 'resource' : 'resources'}
      </p>

      {rows.length === 0 ? (
        <EmptyState icon={SearchX} title="No resources match" text="Try fewer filters, a different keyword, or switch to Smart Match to describe your need." action={<button className="btn-primary" onClick={reset}>Clear filters</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rows.map(({ resource, availability, reasons }) => (
            <ResourceCard key={resource.id} resource={resource} availability={availability} owner={userById(resource.ownerId)} reasons={reasons} />
          ))}
        </div>
      )}
    </>
  )
}
