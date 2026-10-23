// Small wrapper around fetch for talking to the EventInvito API.
// - Adds the JSON headers and the sign-in token automatically.
// - Throws an ApiError with the server's message (and field errors) when a request fails.

import { clearToken, getToken } from './tokenStorage'

// Where the API lives. Empty = the same address as the site (local development, where Vite
// forwards /api to the Express server). On Vercel, VITE_API_URL is the Render server's address.
const API_BASE = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}, code = '', data = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
    this.code = code // the server's short reason, e.g. "ended"
    this.data = data // the whole response body
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`${API_BASE}/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  const data = await response.json().catch(() => ({}))

  // The account was turned off, or closed because its invitation has ended: sign out everywhere
  if (response.status === 403 && (data.code === 'account_ended' || data.code === 'account_disabled') && auth) {
    clearToken()
    window.dispatchEvent(new CustomEvent('ei:account-closed', { detail: data.message }))
  }

  if (!response.ok || data.success === false) {
    throw new ApiError(
      response.status,
      data.message || 'Something went wrong. Please try again.',
      data.errors || {},
      data.code || '',
      data,
    )
  }

  return data
}
