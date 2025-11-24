"use client"

import Header from './Header'
import Navigation from './Navigation'
import AlertBanner from '@/components/dashboard/AlertBanner'
import FetchGuard from './FetchGuard'
import SystemAlertsBanner from '@/components/reports/SystemAlertsBanner'
import AlertModal from '@/components/ui/AlertModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <AlertBanner />
      <Navigation />
      <FetchGuard />
      <AlertModal />
      {/* Add bottom padding to avoid overlap with fixed bottom alerts banner */}
      <main className="w-full px-6 py-6 pb-28">{children}</main>
      {/* Global bottom alerts banner */}
      <SystemAlertsBanner />
    </div>
  )
}
