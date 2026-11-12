// Shared cloud storage (Supabase REST). The whole app data lives in one row of `app_state`,
// synced with a 3-way merge by record id so two people editing at once do not erase each other.
const URL = import.meta.env?.VITE_SUPABASE_URL
const KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY
export const REMOTE = Boolean(URL && KEY)

const call = async (query, init = {}) => {
  const res = await fetch(`${URL}/rest/v1/app_state?${query}`, {
    ...init,
    headers: { apikey: KEY, ...(KEY.startsWith('eyJ') && { Authorization: `Bearer ${KEY}` }), 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) throw new Error(`Database error ${res.status}`)
  const text = await res.text()
  return text ? JSON.parse(text) : []
}
const getVersion = async () => (await call('id=eq.1&select=version'))[0]?.version ?? null
const getRow = async () => (await call('id=eq.1&select=data,version'))[0] || null
const insertRow = (data) =>
  call('on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify({ id: 1, data, version: 1 }) })
const casUpdate = async (version, data) =>
  (await call(`id=eq.1&version=eq.${version}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify({ data, version: version + 1 }) })).length > 0

const COLS = ['users', 'resources', 'borrowings', 'claims', 'exchanges', 'messages', 'activity']
const NEWEST_FIRST = new Set(['resources', 'borrowings', 'claims', 'exchanges'])
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)

// Only these collections are shared. The login session stays in each browser.
export const pick = (s) => Object.fromEntries(COLS.map((k) => [k, s[k] || []]))

function mergeCol(key, server, base, mine) {
  const was = new Map(base.map((x) => [x.id, x]))
  const out = new Map(server.map((x) => [x.id, x]))
  const added = []
  for (const x of mine) {
    const old = was.get(x.id)
    if (old && same(old, x)) continue // untouched here: the server copy wins
    if (out.has(x.id)) out.set(x.id, x) // edited here
    else added.push(x) // created here
  }
  return NEWEST_FIRST.has(key) ? [...added, ...out.values()] : [...out.values(), ...added]
}

export const mergeState = (server, base, mine) =>
  Object.fromEntries(COLS.map((k) => [k, mergeCol(k, server[k] || [], base[k] || [], mine[k] || [])]))

// get() returns the current app state, apply(cols, first) stores merged data, seed() builds the starter data.
export function createSync({ get, apply, seed }) {
  let base = null
  let version = 0
  let dirty = false
  let busy = false
  let again = false

  async function run() {
    if (busy) { again = true; return }
    busy = true
    try {
      do {
        again = false
        if (base === null) {
          let row = await getRow()
          if (!row) { await insertRow(pick(seed())); row = await getRow() }
          base = row.data
          version = row.version
          apply(pick(base), true)
          continue
        }
        const remoteVersion = await getVersion()
        if (remoteVersion === version && !dirty) continue
        const local = pick(get())
        dirty = false
        const server = remoteVersion === version ? { data: base, version } : await getRow()
        const merged = mergeState(server.data, base, local)
        if (same(merged, pick(server.data))) {
          base = server.data
          version = server.version
        } else if (await casUpdate(server.version, merged)) {
          base = merged
          version = server.version + 1
        } else {
          dirty = true
          again = true
          continue
        }
        // Keep anything the person changed while we were talking to the server.
        const next = mergeState(base, local, pick(get()))
        if (!same(next, pick(get()))) apply(next, false)
      } while (again)
    } catch {
      dirty = true // offline or server error: try again on the next tick
    } finally {
      busy = false
    }
  }

  return { run, touch() { dirty = true; return run() } }
}
