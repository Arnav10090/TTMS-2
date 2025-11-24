"use client"

import { useMemo } from 'react'

export default function AlertBanner() {
  const text = 'Scrolling Display for important alerts, messages etc.'
  // Total duration must match CSS keyframes (22s)
  const durationMs = 22000

  const style = useMemo(() => {
    try {
      const key = 'tickerStart'
      let start = Number(sessionStorage.getItem(key))
      if (!start || Number.isNaN(start)) {
        start = Date.now()
        sessionStorage.setItem(key, String(start))
      }
      const elapsed = (Date.now() - start) % durationMs
      // Use negative animationDelay so the animation appears already progressed
      return { animationDuration: `${durationMs}ms`, animationDelay: `-${elapsed}ms` }
    } catch {
      return { animationDuration: `${durationMs}ms` }
    }
  }, [])

  return (
    <div className="ticker" role="status" aria-live="polite">
      {/* Duplicate content to achieve seamless continuous scroll */}
      <div className="ticker-inner" style={style}>
        {text} &nbsp; • &nbsp; {text}
      </div>
    </div>
  )
}
