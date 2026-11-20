// The loader shown while a page or an invitation is on its way: an envelope that opens and
// lifts its card. `full`: fills the screen (guest pages, first load); otherwise it sits in the page.
// After a few seconds it adds a note — the server may be waking up (Render's free plan sleeps).

import { useEffect, useState } from 'react'
import './loader.css'

export default function Loader({ label = 'Loading', full = false, slowLabel = 'Still on its way — this can take a few seconds the first time.', className = '' }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 5000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`${full ? 'grid min-h-screen place-items-center bg-ivory px-6' : 'grid place-items-center py-16'} ${className}`} role="status" aria-live="polite">
      <div className="ldr-wrap">
        <div className={`ldr ${full ? '' : 'is-small'}`} aria-hidden="true">
          <div className="ldr-env">
            <div className="ldr-back" />
            <div className="ldr-card">
              <span />
              <span />
              <span />
            </div>
            <div className="ldr-front" />
            <div className="ldr-flap">
              <div className="ldr-seal" />
            </div>
          </div>
          <div className="ldr-shadow" />
        </div>
        <p className="ldr-label">
          {label}
          <span className="ldr-dots" aria-hidden="true">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </p>
        {slow && slowLabel && <p className="ldr-slow">{slowLabel}</p>}
      </div>
    </div>
  )
}
