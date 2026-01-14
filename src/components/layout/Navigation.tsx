"use client"

import { Link, useLocation } from 'react-router-dom'

const tabs = [
  { label: 'Main Dashboard', href: '/ttms/dashboard' },
  { label: 'Document Verification', href: '/ttms/document-verification' },
  { label: 'Scheduling', href: '/ttms/scheduling' },
  { label: 'Alarms', href: '/ttms/alarms' },
  { label: 'Reports', href: '/ttms/reports' },
  { label: 'Historical Data', href: '/ttms/history' },
  { label: 'Spare Tab', href: '/ttms/spare' },
]

export default function Navigation() {
  const { pathname } = useLocation()
  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="w-full px-6 py-2 flex flex-nowrap gap-2">
        {tabs.map((t) => {
          const active = pathname === t.href || pathname.startsWith(t.href)
          return (
            <Link
              key={`${t.href}-${t.label}`}
              to={t.href}
              className={
                'flex-1 basis-0 text-center px-3 py-1.5 rounded-full transition-colors ' +
                (active
                  ? 'bg-cssPrimary text-white shadow'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
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
