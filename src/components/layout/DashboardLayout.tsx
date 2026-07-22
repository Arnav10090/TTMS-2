"use client"

import Navigation from './Navigation'
import AlertBanner from '@/components/dashboard/AlertBanner'
import FetchGuard from './FetchGuard'
import AlertModal from '@/components/ui/AlertModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <AlertBanner />
      <Navigation />
      <FetchGuard />
      <AlertModal />
      <main className="w-full px-6 py-6">{children}</main>
    </div>
  )
}
