"use client"

import { Link, useLocation } from 'react-router-dom'

const ptmsNavItems = [
  { label: 'Overview', href: '/hmi-01' },
  { label: 'Pump Operation', href: '/pump-operation' },
  { label: 'Trends/Graphs', href: '/trends' },
  { label: 'Alarms/Alerts', href: '/alarms' },
  { label: 'Reports', href: '/reports' },
  { label: 'Historical Data', href: '/historical' },
]

export default function PTMSNavigation() {
  const { pathname } = useLocation()
  
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="w-full px-6 py-2 flex flex-nowrap gap-2">
        {ptmsNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href)
          const isTtmsLink = item.label === 'TTMS'
          
          return (
            <Link
              key={`${item.href}-${item.label}`}
              to={item.href}
              className={
                'flex-1 basis-0 text-center px-3 py-1.5 rounded-full transition-colors ' +
                (isTtmsLink
                  ? 'bg-success text-white shadow hover:bg-success'
                  : isActive
                    ? 'bg-cssPrimary text-white shadow'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
