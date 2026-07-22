import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

// TTMS Pages
import TTMSDashboardPage from '@/ttms/pages/dashboard';
import TTMSReportsPage from '@/ttms/pages/reports';
import TTMSAlarmsPage from '@/ttms/pages/alarms';
import TTMSSchedulingPage from '@/ttms/pages/scheduling';
import TTMSDocumentVerificationPage from '@/ttms/pages/document-verification';
import TTMSSparePage from '@/ttms/pages/spare';
import TTMSHistoryPage from '@/ttms/pages/history';

/**
 * TTMSRoutes component groups all TTMS routes under a single DashboardLayout wrapper.
 * This ensures the layout persists across TTMS route transitions.
 */
const TTMSRoutes = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<TTMSDashboardPage />} />
        <Route path="document-verification" element={<TTMSDocumentVerificationPage />} />
        <Route path="scheduling" element={<TTMSSchedulingPage />} />
        <Route path="reports" element={<TTMSReportsPage />} />
        <Route path="alarms" element={<TTMSAlarmsPage />} />
        <Route path="history" element={<TTMSHistoryPage />} />
        <Route path="spare" element={<TTMSSparePage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default TTMSRoutes;
