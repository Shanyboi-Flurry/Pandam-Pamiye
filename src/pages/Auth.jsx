import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ROLES } from '../lib/constants'
import { cx } from '../lib/utils'
import { Logo } from '../components/ui'

function Shell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="hero-gradient hidden flex-col justify-between p-10 lg:flex">
        <Link to="/"><Logo light school /></Link>
        <div>
          <p className="font-display text-4xl font-extrabold leading-tight text-white">Share more. Waste less. <span className="text-marker-yellow">Grow together.</span></p>
          <p className="mt-4 max-w-sm text-spruce-100">Borrow the calculator, lend the projector, give away the notebooks you never used.</p>
        </div>
        <p className="text-sm text-spruce-200">Data stays in this browser.</p>
      </div>
      <div className="flex items-center justify-center bg-white px-4 py-10">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 inline-block lg:hidden"><Logo school /></Link>
          <h1 className="text-3xl font-bold text-spruce-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function Login() {
  const { user, login } = useStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const dest = location.state?.from || '/dashboard'

  if (user) return <Navigate to={dest} replace />

  const submit = (e) => {
    e.preventDefault()
    const res = login(form.email, form.password)
    if (!res.ok) return setError(res.error)
    navigate(dest, { replace: true })
  }

  return (
    <Shell title="Welcome back" subtitle="Log in to see what your school community is sharing.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full">Log in</button>
      </form>

      <p className="mt-8 text-sm text-slate-600">
        New to Pandam Pamiye? <Link to="/register" className="font-semibold text-spruce-700 underline">Create an account</Link>
      </p>
    </Shell>
  )
}

const SIGNUP_ROLES = ['student', 'teacher', 'staff']

export function Register() {
  const { user, register } = useStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', dept: '' })
  const [error, setError] = useState('')

  if (user) return <Navigate to="/dashboard" replace />

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const submit = (e) => {
    e.preventDefault()
    const res = register(form)
    if (!res.ok) return setError(res.error)
    navigate('/dashboard', { replace: true })
  }

  return (
    <Shell title="Create your account" subtitle="Join your school's sharing community. Administrator accounts are assigned by the school.">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <fieldset>
          <legend className="label">I am a</legend>
          <div className="grid grid-cols-3 gap-2">
            {SIGNUP_ROLES.map((r) => (
              <label key={r} className={cx('cursor-pointer rounded-lg border p-3 text-center text-sm font-semibold', form.role === r ? 'border-spruce-600 bg-spruce-50 text-spruce-800' : 'border-slate-300 text-slate-600 hover:bg-slate-50')}>
                <input type="radio" name="role" value={r} checked={form.role === r} onChange={set('role')} className="sr-only" />
                {ROLES[r].label}
              </label>
            ))}
          </div>
          <p className="hint">{ROLES[form.role].blurb}</p>
        </fieldset>
        <div>
          <label htmlFor="name" className="label">Full name</label>
          <input id="name" autoComplete="name" className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label htmlFor="remail" className="label">School email</label>
          <input id="remail" type="email" autoComplete="email" className="input" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label htmlFor="dept" className="label">{form.role === 'student' ? 'Grade and section' : 'Department'}</label>
          <input id="dept" className="input" placeholder={form.role === 'student' ? 'Grade 11 - Curie' : 'Science Department'} value={form.dept} onChange={set('dept')} />
        </div>
        <div>
          <label htmlFor="rpass" className="label">Password</label>
          <input id="rpass" type="password" autoComplete="new-password" className="input" value={form.password} onChange={set('password')} required />
          <p className="hint">At least 6 characters. Demo only, so do not reuse a real password.</p>
        </div>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full">Create account</button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="font-semibold text-spruce-700 underline">Log in</Link>
      </p>
    </Shell>
  )
}
