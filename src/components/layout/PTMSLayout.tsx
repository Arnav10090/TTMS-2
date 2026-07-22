"use client"

import PTMSNavigation from './PTMSNavigation'
import AlertBanner from '@/components/dashboard/AlertBanner'

export default function PTMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ptms-layout">
      <AlertBanner />
      <PTMSNavigation />
      <main className="flex-1 w-full px-6 py-6">
        {children}
      </main>
    </div>
  )
}
