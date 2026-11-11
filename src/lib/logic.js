import { CAT, LEVELS, BADGES, CO2_PER_KG } from './constants'
import { addDays, daysBetween, fmtShort, overlaps, todayStr } from './utils'

/* ---------- Availability + conflict detection ---------- */

// Returns the approved booking that overlaps the given dates, if any.
export function hasConflict(borrowings, resourceId, start, end, ignoreId = null) {
  return borrowings.find(
    (b) => b.resourceId === resourceId && b.status === 'approved' && b.id !== ignoreId && overlaps(b.start, b.end, start, end)
  )
}

export const isOverdue = (b, today) => b.status === 'approved' && b.end < today
export const daysOverdue = (b, today) => Math.max(0, daysBetween(b.end, today))
export const isDueSoon = (b, today, within = 2) =>
  b.status === 'approved' && b.start <= today && b.end >= today && daysBetween(today, b.end) <= within

// Listings that members can see and request. Pending and rejected ones are only visible to their owner and admins.
export const isPublic = (r) => !['removed', 'paused', 'pending', 'rejected'].includes(r.status)

export function availabilityOf(resource, borrowings, today) {
  const make = (key, label, tone, available, note = '') => ({ key, label, tone, available, note })
  if (resource.status === 'removed') return make('removed', 'Removed', 'muted', false)
  if (resource.status === 'pending') return make('pending', 'Awaiting approval', 'warn', false)
  if (resource.status === 'rejected') return make('rejected', 'Not approved', 'bad', false)
  if (resource.status === 'paused') return make('paused', 'Paused', 'muted', false)
  if (resource.type === 'donate') {
    return resource.status === 'claimed' ? make('claimed', 'Claimed', 'muted', false) : make('available', 'Free to claim', 'ok', true)
  }
  if (resource.type === 'exchange') {
    return resource.status === 'exchanged' ? make('exchanged', 'Swapped', 'muted', false) : make('available', 'Open to swaps', 'ok', true)
  }
  const out = borrowings.find((b) => b.resourceId === resource.id && b.status === 'approved' && b.start <= today)
  if (out) {
    return out.end < today
      ? make('overdue', 'Overdue', 'bad', false)
      : make('out', `On loan until ${fmtShort(out.end)}`, 'warn', false)
  }
  const next = borrowings
    .filter((b) => b.resourceId === resource.id && b.status === 'approved' && b.start > today)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  return make('available', 'Available', 'ok', true, next ? `Reserved from ${fmtShort(next.start)}` : '')
}

export const canManage = (user, resource) =>
  !!user && !!resource && (resource.ownerId === user.id || (user.role === 'staff' && resource.schoolOwned))

/* ---------- Demand + stats ---------- */

export function demandMap(state) {
  const m = {}
  const bump = (id) => (m[id] = (m[id] || 0) + 1)
  state.borrowings.forEach((b) => bump(b.resourceId))
  state.claims.forEach((c) => bump(c.resourceId))
  state.exchanges.forEach((e) => bump(e.resourceId))
  return m
}

export function userStats(state, userId) {
  const { resources, borrowings, claims, exchanges, activity } = state
  const points = activity.filter((a) => a.userId === userId).reduce((s, a) => s + a.points, 0)
  const returns = borrowings.filter((b) => b.borrowerId === userId && b.status === 'returned')
  return {
    points,
    listings: resources.filter((r) => r.ownerId === userId).length,
    lends: borrowings.filter((b) => b.ownerId === userId && b.status === 'returned').length,
    returns: returns.length,
    onTime: returns.filter((b) => b.returnedAt <= b.end).length,
    donations: claims.filter((c) => c.ownerId === userId && c.status === 'completed').length,
    received: claims.filter((c) => c.requesterId === userId && c.status === 'completed').length,
    swaps: exchanges.filter((e) => e.status === 'completed' && (e.ownerId === userId || e.requesterId === userId)).length,
  }
}

export function levelFor(points) {
  let idx = 0
  LEVELS.forEach((l, i) => {
    if (points >= l.min) idx = i
  })
  const current = LEVELS[idx]
  const next = LEVELS[idx + 1] || null
  const progress = next ? Math.round(((points - current.min) / (next.min - current.min)) * 100) : 100
  return { current, next, progress, toNext: next ? next.min - points : 0 }
}

export function badgesFor(stats) {
  return BADGES.map((b) => {
    const value = b.value(stats)
    return { ...b, current: Math.min(value, b.goal), earned: value >= b.goal }
  })
}

export function pointsInRange(state, userId, sinceISO) {
  return state.activity
    .filter((a) => a.userId === userId && (!sinceISO || a.date >= sinceISO))
    .reduce((s, a) => s + a.points, 0)
}

