// Where the sign-in token is kept in the browser.
// "Keep me signed in" → localStorage (survives closing the browser).
// Otherwise → sessionStorage (cleared when the browser/tab session ends).

const KEY = 'eventinvito.token'

function safe(fn, fallback = null) {
  try {
    return fn()
  } catch {
    return fallback // storage can be blocked (private mode, strict settings)
  }
}

export function getToken() {
  return safe(() => localStorage.getItem(KEY) || sessionStorage.getItem(KEY))
}

export function saveToken(token, remember) {
  clearToken()
  safe(() => (remember ? localStorage : sessionStorage).setItem(KEY, token))
}

export function clearToken() {
  safe(() => localStorage.removeItem(KEY))
  safe(() => sessionStorage.removeItem(KEY))
}
