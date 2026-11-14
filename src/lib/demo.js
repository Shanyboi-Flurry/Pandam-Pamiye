import { POINTS } from './constants'
import { addDays, todayStr } from './utils'

// Sample activity so every account has something realistic to show (listings, loans, donations, swaps,
// messages, and pending items for the admin and owners to approve). Ids are fixed, so each record is
// added once and never overwritten; anything a person changes later stays changed.

const MIKA = 'moises.mikaellaandrea@student.auf.edu.ph'
// Total EcoPoints these three accounts should have. The part not earned by the sample records below
// is stored as one "Starting EcoPoints" entry.
const TOTALS = { 'sarmiento.kurtjustine@student.auf.edu.ph': 315, 'mandapat.justin@student.auf.edu.ph': 165, [MIKA]: 60 }

// key, owner, days ago, title, category, type, condition, status, description, extras
const RESOURCES = [
  ['calc', 'kurt', 55, 'Casio fx-991EX scientific calculator', 'gadgets', 'lend', 'Good', 'active', 'Works perfectly with fresh batteries and is allowed in most exams. Please keep the cover on.', { maxDays: 7, tags: ['calculator', 'math', 'exam'] }],
  ['calculus', 'kurt', 40, 'Calculus reviewer and problem sets', 'books', 'donate', 'Like new', 'claimed', 'Printed reviewer with solved examples for Calculus 1. Free to anyone who needs it.', { tags: ['calculus', 'reviewer'] }],
  ['speaker', 'kurt', 21, 'Bluetooth speaker (JBL Go)', 'event', 'lend', 'Good', 'active', 'Good for class presentations and small events. Charger included.', { maxDays: 3, tags: ['audio', 'presentation'] }],
  ['pencils', 'kurt', 16, 'Mechanical pencil and eraser pack', 'supplies', 'exchange', 'New', 'exchanged', 'Five mechanical pencils with refills and two erasers, never used.', { wanted: 'Highlighters or sticky notes', tags: ['stationery'] }],
  ['ball', 'kurt', 1, 'Spalding basketball (size 7)', 'sports', 'lend', 'Good', 'pending', 'Indoor and outdoor ball that still has good grip.', { maxDays: 5, tags: ['basketball', 'pe'] }],
  ['paint', 'justin', 36, 'Watercolor set, 24 colors', 'art', 'exchange', 'Like new', 'exchanged', 'Used only twice. Comes with two brushes and a mixing palette.', { wanted: 'Sketchpad or brush set', tags: ['art', 'painting'] }],
  ['racket', 'justin', 20, 'Badminton racket pair with shuttlecocks', 'sports', 'lend', 'Good', 'active', 'Two rackets and a tube of shuttlecocks, good for PE or a casual game.', { maxDays: 5, tags: ['badminton', 'pe'] }],
  ['gown', 'justin', 2, 'Chemistry lab gown (size M)', 'supplies', 'donate', 'Good', 'pending', 'Clean lab gown from last semester. Free to a student who needs one.', { tags: ['chemistry', 'lab'] }],
  ['flash', 'mika', 30, 'Anatomy flashcards (200 cards)', 'books', 'donate', 'Like new', 'claimed', 'Complete set with labeled diagrams. Great for review before exams.', { tags: ['anatomy', 'nursing'] }],
  ['colored', 'mika', 2, 'Colored pencils, 48 pieces', 'art', 'lend', 'New', 'pending', 'Unused set for art and design plates.', { maxDays: 7, tags: ['art', 'drawing'] }],
  ['proj', 'ramon', 60, 'Portable projector (Epson)', 'event', 'lend', 'Good', 'active', 'Bright and easy to set up. HDMI and VGA cables included.', { maxDays: 3, school: true, tags: ['projector', 'presentation'] }],
  ['chart', 'ramon', 28, 'Periodic table wall charts', 'supplies', 'donate', 'Good', 'active', 'Large printed charts, ideal for review sessions and class reporting.', { tags: ['chemistry', 'charts'] }],
  ['kit', 'ramon', 1, 'Physics lab kit (pulleys and spring scales)', 'gadgets', 'lend', 'Good', 'pending', 'Complete set for basic mechanics experiments.', { maxDays: 5, school: true, tags: ['physics', 'lab'] }],
  ['tables', 'jose', 58, 'Folding tables (set of 4)', 'event', 'lend', 'Good', 'active', 'Sturdy tables for booths and school events. Pickup at the property office.', { maxDays: 3, school: true, tags: ['event', 'booth'] }],
  ['cords', 'jose', 25, 'Heavy-duty extension cords', 'gadgets', 'lend', 'Good', 'active', 'Five meters each, with surge protection.', { maxDays: 3, school: true, tags: ['electrical', 'event'] }],
  ['notebooks', 'jose', 1, 'Used notebooks bundle (10 pieces)', 'supplies', 'donate', 'Fair', 'pending', 'Notebooks with unused pages left. Good for scratch work.', { tags: ['notebooks'] }],
  ['stem', 'paolo', 18, 'Engineering Physics textbook set', 'books', 'exchange', 'Good', 'active', 'Three textbooks in good condition with light highlighting.', { wanted: 'Calculus 2 reviewer', tags: ['engineering', 'textbook'] }],
  ['umbrella', 'paolo', 4, 'Old folding umbrella', 'supplies', 'donate', 'Fair', 'rejected', 'Umbrella with a few broken ribs.', { note: 'Please list items that are in usable condition. This umbrella has broken ribs.' }],
]

