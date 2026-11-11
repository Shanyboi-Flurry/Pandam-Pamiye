import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Search, Send, X } from 'lucide-react'
import { useStore } from '../store'
import { ROLES } from '../lib/constants'
import { cx } from '../lib/utils'
import { Avatar, EmptyState, PageHeader } from '../components/ui'

const when = (iso) => {
  const d = new Date(iso)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

export default function Messages() {
  const { user, state, userById, resourceById, sendMessage, markRead, notify } = useStore()
  const [params, setParams] = useSearchParams()
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const endRef = useRef(null)

  const otherId = params.get('to')
  const topicId = params.get('resource')
  const other = otherId ? userById(otherId) : null
  const topic = topicId ? resourceById(topicId) : null
  const all = state.messages || []

  const threads = useMemo(() => {
    const map = new Map()
    all
      .filter((m) => m.fromId === user.id || m.toId === user.id)
      .forEach((m) => {
        const oid = m.fromId === user.id ? m.toId : m.fromId
        const t = map.get(oid) || { oid, last: m, unread: 0 }
        if (m.createdAt >= t.last.createdAt) t.last = m
        if (m.toId === user.id && !m.read) t.unread += 1
        map.set(oid, t)
      })
    return [...map.values()].sort((a, b) => b.last.createdAt.localeCompare(a.last.createdAt))
  }, [all, user.id])

  const thread = other ? all.filter((m) => (m.fromId === user.id && m.toId === other.id) || (m.fromId === other.id && m.toId === user.id)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)) : []
  const unreadHere = other ? thread.filter((m) => m.toId === user.id && !m.read).length : 0

  useEffect(() => {
    if (other && unreadHere) markRead(other.id)
  }, [other, unreadHere, markRead])
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [thread.length, otherId])

  const people = state.users
    .filter((u) => u.id !== user.id && u.role !== 'admin' && !u.suspended)
    .filter((u) => !q.trim() || `${u.name} ${u.dept} ${ROLES[u.role].label}`.toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 8)

  const open = (id) => setParams({ to: id })

  const send = (e) => {
    e?.preventDefault()
    const res = sendMessage({ toId: other.id, text, resourceId: topic?.id || null })
    if (!res.ok) return notify(res.error, 'error')
    setText('')
  }

  const list = (
    <aside className={cx('card flex min-h-0 flex-col', other && 'hidden lg:flex')}>
      <div className="border-b border-slate-200 p-3">
        <label htmlFor="people" className="sr-only">Find someone to message</label>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input id="people" className="input !pl-9" placeholder="Find someone to message" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {q.trim() ? (
          people.length === 0 ? (
            <p className="p-4 text-sm text-slate-600">No members match "{q}".</p>
          ) : (
            <ul>
              {people.map((p) => (
                <li key={p.id}>
                  <button className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-spruce-50" onClick={() => { open(p.id); setQ('') }}>
                    <Avatar name={p.name} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-spruce-900">{p.name}</span>
                      <span className="block truncate text-xs text-slate-500">{ROLES[p.role].label}{p.dept ? `, ${p.dept}` : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : threads.length === 0 ? (
          <p className="p-4 text-sm text-slate-600">No conversations yet. Search for a member above, or use the Message button on a resource.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {threads.map((t) => {
              const o = userById(t.oid)
              return (
                <li key={t.oid}>
                  <button className={cx('flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-spruce-50', t.oid === otherId && 'bg-spruce-50')} onClick={() => open(t.oid)}>
                    <Avatar name={o?.name} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={cx('truncate text-sm text-spruce-900', t.unread ? 'font-bold' : 'font-semibold')}>{o?.name}</span>
                        <span className="shrink-0 text-xs text-slate-500">{when(t.last.createdAt)}</span>
                      </span>
                      <span className={cx('block truncate text-xs', t.unread ? 'font-semibold text-slate-800' : 'text-slate-500')}>
                        {t.last.fromId === user.id ? 'You: ' : ''}{t.last.text}
                      </span>
                    </span>
                    {t.unread > 0 && <span className="rounded-full bg-marker-coral px-1.5 text-xs font-bold text-white">{t.unread}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )

  const chat = (
    <section className={cx('card flex min-h-0 flex-col', !other && 'hidden lg:flex')} aria-label="Conversation">
      {!other ? (
        <div className="flex flex-1 items-center justify-center p-6">
          <EmptyState icon={MessageSquare} title="Select a conversation" text="Pick a conversation on the left, or search for a classmate, teacher or staff member to start a new one." />
        </div>
      ) : (
        <>
          <header className="flex items-center gap-3 border-b border-slate-200 p-3">
            <Link to="/messages" className="rounded p-1 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Back to conversations"><ArrowLeft size={20} /></Link>
            <Avatar name={other.name} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-spruce-900">{other.name}</p>
              <p className="truncate text-xs text-slate-500">{ROLES[other.role].label}{other.dept ? `, ${other.dept}` : ''}</p>
            </div>
          </header>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-spruce-50/40 p-4" aria-live="polite">
            {thread.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Say hello to {other.name.split(' ')[0]}. Keep it about school sharing and be kind.</p>}
            {thread.map((m) => {
              const mine = m.fromId === user.id
              const about = m.resourceId ? resourceById(m.resourceId) : null
              return (
                <div key={m.id} className={cx('flex', mine ? 'justify-end' : 'justify-start')}>
                  <div className={cx('max-w-[80%] rounded-2xl px-3.5 py-2 text-sm', mine ? 'rounded-br-sm bg-spruce-700 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800')}>
                    {about && (
                      <Link to={`/resource/${about.id}`} className={cx('mb-1 block text-xs font-semibold underline', mine ? 'text-marker-yellow' : 'text-spruce-700')}>About: {about.title}</Link>
                    )}
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={cx('mt-1 text-[11px]', mine ? 'text-spruce-200' : 'text-slate-400')}>{when(m.createdAt)}</p>
                  </div>
                </div>
              )
            })}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="border-t border-slate-200 p-3">
            {topic && (
              <p className="mb-2 flex items-center gap-2 text-xs text-slate-600">
                Asking about <span className="font-semibold text-spruce-800">{topic.title}</span>
                <button type="button" className="rounded p-0.5 hover:bg-slate-100" onClick={() => setParams({ to: other.id })} aria-label="Remove resource link"><X size={14} /></button>
              </p>
            )}
            <div className="flex items-end gap-2">
              <label htmlFor="msg" className="sr-only">Message</label>
              <textarea
                id="msg"
                rows={2}
                maxLength={1000}
                className="input resize-none"
                placeholder={`Message ${other.name.split(' ')[0]}`}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) send(e)
                }}
              />
              <button className="btn-primary h-10" disabled={!text.trim()}><Send size={16} /> Send</button>
            </div>
            <p className="hint">Enter to send, Shift+Enter for a new line. Messages are stored in this browser only.</p>
          </form>
        </>
      )}
    </section>
  )

  return (
    <>
      <PageHeader title="Messages" subtitle="Talk privately with other members to arrange pickup, ask about condition, or say thanks." />
      <div className="grid h-[calc(100vh-14rem)] min-h-[420px] gap-4 lg:grid-cols-[320px_1fr]">
        {list}
        {chat}
      </div>
    </>
  )
}