export function wasteStats(state) {
  const byId = Object.fromEntries(state.resources.map((r) => [r.id, r]))
  const kg = (id) => CAT[byId[id]?.category]?.weight || 0
  const shares = [
    ...state.borrowings.filter((b) => b.status === 'returned').map((b) => b.resourceId),
    ...state.claims.filter((c) => c.status === 'completed').map((c) => c.resourceId),
    ...state.exchanges.filter((e) => e.status === 'completed').map((e) => e.resourceId),
  ]
  const totalKg = shares.reduce((s, id) => s + kg(id), 0)
  return { shares: shares.length, kg: Math.round(totalKg * 10) / 10, co2: Math.round(totalKg * CO2_PER_KG * 10) / 10 }
}

export function weeklySeries(state, today, weeks = 8) {
  const rows = Array.from({ length: weeks }, (_, i) => {
    const idx = weeks - 1 - i
    return { week: fmtShort(addDays(today, -(idx * 7 + 6))), Borrow: 0, Donate: 0, Swap: 0 }
  })
  const put = (date, key) => {
    const age = daysBetween(date, today)
    if (age < 0 || age >= weeks * 7) return
    rows[weeks - 1 - Math.floor(age / 7)][key] += 1
  }
  state.borrowings.forEach((b) => put(b.createdAt, 'Borrow'))
  state.claims.forEach((c) => put(c.createdAt, 'Donate'))
  state.exchanges.forEach((e) => put(e.createdAt, 'Swap'))
  return rows
}

/* ---------- Smart resource matching ---------- */

const STOP = new Set(
  'a an the i me my we our need needs want to for of and or in on at is are be with some from this that it as by looking something borrow borrowing lend lending use using get have has will can would like please any so im ill'.split(' ')
)

const SYN = {
  exam: ['calculator', 'reviewer', 'book'],
  quiz: ['reviewer', 'calculator'],
  test: ['reviewer', 'calculator'],
  study: ['reviewer', 'book'],
  math: ['calculator', 'geometry', 'protractor', 'textbook'],
  calculus: ['calculator', 'textbook'],
  algebra: ['calculator'],
  statistics: ['calculator', 'textbook'],
  physics: ['calculator', 'reviewer'],
  chemistry: ['periodic', 'chart', 'lab'],
  science: ['microscope', 'lab', 'chart'],
  biology: ['microscope', 'lab'],
  reading: ['book', 'anthology'],
  literature: ['anthology', 'book'],
  draw: ['sketchbook', 'charcoal', 'art'],
  drawing: ['sketchbook', 'charcoal', 'art'],
  sketch: ['sketchbook', 'charcoal'],
  paint: ['watercolor', 'acrylic', 'brush'],
  painting: ['watercolor', 'acrylic', 'brush'],
  sport: ['ball', 'racket', 'net'],
  sports: ['ball', 'racket', 'net'],
  intramurals: ['basketball', 'volleyball', 'ball'],
  practice: ['ball', 'racket'],
  game: ['chess', 'ball'],
  event: ['sound', 'projector', 'tables', 'tripod'],
  program: ['sound', 'projector', 'tables'],
  presentation: ['projector', 'tripod'],
  defense: ['projector'],
  thesis: ['projector', 'tripod'],
  video: ['tripod', 'camera'],
  film: ['tripod', 'camera'],
  photo: ['tripod', 'camera'],
  music: ['sound', 'speaker'],
  party: ['sound', 'tables'],
  coding: ['arduino', 'kit'],
  robotics: ['arduino', 'kit'],
  electronics: ['arduino', 'kit'],
  write: ['notebook', 'pen', 'highlighter'],
  notes: ['notebook', 'pen', 'highlighter'],
  geometry: ['compass', 'protractor'],
}

const tokenize = (str = '') =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))

export function matchResources(query, resources, borrowings, today, demand = {}) {
  const tokens = tokenize(query)
  if (!tokens.length) return []
  const weights = new Map()
  tokens.forEach((t) => weights.set(t, 1))
  tokens.forEach((t) => (SYN[t] || []).forEach((s) => !weights.has(s) && weights.set(s, 0.5)))

  const results = []
  for (const r of resources) {
    if (!isPublic(r)) continue
    const title = r.title.toLowerCase()
    const desc = r.description.toLowerCase()
    const tags = r.tags.join(' ').toLowerCase()
    const cat = CAT[r.category].label.toLowerCase()
    let score = 0
    const direct = []
    const related = []
    for (const [t, w] of weights) {
      let hit = false
      if (title.includes(t)) { score += 4 * w; hit = true }
      if (tags.includes(t)) { score += 3 * w; hit = true }
      if (cat.includes(t)) { score += 2 * w; hit = true }
      if (desc.includes(t)) { score += 1.5 * w; hit = true }
      if (hit) (w === 1 ? direct : related).push(t)
    }
    if (score === 0) continue
    const a = availabilityOf(r, borrowings, today)
    score += a.available ? 2 : -3
    score += Math.min(demand[r.id] || 0, 5) * 0.2
    const reasons = []
    if (direct.length) reasons.push(`Matches "${direct[0]}"`)
    else if (related.length) reasons.push(`Related to "${related[0]}"`)
    if (a.available) reasons.push(r.type === 'donate' ? 'Free to claim' : r.type === 'exchange' ? 'Open to swaps' : 'Available to borrow')
    else reasons.push(a.label)
    results.push({ resource: r, score, reasons })
  }
  return results.sort((x, y) => y.score - x.score)
}

