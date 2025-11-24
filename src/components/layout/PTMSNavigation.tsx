"use client"

import { Link, useLocation } from 'react-router-dom'

const ptmsTabs = [
  { label: 'Overview', href: '/ptms/overview' },
  { label: 'Pump Operation', href: '/ptms/pump-operation' },
  { label: 'Trends', href: '/ptms/trends' },
  { label: 'Alarms/Alerts', href: '/ptms/alarms' },
  { label: 'Reports', href: '/ptms/reports' },
  { label: 'Historical Data', href: '/ptms/historical-data' },
]

export default function PTMSNavigation() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="w-full px-6 py-2 flex flex-nowrap gap-2">
        {ptmsTabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href)
          return (
            <Link
              key={`${t.href}-${t.label}`}
              to={t.href}
              className={
                'flex-1 basis-0 text-center px-3 py-1.5 rounded-full transition-colors ' +
                (active ? 'bg-cssPrimary text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
