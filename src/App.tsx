import { Routes, Route } from 'react-router-dom'

// TTMS Routes
import TTMSDashboardPage from '@/ttms/pages/dashboard'
import TTMSReportsPage from '@/ttms/pages/reports'
import TTMSAlarmsPage from '@/ttms/pages/alarms'
import TTMSSchedulingPage from '@/ttms/pages/scheduling'
import TTMSDocumentVerificationPage from '@/ttms/pages/document-verification'
import TTMSSparePage from '@/ttms/pages/spare'
import TTMSHistoryPage from '@/ttms/pages/history'

// PTMS Routes
import PTMSDashboardPage from '@/ptms/pages/dashboard'
import PTMSOverviewPage from '@/ptms/pages/overview'
import PTMSPumpOperationPage from '@/ptms/pages/pump-operation'
import PTMSTrendsPage from '@/ptms/pages/trends'
import PTMSAlarmsPage from '@/ptms/pages/alarms'
import PTMSReportsPage from '@/ptms/pages/reports'
import PTMSHistoricalDataPage from '@/ptms/pages/historical-data'

export default function App() {
  return (
    <Routes>
      {/* TTMS Routes */}
      <Route path="/" element={<TTMSDashboardPage />} />
      <Route path="/document-verification" element={<TTMSDocumentVerificationPage />} />
      <Route path="/scheduling" element={<TTMSSchedulingPage />} />
      <Route path="/reports" element={<TTMSReportsPage />} />
      <Route path="/alarms" element={<TTMSAlarmsPage />} />
      <Route path="/history" element={<TTMSHistoryPage />} />
      <Route path="/spare" element={<TTMSSparePage />} />

      {/* PTMS Routes */}
      <Route path="/ptms" element={<PTMSDashboardPage />} />
      <Route path="/ptms/overview" element={<PTMSOverviewPage />} />
      <Route path="/ptms/pump-operation" element={<PTMSPumpOperationPage />} />
      <Route path="/ptms/trends" element={<PTMSTrendsPage />} />
      <Route path="/ptms/alarms" element={<PTMSAlarmsPage />} />
      <Route path="/ptms/reports" element={<PTMSReportsPage />} />
      <Route path="/ptms/historical-data" element={<PTMSHistoricalDataPage />} />
    </Routes>
  )
}
