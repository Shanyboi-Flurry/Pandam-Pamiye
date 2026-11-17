import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'

const Ctx = createContext(() => Promise.resolve(false))

// Modern replacement for window.confirm. Usage: const confirm = useConfirm(); if (await confirm({ title, message, confirmLabel })) ...
export const useConfirm = () => useContext(Ctx)

export function ConfirmProvider({ children }) {
  const [dlg, setDlg] = useState(null)
  const okRef = useRef(null)

  const confirm = useCallback((opts) => new Promise((resolve) => setDlg({ ...opts, resolve })), [])
  const close = (answer) => {
    dlg?.resolve(answer)
    setDlg(null)
  }

  useEffect(() => {
    if (!dlg) return
    okRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && close(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  })

  const danger = dlg?.tone !== 'neutral'
  return (
    <Ctx.Provider value={confirm}>
      {children}
      {dlg && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-labelledby="cfm-title" aria-describedby="cfm-msg">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => close(false)} aria-hidden="true" />
          <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-surface p-6 text-center shadow-2xl" style={{ animation: 'cfm-in .18s ease-out' }}>
            <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${danger ? 'bg-red-100 text-red-600' : 'bg-spruce-100 text-spruce-700'}`}>
              {danger ? <Trash2 size={26} aria-hidden="true" /> : <AlertTriangle size={26} aria-hidden="true" />}
            </span>
            <h2 id="cfm-title" className="mt-4 text-xl font-bold text-spruce-900">{dlg.title || 'Are you sure?'}</h2>
            <p id="cfm-msg" className="mt-2 text-sm text-slate-600">{dlg.message}</p>
            <div className="mt-6 flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => close(false)}>{dlg.cancelLabel || 'Cancel'}</button>
              <button
                ref={okRef}
                type="button"
                onClick={() => close(true)}
                className={danger ? 'inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600' : 'btn-primary flex-1'}
              >
                {dlg.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
          <style>{'@keyframes cfm-in{from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:none}}'}</style>
        </div>
      )}
    </Ctx.Provider>
  )
}