// key, resource, borrower, created (days from today), start, end, status, purpose, returned
const BORROWINGS = [
  ['b1', 'calc', 'paolo', -47, -45, -41, 'returned', 'College Algebra long exam', -41],
  ['b2', 'calc', 'justin', -33, -32, -28, 'returned', 'Statistics quiz', -28],
  ['b3', 'proj', 'kurt', -26, -25, -23, 'returned', 'Group presentation in Physics', -23],
  ['b4', 'tables', 'mika', -20, -19, -17, 'returned', 'Organization booth for Foundation Day', -17],
  ['b5', 'racket', 'kurt', -14, -13, -9, 'returned', 'PE badminton elimination', -9],
  ['b6', 'speaker', 'justin', -8, -7, -5, 'returned', 'Class report with audio clips', -5],
  ['b7', 'proj', 'justin', -3, -1, 2, 'approved', 'Debate practice'],
  ['b8', 'proj', 'kurt', -1, 6, 7, 'pending', 'Capstone defense rehearsal'],
  ['b9', 'cords', 'paolo', 0, 3, 5, 'pending', 'Covered court event'],
  ['b10', 'calc', 'mika', -1, 2, 6, 'pending', 'Pharmacology exam'],
]

// key, resource, requester, created, status, message
const CLAIMS = [
  ['c1', 'calculus', 'justin', -38, 'completed', 'Hi Kurt! This will help me review for the Calculus quiz.'],
  ['c2', 'flash', 'paolo', -22, 'completed', 'Can I have these for my Biology class? Thank you!'],
  ['c3', 'chart', 'kurt', -2, 'pending', 'Good day, sir! We need these for our Chemistry reporting.'],
  ['c4', 'chart', 'mika', -1, 'pending', 'May I claim the charts for our review session?'],
]

// key, resource, requester, created, status, offer title, offer description, message
const EXCHANGES = [
  ['x1', 'paint', 'paolo', -31, 'completed', 'Sketchpad A3 (30 sheets)', 'Unused, acid-free paper.', 'I would like to swap my sketchpad for your watercolor set.'],
  ['x2', 'pencils', 'paolo', -12, 'completed', 'Highlighter set (6 colors)', 'Brand new, still sealed.', 'Is a highlighter set okay for the pencil pack?'],
  ['x3', 'stem', 'justin', -1, 'pending', 'Calculus 2 reviewer', 'Complete with solutions.', 'Would you like to swap? I can meet at the canteen.'],
]

