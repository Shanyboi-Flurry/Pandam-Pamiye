import { POINTS } from './constants'
import { canManage, hasConflict, isOverdue } from './logic'
import { daysBetween, fmtDate, overlaps, todayStr, uid } from './utils'

const fail = (error) => ({ ok: false, error })
const ok = (extra = {}) => ({ ok: true, ...extra })

const me = (s) => {
  const u = s.users.find((x) => x.id === s.session?.userId)
  return u && !u.suspended ? u : null
}

const log = (userId, type, resourceId, text, points = POINTS[type]) => ({
  id: uid('a'), userId, type, points, resourceId, text, date: todayStr(),
})

const titleOf = (s, id) => s.resources.find((r) => r.id === id)?.title || 'item'

// Pending requests on a resource get declined when it is no longer open.
function declinePending(s, resourceId, note) {
  const t = todayStr()
  const decline = (x) => (x.resourceId === resourceId && x.status === 'pending' ? { ...x, status: 'rejected', note, decidedAt: t } : x)
  return { borrowings: s.borrowings.map(decline), claims: s.claims.map(decline), exchanges: s.exchanges.map(decline) }
}

export function makeActions(ref, commit) {
  const get = () => ref.current

  return {
    /* ----- auth + profile ----- */
    register({ name, email, password, role, dept }) {
      const s = get()
      const em = email.trim().toLowerCase()
      if (!name.trim()) return fail('Enter your full name.')
      if (!/^\S+@\S+\.\S+$/.test(em)) return fail('Enter a valid email address.')
      if (password.length < 6) return fail('Use a password with at least 6 characters.')
      if (s.users.some((u) => u.email === em)) return fail('An account with this email already exists. Log in instead.')
      const user = { id: uid('u'), name: name.trim(), email: em, password, role, dept: dept.trim(), bio: '', joined: todayStr(), suspended: false }
      commit({ ...s, users: [...s.users, user], session: { userId: user.id } })
      return ok()
    },
    login(email, password) {
      const s = get()
      const u = s.users.find((x) => x.email === email.trim().toLowerCase() && x.password === password)
      if (!u) return fail('Email or password is incorrect.')
      if (u.suspended) return fail('This account is suspended. Contact an administrator.')
      commit({ ...s, session: { userId: u.id } })
      return ok()
    },
    logout() {
      commit({ ...get(), session: null })
    },
    updateProfile(patch) {
      const s = get()
      const u = me(s)
      if (!u) return fail('Log in first.')
      commit({ ...s, users: s.users.map((x) => (x.id === u.id ? { ...x, ...patch } : x)) })
      return ok()
    },

    /* ----- resources ----- */
    addResource(data) {
      const s = get()
      const u = me(s)
      if (!u) return fail('Log in first.')
      // Everyone except the administrator needs approval before a listing goes live.
      const needsApproval = u.role !== 'admin'
      const r = {
        id: uid('r'), ownerId: u.id, createdAt: todayStr(), ...data,
        status: needsApproval ? 'pending' : 'active', reviewNote: '',
        schoolOwned: u.role !== 'student' && !!data.schoolOwned,
      }
      commit({
        ...s,
        resources: [r, ...s.resources],
        activity: needsApproval ? s.activity : [...s.activity, log(u.id, 'list', r.id, `Listed "${r.title}"`)],
      })
      return ok({ resource: r, pending: needsApproval })
    },
    updateResource(id, patch) {
      const s = get()
      const r = s.resources.find((x) => x.id === id)
      if (!canManage(me(s), r)) return fail('You cannot edit this listing.')
      const resubmit = r.status === 'rejected' ? { status: 'pending', reviewNote: '' } : {}
      commit({ ...s, resources: s.resources.map((x) => (x.id === id ? { ...x, ...patch, ...resubmit } : x)) })
      return ok({ resubmitted: r.status === 'rejected' })
    },
    togglePause(id) {
      const s = get()
      const r = s.resources.find((x) => x.id === id)
      if (!canManage(me(s), r)) return fail('You cannot change this listing.')
      if (r.status !== 'active' && r.status !== 'paused') return fail('This listing is already closed.')
      commit({ ...s, resources: s.resources.map((x) => (x.id === id ? { ...x, status: r.status === 'active' ? 'paused' : 'active' } : x)) })
      return ok({ paused: r.status === 'active' })
    },
    removeResource(id) {
      const s = get()
      const r = s.resources.find((x) => x.id === id)
      if (!canManage(me(s), r)) return fail('You cannot remove this listing.')
      const busy =
        s.borrowings.some((b) => b.resourceId === id && b.status === 'approved') ||
        s.claims.some((c) => c.resourceId === id && c.status === 'approved') ||
        s.exchanges.some((e) => e.resourceId === id && e.status === 'accepted')
      if (busy) return fail('Finish the active loan, handover, or swap before removing this listing.')
      const declined = declinePending(s, id, 'The listing was removed.')
      commit({ ...s, ...declined, resources: s.resources.map((x) => (x.id === id ? { ...x, status: 'removed' } : x)) })
      return ok()
    },

    /* ----- borrowing ----- */
    requestBorrow({ resourceId, start, end, purpose }) {
      const s = get()
      const u = me(s)
      const t = todayStr()
      if (!u) return fail('Log in first.')
      const r = s.resources.find((x) => x.id === resourceId)
      if (!r || r.type !== 'lend' || r.status !== 'active') return fail('This item is not open for borrowing.')
      if (r.ownerId === u.id) return fail('You cannot borrow your own listing.')
      if (!start || !end) return fail('Choose pickup and return dates.')
      if (start < t) return fail('Pickup cannot be in the past.')
      if (end < start) return fail('The return date must be on or after the pickup date.')
      const days = daysBetween(start, end) + 1
      if (days > r.maxDays) return fail(`This item can be borrowed for up to ${r.maxDays} days. You chose ${days}.`)
      if (s.borrowings.some((b) => b.borrowerId === u.id && isOverdue(b, t))) return fail('Return your overdue item before borrowing something else.')
      const c = hasConflict(s.borrowings, resourceId, start, end)
      if (c) return fail(`Already reserved from ${fmtDate(c.start)} to ${fmtDate(c.end)}. Pick different dates.`)
      if (s.borrowings.some((b) => b.resourceId === resourceId && b.borrowerId === u.id && b.status === 'pending' && overlaps(b.start, b.end, start, end))) {
        return fail('You already have a pending request for these dates.')
      }
      const b = {
        id: uid('b'), resourceId, borrowerId: u.id, ownerId: r.ownerId, start, end, status: 'pending',
        purpose: purpose.trim(), note: '', createdAt: t, decidedAt: null, returnedAt: null,
      }
      commit({ ...s, borrowings: [b, ...s.borrowings] })
      return ok({ borrowing: b })
    },
    decideBorrow(id, approve, note = '') {
      const s = get()
      const u = me(s)
      const b = s.borrowings.find((x) => x.id === id)
      const r = b && s.resources.find((x) => x.id === b.resourceId)
      if (!b || !canManage(u, r)) return fail('You cannot manage this request.')
      if (b.status !== 'pending') return fail('This request was already answered.')
      const t = todayStr()
      if (!approve) {
        commit({ ...s, borrowings: s.borrowings.map((x) => (x.id === id ? { ...x, status: 'rejected', note, decidedAt: t } : x)) })
        return ok()
      }
      if (hasConflict(s.borrowings, b.resourceId, b.start, b.end, id)) return fail('These dates now overlap an approved booking.')
      let declined = 0
      const borrowings = s.borrowings.map((x) => {
        if (x.id === id) return { ...x, status: 'approved', decidedAt: t }
        if (x.resourceId === b.resourceId && x.status === 'pending' && overlaps(x.start, x.end, b.start, b.end)) {
          declined += 1
          return { ...x, status: 'rejected', note: 'Those dates were booked by another request.', decidedAt: t }
        }
        return x
      })
      commit({ ...s, borrowings })
      return ok({ declined })
    },
    markReturned(id) {
      const s = get()
      const u = me(s)
      const b = s.borrowings.find((x) => x.id === id)
      const r = b && s.resources.find((x) => x.id === b.resourceId)
      if (!b || !canManage(u, r)) return fail('You cannot manage this loan.')
      if (b.status !== 'approved') return fail('Only active loans can be marked as returned.')
      const t = todayStr()
      const onTime = t <= b.end
      const title = titleOf(s, b.resourceId)
      commit({
        ...s,
        borrowings: s.borrowings.map((x) => (x.id === id ? { ...x, status: 'returned', returnedAt: t } : x)),
        activity: [
          ...s.activity,
          log(b.ownerId, 'lend', b.resourceId, `Loan completed: "${title}"`),
          log(b.borrowerId, onTime ? 'return_on_time' : 'return_late', b.resourceId, `${onTime ? 'Returned on time' : 'Returned late'}: "${title}"`),
        ],
      })
      return ok({ onTime })
    },
    cancelBorrow(id) {
      const s = get()
      const u = me(s)
      const b = s.borrowings.find((x) => x.id === id)
      if (!b || b.borrowerId !== u?.id) return fail('You cannot cancel this request.')
      const t = todayStr()
      if (!(b.status === 'pending' || (b.status === 'approved' && b.start > t))) return fail('This request can no longer be cancelled.')
      commit({ ...s, borrowings: s.borrowings.map((x) => (x.id === id ? { ...x, status: 'cancelled', decidedAt: t } : x)) })
      return ok()
    },

    /* ----- donations ----- */
    requestClaim({ resourceId, message }) {
      const s = get()
      const u = me(s)
      if (!u) return fail('Log in first.')
      const r = s.resources.find((x) => x.id === resourceId)
      if (!r || r.type !== 'donate' || r.status !== 'active') return fail('This item is no longer available.')
      if (r.ownerId === u.id) return fail('You cannot claim your own donation.')
      if (s.claims.some((c) => c.resourceId === resourceId && c.requesterId === u.id && (c.status === 'pending' || c.status === 'approved'))) {
        return fail('You already asked for this item.')
      }
      const c = { id: uid('c'), resourceId, requesterId: u.id, ownerId: r.ownerId, status: 'pending', message: message.trim(), createdAt: todayStr(), decidedAt: null, completedAt: null }
      commit({ ...s, claims: [c, ...s.claims] })
      return ok()
    },
    decideClaim(id, approve, note = '') {
      const s = get()
      const c = s.claims.find((x) => x.id === id)
      const r = c && s.resources.find((x) => x.id === c.resourceId)
      if (!c || !canManage(me(s), r)) return fail('You cannot manage this request.')
      if (c.status !== 'pending') return fail('This request was already answered.')
      const t = todayStr()
      if (!approve) {
        commit({ ...s, claims: s.claims.map((x) => (x.id === id ? { ...x, status: 'rejected', note, decidedAt: t } : x)) })
        return ok()
      }
      const claims = s.claims.map((x) => {
        if (x.id === id) return { ...x, status: 'approved', decidedAt: t }
        if (x.resourceId === c.resourceId && x.status === 'pending') return { ...x, status: 'rejected', note: 'The item went to another person.', decidedAt: t }
        return x
      })
      commit({ ...s, claims, resources: s.resources.map((x) => (x.id === r.id ? { ...x, status: 'claimed' } : x)) })
      return ok()
    },
    completeClaim(id) {
      const s = get()
      const c = s.claims.find((x) => x.id === id)
      const r = c && s.resources.find((x) => x.id === c.resourceId)
      if (!c || !canManage(me(s), r)) return fail('You cannot manage this donation.')
      if (c.status !== 'approved') return fail('Approve the request first.')
      commit({
        ...s,
        claims: s.claims.map((x) => (x.id === id ? { ...x, status: 'completed', completedAt: todayStr() } : x)),
        activity: [
          ...s.activity,
          log(c.ownerId, 'donate', c.resourceId, `Donated "${r.title}"`),
          log(c.requesterId, 'receive', c.resourceId, `Received "${r.title}"`),
        ],
      })
      return ok()
    },
    cancelClaim(id) {
      const s = get()
      const c = s.claims.find((x) => x.id === id)
      if (!c || c.requesterId !== me(s)?.id || c.status !== 'pending') return fail('This request can no longer be cancelled.')
      commit({ ...s, claims: s.claims.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)) })
      return ok()
    },

    /* ----- exchanges ----- */
    requestExchange({ resourceId, offerTitle, offerDescription, message }) {
      const s = get()
      const u = me(s)
      if (!u) return fail('Log in first.')
      const r = s.resources.find((x) => x.id === resourceId)
      if (!r || r.type !== 'exchange' || r.status !== 'active') return fail('This item is no longer open to swaps.')
      if (r.ownerId === u.id) return fail('You cannot swap with your own listing.')
      if (!offerTitle.trim()) return fail('Tell the owner what you would offer.')
      if (s.exchanges.some((e) => e.resourceId === resourceId && e.requesterId === u.id && (e.status === 'pending' || e.status === 'accepted'))) {
        return fail('You already sent an offer for this item.')
      }
      const e = {
        id: uid('x'), resourceId, requesterId: u.id, ownerId: r.ownerId, offerTitle: offerTitle.trim(),
        offerDescription: offerDescription.trim(), message: message.trim(), status: 'pending', createdAt: todayStr(), decidedAt: null, completedAt: null,
      }
      commit({ ...s, exchanges: [e, ...s.exchanges] })
      return ok()
    },
    decideExchange(id, accept, note = '') {
      const s = get()
      const e = s.exchanges.find((x) => x.id === id)
      const r = e && s.resources.find((x) => x.id === e.resourceId)
      if (!e || !canManage(me(s), r)) return fail('You cannot manage this offer.')
      if (e.status !== 'pending') return fail('This offer was already answered.')
      const t = todayStr()
      if (!accept) {
        commit({ ...s, exchanges: s.exchanges.map((x) => (x.id === id ? { ...x, status: 'rejected', note, decidedAt: t } : x)) })
        return ok()
      }
      const exchanges = s.exchanges.map((x) => {
        if (x.id === id) return { ...x, status: 'accepted', decidedAt: t }
        if (x.resourceId === e.resourceId && x.status === 'pending') return { ...x, status: 'rejected', note: 'The owner accepted another offer.', decidedAt: t }
        return x
      })
      commit({ ...s, exchanges, resources: s.resources.map((x) => (x.id === r.id ? { ...x, status: 'exchanged' } : x)) })
      return ok()
    },
    completeExchange(id) {
      const s = get()
      const e = s.exchanges.find((x) => x.id === id)
      const r = e && s.resources.find((x) => x.id === e.resourceId)
      if (!e || !(canManage(me(s), r) || e.requesterId === me(s)?.id)) return fail('You cannot manage this swap.')
      if (e.status !== 'accepted') return fail('Accept the offer first.')
      commit({
        ...s,
        exchanges: s.exchanges.map((x) => (x.id === id ? { ...x, status: 'completed', completedAt: todayStr() } : x)),
        activity: [
          ...s.activity,
          log(e.ownerId, 'exchange', e.resourceId, `Exchanged "${r.title}"`),
          log(e.requesterId, 'exchange', e.resourceId, `Exchanged for "${r.title}"`),
        ],
      })
      return ok()
    },
    cancelExchange(id) {
      const s = get()
      const e = s.exchanges.find((x) => x.id === id)
      if (!e || e.requesterId !== me(s)?.id || e.status !== 'pending') return fail('This offer can no longer be cancelled.')
      commit({ ...s, exchanges: s.exchanges.map((x) => (x.id === id ? { ...x, status: 'cancelled' } : x)) })
      return ok()
    },

    /* ----- messages ----- */
    sendMessage({ toId, text, resourceId = null }) {
      const s = get()
      const u = me(s)
      if (!u) return fail('Log in first.')
      const body = (text || '').trim()
      if (!body) return fail('Write a message first.')
      if (body.length > 1000) return fail('Keep messages under 1,000 characters.')
      const to = s.users.find((x) => x.id === toId)
      if (!to || to.suspended || to.id === u.id) return fail('You cannot message this person.')
      const m = { id: uid('m'), fromId: u.id, toId, text: body, resourceId, createdAt: new Date().toISOString(), read: false }
      commit({ ...s, messages: [...(s.messages || []), m] })
      return ok({ message: m })
    },
    markRead(otherId) {
      const s = get()
      const u = me(s)
      const mine = (m) => m.toId === u?.id && m.fromId === otherId && !m.read
      if (!u || !(s.messages || []).some(mine)) return ok()
      commit({ ...s, messages: s.messages.map((m) => (mine(m) ? { ...m, read: true } : m)) })
      return ok()
    },

    /* ----- admin: listing approval ----- */
    approveResource(id) {
      const s = get()
      if (me(s)?.role !== 'admin') return fail('Only administrators can approve listings.')
      const r = s.resources.find((x) => x.id === id)
      if (!r || r.status !== 'pending') return fail('This listing is not waiting for approval.')
      commit({
        ...s,
        resources: s.resources.map((x) => (x.id === id ? { ...x, status: 'active', reviewNote: '', reviewedAt: todayStr() } : x)),
        activity: [...s.activity, log(r.ownerId, 'list', r.id, `Listed "${r.title}"`)],
      })
      return ok()
    },
    rejectResource(id, note = '') {
      const s = get()
      if (me(s)?.role !== 'admin') return fail('Only administrators can reject listings.')
      const r = s.resources.find((x) => x.id === id)
      if (!r || r.status !== 'pending') return fail('This listing is not waiting for approval.')
      commit({ ...s, resources: s.resources.map((x) => (x.id === id ? { ...x, status: 'rejected', reviewNote: note.trim(), reviewedAt: todayStr() } : x)) })
      return ok()
    },
  }
}
