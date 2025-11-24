"use client"

import { useEffect } from 'react'

export default function FetchGuard() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    const w = window as any
    if (w.__fetchGuarded) return
    const orig = w.fetch
    w.fetch = async (...args: any[]) => {
      try {
        return await orig(...args)
      } catch (err) {
        // Prevent noisy errors from 3rd party scripts (e.g. analytics) breaking the app
        // Log and return a synthetic Response so callers expecting a Response can handle gracefully
        console.warn('FetchGuard intercepted failed fetch:', err, args)
        try {
          return new Response(null, { status: 503, statusText: 'Service Unavailable' })
        } catch (e) {
          // some environments may not allow constructing Response - just rethrow silently
          return Promise.resolve(undefined)
        }
      }
    }
    w.__fetchGuarded = true
    return () => {
      // restore original if needed
      try { w.fetch = orig } catch (e) { }
      w.__fetchGuarded = false
    }
  }, [])

  return null
}