// key, from, to, hours ago, text, resource, unread
const MESSAGES = [
  ['m1', 'justin', 'kurt', 30 * 24, 'Hi Kurt! Is the Casio calculator still available this week?', 'calc'],
  ['m2', 'kurt', 'justin', 30 * 24 - 2, 'Yes, it is free from Monday. Please return it by Friday.', 'calc'],
  ['m3', 'justin', 'kurt', 30 * 24 - 3, 'Noted, thank you so much!', 'calc'],
  ['m4', 'paolo', 'mika', 22 * 24, 'Hello! I would like to claim the anatomy flashcards. I can pick them up after class.', 'flash'],
  ['m5', 'mika', 'paolo', 22 * 24 - 1, 'Sure! See you at the library tomorrow at 3 PM.', 'flash'],
  ['m6', 'kurt', 'ramon', 20, 'Good afternoon, sir! May I borrow the projector for our capstone rehearsal next week?', 'proj', true],
  ['m7', 'jose', 'paolo', 5, 'Hi Paolo, which event are the extension cords for? We need them back by Friday.', 'cords', true],
  ['m8', 'justin', 'paolo', 3, 'Hello! I can swap my Calculus 2 reviewer for your Engineering Physics textbooks. Interested?', 'stem', true],
  ['m9', 'admin', 'kurt', 8, 'Hi Kurt, your basketball listing is waiting for review. Please check that the condition is accurate.', 'ball', true],
  ['m10', 'ramon', 'kurt', 1, 'Hello Kurt, you can pick up the periodic table charts at the Science Office tomorrow.', 'chart', true],
]

// Earlier wording of sample records that were already saved (college-only wording now).
const REWORDED = [['Grade 11 STEM textbook set', 'Engineering Physics textbook set'], ['Reviewer for General Math', 'Calculus 2 reviewer'], ['General Math long exam', 'College Algebra long exam'], ['General Math reviewer', 'Calculus 2 reviewer'], ['your STEM textbooks', 'your Engineering Physics textbooks']]
const reword = (v) => (Array.isArray(v) ? v.map((x) => (x === 'stem' ? 'engineering' : x)) : typeof v === 'string' ? REWORDED.reduce((t, [a, b]) => t.split(a).join(b), v) : v)
const rewordRecords = (list, fields) => {
  let changed = false
  const out = list.map((r) => {
    if (!r.id.startsWith('demo_')) return r
    const patch = {}
    fields.forEach((f) => { if (JSON.stringify(reword(r[f])) !== JSON.stringify(r[f])) patch[f] = reword(r[f]) })
    if (!Object.keys(patch).length) return r
    changed = true
    return { ...r, ...patch }
  })
  return [out, changed]
}

