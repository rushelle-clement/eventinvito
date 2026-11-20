// Round avatar button in the header with a small dropdown (account name + sign out).

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import PlanBadge from './PlanBadge'

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!open) return
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  async function handleSignOut() {
    await signOut()
    navigate('/signin', { replace: true })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white"
      >
        <User size={18} aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-gold/20 bg-white p-2 shadow-float"
        >
          <div className="border-b border-bone px-3 py-3">
            <p className="text-title-md text-espresso">{user?.name}</p>
            <p className="truncate text-body-sm text-on-surface-variant">{user?.email}</p>
            <div className="mt-2.5">
              <PlanBadge user={user} onClick={() => setOpen(false)} />
            </div>
          </div>
          {user?.role === 'admin' && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate('/admin')
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-body-md text-espresso hover:bg-blush-tint"
            >
              <ShieldCheck size={16} aria-hidden="true" /> Admin: accounts
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-body-md text-espresso hover:bg-blush-tint"
          >
            <LogOut size={16} aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}
