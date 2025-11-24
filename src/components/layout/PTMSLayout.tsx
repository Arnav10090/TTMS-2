"use client"

import PTMSNavigation from './PTMSNavigation'
import AlarmsFooter from '@/components/AlarmsFooter'

export default function PTMSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PTMSNavigation />
      <main className="flex-1 pb-20">
        {children}
      </main>
      <AlarmsFooter />
    </div>
  )
}