export function applyDemo(data) {
  const today = todayStr()
  const day = (n) => addDays(today, n)
  const ids = new Set(data.users.map((u) => u.id))
  const who = { admin: 'u_admin', ramon: 'u_teacher', jose: 'u_staff', paolo: 'u_student', kurt: 'u_kurt', justin: 'u_justin', mika: data.users.find((u) => u.email.toLowerCase() === MIKA)?.id }
  const here = (...keys) => keys.every((k) => who[k] && ids.has(who[k]))
  const have = (list) => new Set(list.map((x) => x.id))

  const resources = [], borrowings = [], claims = [], exchanges = [], messages = [], activity = []
  const owner = {}, shown = new Set() // resource key -> owner key; resource keys that can be used
  const act = (key, who_, type, date, text, resourceId) => activity.push({ id: `demo_a_${key}_${type}_${who_}`, userId: who[who_], type, points: POINTS[type], resourceId, text, date })

  RESOURCES.forEach(([key, o, ago, title, category, type, condition, status, description, x = {}]) => {
    owner[key] = o
    if (!here(o)) return
    shown.add(key)
    const id = `demo_r_${key}`
    resources.push({
      id, ownerId: who[o], createdAt: day(-ago), title, description, category, condition, type, maxDays: x.maxDays ?? null, wanted: x.wanted || '', tags: x.tags || [], image: '',
      schoolOwned: !!x.school, status, reviewNote: x.note || '', ...(status === 'pending' ? {} : { reviewedAt: day(1 - ago) }),
    })
    if (status !== 'pending' && status !== 'rejected') act(key, o, 'list', day(1 - ago), `Listed "${title}"`, id)
  })
  const title = (key) => RESOURCES.find((r) => r[0] === key)[3]
  const usable = (resKey, other) => shown.has(resKey) && here(other)

  BORROWINGS.forEach(([key, rk, borrower, created, start, end, status, purpose, returned]) => {
    if (!usable(rk, borrower)) return
    const id = `demo_${key}`, resourceId = `demo_r_${rk}`
    borrowings.push({ id, resourceId, borrowerId: who[borrower], ownerId: who[owner[rk]], start: day(start), end: day(end), status, purpose, note: '', createdAt: day(created), decidedAt: status === 'pending' ? null : day(created + 1), returnedAt: status === 'returned' ? day(returned) : null })
    if (status === 'returned') {
      act(key, owner[rk], 'lend', day(returned), `Loan completed: "${title(rk)}"`, resourceId)
      act(key, borrower, 'return_on_time', day(returned), `Returned on time: "${title(rk)}"`, resourceId)
    }
  })
  CLAIMS.forEach(([key, rk, requester, created, status, message]) => {
    if (!usable(rk, requester)) return
    const id = `demo_${key}`, resourceId = `demo_r_${rk}`
    claims.push({ id, resourceId, requesterId: who[requester], ownerId: who[owner[rk]], status, message, createdAt: day(created), decidedAt: status === 'pending' ? null : day(created + 1), completedAt: status === 'completed' ? day(created + 3) : null })
    if (status === 'completed') {
      act(key, owner[rk], 'donate', day(created + 3), `Donated "${title(rk)}"`, resourceId)
      act(key, requester, 'receive', day(created + 3), `Received "${title(rk)}"`, resourceId)
    }
  })
  EXCHANGES.forEach(([key, rk, requester, created, status, offerTitle, offerDescription, message]) => {
    if (!usable(rk, requester)) return
    const id = `demo_${key}`, resourceId = `demo_r_${rk}`
    exchanges.push({ id, resourceId, requesterId: who[requester], ownerId: who[owner[rk]], offerTitle, offerDescription, message, status, createdAt: day(created), decidedAt: status === 'pending' ? null : day(created + 1), completedAt: status === 'completed' ? day(created + 4) : null })
    if (status === 'completed') {
      act(key, owner[rk], 'exchange', day(created + 4), `Exchanged "${title(rk)}"`, resourceId)
      act(key, requester, 'exchange', day(created + 4), `Exchanged for "${title(rk)}"`, resourceId)
    }
  })
  MESSAGES.forEach(([key, from, to, hours, text, rk, unread]) => {
    if (!here(from, to) || (rk && !shown.has(rk))) return
    messages.push({ id: `demo_${key}`, fromId: who[from], toId: who[to], text, resourceId: rk ? `demo_r_${rk}` : null, createdAt: new Date(Date.now() - hours * 3600000).toISOString(), read: !unread })
  })

  const fresh = (list, mine) => {
    const seen = have(list)
    return mine.filter((x) => !seen.has(x.id))
  }
  const add = { resources: fresh(data.resources, resources), borrowings: fresh(data.borrowings, borrowings), claims: fresh(data.claims, claims), exchanges: fresh(data.exchanges, exchanges), messages: fresh(data.messages, messages), activity: fresh(data.activity, activity) }
  let changed = Object.values(add).some((l) => l.length)
  const next = {
    ...data,
    resources: [...add.resources, ...data.resources], borrowings: [...add.borrowings, ...data.borrowings], claims: [...add.claims, ...data.claims], exchanges: [...add.exchanges, ...data.exchanges],
    messages: [...data.messages, ...add.messages], activity: [...data.activity, ...add.activity],
  }

  let edited = false
  ;[['resources', ['title', 'description', 'wanted', 'tags']], ['borrowings', ['purpose']], ['exchanges', ['offerTitle', 'offerDescription', 'message']], ['messages', ['text']]].forEach(([k, fields]) => {
    const [list, did] = rewordRecords(next[k], fields)
    if (did) { next[k] = list; edited = true }
  })
  if (edited) changed = true

  // Keep the three named accounts at their exact totals: the sample entries above plus one "Starting EcoPoints" entry.
  next.activity = next.activity.slice()
  Object.entries(TOTALS).forEach(([email, total]) => {
    const u = next.users.find((x) => x.email.toLowerCase() === email)
    if (!u) return
    const earned = next.activity.filter((a) => a.userId === u.id && a.id.startsWith('demo_a_')).reduce((s, a) => s + a.points, 0)
    const id = `a_start_${email.split('@')[0]}`, points = Math.max(total - earned, 0)
    const i = next.activity.findIndex((a) => a.id === id)
    if (i < 0) { next.activity.push({ id, userId: u.id, type: 'bonus', points, resourceId: null, text: 'Starting EcoPoints', date: today }); changed = true }
    else if (next.activity[i].points !== points) { next.activity[i] = { ...next.activity[i], points }; changed = true }
  })
  return changed ? next : data
}
