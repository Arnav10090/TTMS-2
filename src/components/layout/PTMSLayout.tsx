"use client"

import Header from './Header'
import PTMSNavigation from './PTMSNavigation'
import AlertBanner from '@/components/dashboard/AlertBanner'
import AlarmsFooter from '@/components/AlarmsFooter'

export default function PTMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <AlertBanner />
      <PTMSNavigation />
      <main className="flex-1 pb-20 w-full px-6 py-6">
        {children}
      </main>
      <AlarmsFooter />
    </div>
  )
}
