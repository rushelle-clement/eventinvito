// Keeps track of who is signed in and shares it with every page.
// Any component can call useAuth() to get { user, signIn, signUp, signOut, status }.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { clearToken, getToken, saveToken } from '../lib/tokenStorage'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // "loading" while we check a saved token on first page load
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'ready'))

  // On first load: if a token was saved, ask the server who it belongs to.
  useEffect(() => {
    if (!getToken()) return
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => clearToken()) // expired or invalid → treat as signed out
      .finally(() => setStatus('ready'))
  }, [])

  const signIn = useCallback(async ({ email, password, remember }) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false })
    saveToken(data.token, remember)
    setUser(data.user)
    return data.user
  }, [])

  const signUp = useCallback(async ({ name, email, password }) => {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password }, auth: false })
    saveToken(data.token, true)
    setUser(data.user)
    return data.user
  }, [])

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      // Signing out locally still works even if the server can't be reached
    }
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
