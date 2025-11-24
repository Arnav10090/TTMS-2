"use client"

import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'

export default function Header() {
  const [now, setNow] = useState<Date | null>(null)
  const [mounted, setMounted] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setMounted(true)
    setNow(new Date())
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const ptmsRoutes = ['/ptms', '/hmi-01', '/pump-operation', '/trends', '/alarms', '/reports', '/historical']
  const isPtms = ptmsRoutes.some(route => pathname.startsWith(route))
  const title = isPtms
    ? 'Pickling Tank Monitoring System (PTMS)'
    : 'Truck Turnaround Time Monitoring System (TTMS)'

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="w-full px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-slate-700 text-lg font-bold">Customer Name</span>
        </div>
        <h1 className="text-center text-lg md:text-xl font-bold text-slate-800">
          {title}
        </h1>
        <div className="flex items-center gap-3">
          <div className="text-slate-600 text-lg hidden md:block font-bold" suppressHydrationWarning>
            {mounted && now ? format(now, 'EEE, dd MMM yyyy HH:mm:ss') : ''}
          </div>
          <img src="https://cdn.builder.io/api/v1/image/assets%2F6495670efba34e5e9d1b6e43dcd63ffa%2F842f3f5e3603476ab02d10d14a61bcd2?format=webp&width=800" alt="Hitachi logo" className="w-25 h-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/Hitachi-Logo.png' }} />
        </div>
      </div>
    </header>
  )
}
