import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { REMOTE, createSync, pick } from './lib/remote'
import { makeActions } from './lib/actions'
import { buildSeed, demandMap } from './lib/logic'
import { todayStr, uid } from './lib/utils'

const KEY = 'reuseu:v2'
const SESSION_KEY = 'reuseu:session'
const Ctx = createContext(null)

function load() {
  if (REMOTE) {
    let session = null
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY)) } catch { /* no saved session */ }
    return { ...pick({}), session }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw)
      if (s && s.version === 2 && Array.isArray(s.resources)) return { messages: [], ...s }
    }
  } catch {
    /* fall through to a fresh demo dataset */
  }
  return buildSeed()
}

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)
  const [today, setToday] = useState(todayStr())
  const [toasts, setToasts] = useState([])
  const [ready, setReady] = useState(!REMOTE)
  const ref = useRef(state)

  const sync = useMemo(
    () =>
      REMOTE
        ? createSync({
            get: () => ref.current,
            seed: buildSeed,
            apply: (cols, first) => {
              ref.current = { ...ref.current, ...cols }
              setState(ref.current)
              if (first) setReady(true)
            },
          })
        : null,
    []
  )

  const commit = useCallback((next) => {
    ref.current = next
    setState(next)
    sync?.touch()
  }, [sync])

  const notify = useCallback((message, kind = 'success') => {
    const id = uid('t')
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200)
  }, [])

  useEffect(() => {
    try {
      if (REMOTE) localStorage.setItem(SESSION_KEY, JSON.stringify(state.session))
      else localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      notify('Browser storage is full. Remove a listing photo to keep saving changes.', 'error')
    }
  }, [state, notify])

  // Keep "today" fresh so overdue flags update across midnight.
  useEffect(() => {
    const t = setInterval(() => setToday(todayStr()), 60000)
    return () => clearInterval(t)
  }, [])

  // Pull other people's changes (messages, requests, listings) every few seconds.
  useEffect(() => {
    if (!sync) return
    sync.run()
    const t = setInterval(sync.run, 4000)
    const onVisible = () => document.visibilityState === 'visible' && sync.run()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [sync])

  const actions = useMemo(() => makeActions(ref, commit), [commit])

  const value = useMemo(() => {
    const usersById = Object.fromEntries(state.users.map((u) => [u.id, u]))
    const resourcesById = Object.fromEntries(state.resources.map((r) => [r.id, r]))
    const sessionUser = state.session ? usersById[state.session.userId] : null
    return {
      state,
      ready,
      today,
      user: sessionUser && !sessionUser.suspended ? sessionUser : null,
      userById: (id) => usersById[id],
      resourceById: (id) => resourcesById[id],
      demand: demandMap(state),
      notify,
      toasts,
      dismissToast: (id) => setToasts((t) => t.filter((x) => x.id !== id)),
      ...actions,
    }
  }, [state, ready, today, toasts, notify, actions])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)