export function recommendFor(user, state, today, limit = 4) {
  const demand = demandMap(state)
  const byId = Object.fromEntries(state.resources.map((r) => [r.id, r]))
  const catCount = {}
  const seen = new Set()
  const touch = (resourceId) => {
    const r = byId[resourceId]
    if (!r) return
    catCount[r.category] = (catCount[r.category] || 0) + 1
    seen.add(resourceId)
  }
  state.borrowings.filter((b) => b.borrowerId === user.id).forEach((b) => touch(b.resourceId))
  state.claims.filter((c) => c.requesterId === user.id).forEach((c) => touch(c.resourceId))
  state.exchanges.filter((e) => e.requesterId === user.id).forEach((e) => touch(e.resourceId))

  return state.resources
    .filter((r) => r.ownerId !== user.id && isPublic(r))
    .map((r) => {
      const a = availabilityOf(r, state.borrowings, today)
      const cc = catCount[r.category] || 0
      const score = cc * 3 + (demand[r.id] || 0) * 0.4 + (a.available ? 3 : -6) + (seen.has(r.id) ? -1 : 0)
      const reason = !a.available
        ? a.label
        : cc > 0
          ? `Because you used ${CAT[r.category].short.toLowerCase()} before`
          : (demand[r.id] || 0) >= 3
            ? 'Popular right now'
            : 'Recently shared'
      return { resource: r, score, reason, availability: a }
    })
    .filter((x) => x.availability.available)
    .sort((x, y) => y.score - x.score)
    .slice(0, limit)
}

/* ---------- Reminders ---------- */

// Everything a user should be reminded about, computed fresh from state.
export function remindersFor(state, user, today) {
  const rmap = Object.fromEntries(state.resources.map((r) => [r.id, r]))
  const manages = (x) => canManage(user, rmap[x.resourceId])
  const mine = state.borrowings.filter((b) => b.borrowerId === user.id)

  const overdue = mine.filter((b) => isOverdue(b, today))
  const dueSoon = mine.filter((b) => isDueSoon(b, today))
  const overdueOut = state.borrowings.filter((b) => isOverdue(b, today) && manages(b) && b.borrowerId !== user.id)
  const incomingBorrow = state.borrowings.filter((b) => b.status === 'pending' && manages(b))
  const incomingClaims = state.claims.filter((c) => c.status === 'pending' && manages(c))
  const incomingSwaps = state.exchanges.filter((e) => e.status === 'pending' && manages(e))
  const pendingApprovals = user.role === 'admin' ? state.resources.filter((r) => r.status === 'pending') : []

  const unreadMessages = (state.messages || []).filter((m) => m.toId === user.id && !m.read)

  const total = overdue.length + dueSoon.length + overdueOut.length + incomingBorrow.length + incomingClaims.length + incomingSwaps.length + pendingApprovals.length + unreadMessages.length
  return { overdue, dueSoon, overdueOut, incomingBorrow, incomingClaims, incomingSwaps, pendingApprovals, unreadMessages, total }
}

/* ---------- Starter data ---------- */

// One starter account per role. Credentials are listed in README.md.
const ACCOUNTS = [
  { id: 'u_admin', name: 'Admin User', email: 'admin@reuseu.edu', password: 'Admin@123', role: 'admin', dept: 'Office of the Principal' },
  { id: 'u_teacher', name: 'Sample Teacher', email: 'teacher@reuseu.edu', password: 'Teacher@123', role: 'teacher', dept: 'Science Department' },
  { id: 'u_staff', name: 'Sample Staff', email: 'staff@reuseu.edu', password: 'Staff@123', role: 'staff', dept: 'Property Custodian' },
  { id: 'u_student', name: 'Sample Student', email: 'student@reuseu.edu', password: 'Student@123', role: 'student', dept: 'Grade 11' },
]

export function buildSeed() {
  const today = todayStr()
  return {
    version: 2,
    session: null,
    users: ACCOUNTS.map((a) => ({ ...a, bio: '', joined: today, suspended: false })),
    resources: [],
    borrowings: [],
    claims: [],
    exchanges: [],
    messages: [],
    activity: [],
  }
}
