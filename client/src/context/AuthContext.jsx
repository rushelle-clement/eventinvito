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
  // Why the user was signed out (account closed), shown on the Sign In page
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const onClosed = (e) => {
      setUser(null)
      setNotice(e.detail || '')
    }
    window.addEventListener('ei:account-closed', onClosed)
    return () => window.removeEventListener('ei:account-closed', onClosed)
  }, [])

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
    setNotice('')
    setUser(data.user)
    return data.user
  }, [])

  const signUp = useCallback(async ({ name, email, password, package: pkg = 'free' }) => {
    const data = await api('/auth/register', { method: 'POST', body: { name, email, password, package: pkg }, auth: false })
    saveToken(data.token, true)
    setUser(data.user)
    return data.user
  }, [])

  // After a password reset: the server signs this device in with a fresh token
  const signInWithToken = useCallback((token, nextUser) => {
    saveToken(token, true)
    setNotice('')
    setUser(nextUser)
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

  // After publishing (a credit was used) the server sends the updated account
  const updateUser = useCallback((next) => next && setUser(next), [])

  const value = useMemo(
    () => ({ user, status, notice, signIn, signUp, signInWithToken, signOut, updateUser }),
    [user, status, notice, signIn, signUp, signInWithToken, signOut, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
