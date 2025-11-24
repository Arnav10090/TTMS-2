import { Routes, Route } from 'react-router-dom'

// Reuse existing Next.js page components as route components
import HomePage from '@/app/page'
import ReportsPage from '@/app/reports/page'
import AlarmsPage from '@/app/alarms/page'
import SchedulingPage from '@/app/scheduling/page'
import DocumentVerificationPage from '@/app/document-verification/page'
import SparePage from '@/app/spare/page'
import HistoryPage from '@/app/history/page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/document-verification" element={<DocumentVerificationPage />} />
      <Route path="/scheduling" element={<SchedulingPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/alarms" element={<AlarmsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/spare" element={<SparePage />} />
    </Routes>
  )
}
