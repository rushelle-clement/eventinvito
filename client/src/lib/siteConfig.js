// What the site needs to know before anyone signs in: whether people can create their own
// accounts (closed until online payments are added) and how to contact EventInvito.
// Fetched once and shared by every page.

import { useEffect, useState } from 'react'
import { api } from './api'

const DEFAULTS = { signupOpen: true, contact: { email: '', phone: '' }, passwordReset: false, loaded: false }
let cached = null
let pending = null

function load() {
  if (cached) return Promise.resolve(cached)
  pending ??= api('/config', { auth: false })
    .then((d) => (cached = { signupOpen: Boolean(d.signupOpen), contact: d.contact || DEFAULTS.contact, passwordReset: Boolean(d.passwordReset), loaded: true }))
    .catch(() => ({ ...DEFAULTS, loaded: true }))
    .finally(() => {
      pending = null
    })
  return pending
}

export function useSiteConfig() {
  const [config, setConfig] = useState(cached || DEFAULTS)
  useEffect(() => {
    let alive = true
    load().then((c) => alive && setConfig(c))
    return () => {
      alive = false
    }
  }, [])
  return config
}
