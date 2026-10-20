// Small wrapper around fetch for talking to the EventInvito API.
// - Adds the JSON headers and the sign-in token automatically.
// - Throws an ApiError with the server's message (and field errors) when a request fails.

import { getToken } from './tokenStorage'

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  let response
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, 'Could not reach the server. Check your connection and try again.')
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok || data.success === false) {
    throw new ApiError(
      response.status,
      data.message || 'Something went wrong. Please try again.',
      data.errors || {},
    )
  }

  return data
}
