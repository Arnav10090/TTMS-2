import { Routes, Route } from 'react-router-dom'

// TTMS Routes
import HomePage from '@/app/page'
import ReportsPage from '@/app/reports/page'
import AlarmsPage from '@/app/alarms/page'
import SchedulingPage from '@/app/scheduling/page'
import DocumentVerificationPage from '@/app/document-verification/page'
import SparePage from '@/app/spare/page'
import HistoryPage from '@/app/history/page'

// PTMS Routes
import PTMSMainPage from '@/app/ptms/page'
import PTMSOverviewPage from '@/app/ptms/overview/page'
import PTMSPumpOperationPage from '@/app/ptms/pump-operation/page'
import PTMSTrendsPage from '@/app/ptms/trends/page'
import PTMSAlarmsPage from '@/app/ptms/alarms/page'
import PTMSReportsPage from '@/app/ptms/reports/page'
import PTMSHistoricalDataPage from '@/app/ptms/historical-data/page'

export default function App() {
  return (
    <Routes>
      {/* TTMS Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/document-verification" element={<DocumentVerificationPage />} />
      <Route path="/scheduling" element={<SchedulingPage />} />
      <Route path="/reports" element={<ReportsPage />} />
      <Route path="/alarms" element={<AlarmsPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/spare" element={<SparePage />} />

      {/* PTMS Routes */}
      <Route path="/ptms" element={<PTMSMainPage />} />
      <Route path="/ptms/overview" element={<PTMSOverviewPage />} />
      <Route path="/ptms/pump-operation" element={<PTMSPumpOperationPage />} />
      <Route path="/ptms/trends" element={<PTMSTrendsPage />} />
      <Route path="/ptms/alarms" element={<PTMSAlarmsPage />} />
      <Route path="/ptms/reports" element={<PTMSReportsPage />} />
      <Route path="/ptms/historical-data" element={<PTMSHistoricalDataPage />} />
    </Routes>
  )
}
