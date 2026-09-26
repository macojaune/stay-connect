/** Only known discovery and member pages can be resumed after authentication. */
export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000) return '/'
  const hasUnsafeCharacters = (text: string) =>
    Array.from(text).some((character) => character === '\\' || character.charCodeAt(0) <= 32)
  if (!value.startsWith('/') || value.startsWith('//') || hasUnsafeCharacters(value)) {
    return '/'
  }

  try {
    const url = new URL(value, 'https://stayconnect.invalid')
    const path = decodeURIComponent(url.pathname)
    if (
      url.origin !== 'https://stayconnect.invalid' ||
      hasUnsafeCharacters(path) ||
      !/^(?:\/|\/sorties\/[a-zA-Z0-9_-]+|\/artistes(?:\/[a-zA-Z0-9_-]+)?|\/mon-espace(?:\/propositions)?|\/mon-compte)$/.test(
        path
      )
    ) {
      return '/'
    }

    // No query parameters are required by the current discovery routes.
    return `${url.pathname}${url.hash === '#soutenir' ? '#soutenir' : ''}`
  } catch {
    return '/'
  }
}

export function authPageUrl(path: '/login' | '/register' | '/forgot-password', returnTo: string) {
  const safePath = safeReturnTo(returnTo)
  return safePath === '/' ? path : `${path}?returnTo=${encodeURIComponent(safePath)}`
}

/** Auth pages deliberately send no Referer, so redirects must use validated form data. */
export function authValidationUrl(
  path: string,
  returnTo: unknown,
  token: unknown
): string | undefined {
  const destination = safeReturnTo(returnTo)
  if (path === '/login' || path === '/register' || path === '/forgot-password') {
    return authPageUrl(path, destination)
  }
  if (path === '/reset-password') {
    const query = new URLSearchParams({ returnTo: destination })
    if (typeof token === 'string' && /^[a-zA-Z0-9_-]{43}$/.test(token)) query.set('token', token)
    return `/reset-password?${query}`
  }
  if (path === '/mon-compte' || path === '/mon-espace/propositions') return path
  if (path === '/artistes/suggestions') return '/artistes#proposer'
}
