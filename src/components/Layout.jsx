import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle, BarChart3, Bell, CalendarDays, ClipboardList, Clock, Gift, Leaf, LayoutDashboard, LogOut, Menu, Package,
  PlusCircle, Repeat, ShieldCheck, Store, Trophy, X, Inbox, MessageSquare,
} from 'lucide-react'
import { useStore } from '../store'
import { remindersFor, userStats } from '../lib/logic'
import { ROLES } from '../lib/constants'
import { cx } from '../lib/utils'
import { Avatar, Toasts, Logo } from './ui'

const LISTINGS_LABEL = { student: 'My listings', teacher: 'My shared resources', staff: 'School resources', admin: 'My listings' }

function buildNav(role) {
  if (role === 'admin') {
    return [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/admin', label: 'Listing approvals', icon: ShieldCheck, badge: 'approvals' },
      { to: '/marketplace', label: 'Resources', icon: Store },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ]
  }
  return [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/marketplace', label: 'Resources', icon: Store },
    { to: '/add', label: 'Add a resource', icon: PlusCircle },
    { to: '/borrowings', label: 'My borrowings', icon: ClipboardList, badge: 'borrow' },
    { to: '/listings', label: LISTINGS_LABEL[role], icon: Package },
    { to: '/donations', label: 'Donations', icon: Gift, badge: 'claims' },
    { to: '/exchanges', label: 'Exchanges', icon: Repeat, badge: 'swaps' },
    { to: '/messages', label: 'Messages', icon: MessageSquare, badge: 'messages' },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/ecopoints', label: 'EcoPoints', icon: Leaf },
    { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  ]
}

function Notifications({ rem }) {
  const [open, setOpen] = useState(false)
  const boxRef = useRef(null)
  const { pathname } = useLocation()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    const onDown = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const items = [
    ...(rem.overdue.length ? [{ icon: AlertTriangle, tone: 'text-red-600', text: `${rem.overdue.length} borrowed item${rem.overdue.length > 1 ? 's are' : ' is'} overdue`, to: '/borrowings' }] : []),
    ...(rem.dueSoon.length ? [{ icon: Clock, tone: 'text-amber-600', text: `${rem.dueSoon.length} item${rem.dueSoon.length > 1 ? 's are' : ' is'} due within 2 days`, to: '/borrowings' }] : []),
    ...(rem.overdueOut.length ? [{ icon: AlertTriangle, tone: 'text-red-600', text: `${rem.overdueOut.length} item${rem.overdueOut.length > 1 ? 's you lent are' : ' you lent is'} overdue`, to: '/borrowings?tab=incoming' }] : []),
    ...(rem.incomingBorrow.length ? [{ icon: Inbox, tone: 'text-spruce-600', text: `${rem.incomingBorrow.length} borrow request${rem.incomingBorrow.length > 1 ? 's' : ''} to answer`, to: '/borrowings?tab=incoming' }] : []),
    ...(rem.incomingClaims.length ? [{ icon: Gift, tone: 'text-spruce-600', text: `${rem.incomingClaims.length} donation request${rem.incomingClaims.length > 1 ? 's' : ''} to answer`, to: '/donations?tab=mine' }] : []),
    ...(rem.incomingSwaps.length ? [{ icon: Repeat, tone: 'text-spruce-600', text: `${rem.incomingSwaps.length} swap offer${rem.incomingSwaps.length > 1 ? 's' : ''} to answer`, to: '/exchanges?tab=incoming' }] : []),
    ...(rem.unreadMessages.length ? [{ icon: MessageSquare, tone: 'text-spruce-600', text: `${rem.unreadMessages.length} unread message${rem.unreadMessages.length > 1 ? 's' : ''}`, to: '/messages' }] : []),
    ...(rem.pendingApprovals.length ? [{ icon: ShieldCheck, tone: 'text-spruce-600', text: `${rem.pendingApprovals.length} new listing${rem.pendingApprovals.length > 1 ? 's' : ''} to approve`, to: '/admin' }] : []),
  ]

  return (
    <div className="relative" ref={boxRef}>
      <button onClick={() => setOpen((o) => !o)} className="btn-ghost relative !px-2.5" aria-label={`Notifications, ${rem.total} items`} aria-expanded={open}>
        <Bell size={18} />
        {rem.total > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-marker-coral px-1 text-[11px] font-bold text-white">{rem.total}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-600">You are all caught up. No reminders right now.</p>
          ) : (
            items.map((it) => (
              <Link key={it.text} to={it.to} className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-slate-50">
                <it.icon size={18} className={cx('mt-0.5 shrink-0', it.tone)} />
                <span>{it.text}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const { user, state, today, logout } = useStore()
  const [drawer, setDrawer] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setDrawer(false) }, [pathname])
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  const rem = remindersFor(state, user, today)
  const points = userStats(state, user.id).points
  const counts = {
    borrow: rem.incomingBorrow.length + rem.overdue.length + rem.overdueOut.length,
    claims: rem.incomingClaims.length,
    swaps: rem.incomingSwaps.length,
    messages: rem.unreadMessages.length,
    approvals: rem.pendingApprovals.length,
  }
  const nav = buildNav(user.role)

  const sidebar = (
    <div className="flex h-full flex-col bg-spruce-900 text-spruce-100">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/dashboard" aria-label="Pandam Pamiye dashboard">
          <Logo light school />
        </Link>
        <button className="rounded p-1 text-spruce-200 hover:bg-spruce-800 lg:hidden" onClick={() => setDrawer(false)} aria-label="Close menu">
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label="Main">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/add'}
            className={({ isActive }) =>
              cx('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition-colors', isActive ? 'bg-marker-yellow text-spruce-950' : 'hover:bg-spruce-800')
            }
          >
            <n.icon size={18} aria-hidden="true" />
            <span className="flex-1">{n.label}</span>
            {n.badge && counts[n.badge] > 0 && <span className="rounded-full bg-marker-coral px-1.5 text-xs font-bold text-white">{counts[n.badge]}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-spruce-800 p-3">
        <Link to="/profile" className="flex items-center gap-3 rounded-lg p-2 hover:bg-spruce-800">
          <Avatar name={user.name} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">{user.name}</span>
            <span className="block text-xs text-spruce-300">{ROLES[user.role].label}</span>
          </span>
        </Link>
        <button onClick={() => { logout(); navigate('/') }} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-spruce-200 hover:bg-spruce-800">
          <LogOut size={18} aria-hidden="true" /> Log out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{sidebar}</aside>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-spruce-950/50" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-paper/90 px-4 py-3 backdrop-blur sm:px-6">
          <button className="btn-ghost !px-2.5 lg:hidden" onClick={() => setDrawer(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          {user.role !== 'admin' && (
            <Link to="/ecopoints" className="flex items-center gap-1.5 rounded-lg bg-marker-yellow/70 px-3 py-2 text-sm font-bold text-spruce-950 hover:bg-marker-yellow">
              <Leaf size={16} aria-hidden="true" /> {points} EcoPoints
            </Link>
          )}
          <Notifications rem={rem} />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
      <Toasts />
    </div>
  )
}
