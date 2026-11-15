type UmamiTracker = {
  track: (event: string, data: Record<string, string>) => void
}

declare global {
  interface Window {
    umami?: UmamiTracker
  }
}

function track(event: string, data: Record<string, string>) {
  if (typeof window === 'undefined') return

  try {
    window.umami?.track(event, data)
  } catch {
    // Analytics must never interrupt an inscription, a pull-up or an external link.
  }
}

export function trackNewsletterSubscribed(audience: 'listener' | 'artist') {
  track('newsletter-subscribed', { audience })
}

export function trackPullUp(action: 'added' | 'updated' | 'removed', releaseSlug: string) {
  track(`pull-up-${action}`, { release: releaseSlug })
}

export function trackPlatformOpened(platform: string, releaseSlug: string) {
  track('platform-opened', { platform, release: releaseSlug })
}
