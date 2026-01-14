import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import PTMSLayout from "@/components/layout/PTMSLayout";
import NotFound from "./ptms/pages/NotFound";

// TTMS Routes
import TTMSDashboardPage from '@/ttms/pages/dashboard';
import TTMSReportsPage from '@/ttms/pages/reports';
import TTMSAlarmsPage from '@/ttms/pages/alarms';
import TTMSSchedulingPage from '@/ttms/pages/scheduling';
import TTMSDocumentVerificationPage from '@/ttms/pages/document-verification';
import TTMSSparePage from '@/ttms/pages/spare';
import TTMSHistoryPage from '@/ttms/pages/history';

// PTMS Routes
import HMI01Overview from "./ptms/pages/HMI01Overview";
import HMI01Tabs from "./ptms/pages/HMI01Tabs";
import HMI01TankSection from "./ptms/pages/HMI01TankSection";
import HMI02LegendsSection from "./ptms/pages/HMI02LegendsSection";
import HMI02Pickling from "./ptms/pages/HMI02Pickling";
import HMI02PicklingSection from "./ptms/pages/HMI02PicklingSection";
import HMI03PumpOperation from "./ptms/pages/HMI03PumpOperation";
import HMI04Trends from "./ptms/pages/HMI04Trends";
import HMI05Alarms from "./ptms/pages/HMI05Alarms";
import HMI06Reports from "./ptms/pages/HMI06Reports";
import HMI07Historical from "./ptms/pages/HMI07Historical";
import Index from "./app/ptms/Index";


const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            {/* Default redirect to TTMS Dashboard */}
            <Route path="/" element={<Navigate to="/ttms/dashboard" replace />} />

            {/* TTMS Routes */}
            <Route path="/ttms" element={<Navigate to="/ttms/dashboard" replace />} />
            <Route path="/ttms/dashboard" element={<TTMSDashboardPage />} />
            <Route path="/ttms/document-verification" element={<TTMSDocumentVerificationPage />} />
            <Route path="/ttms/scheduling" element={<TTMSSchedulingPage />} />
            <Route path="/ttms/reports" element={<TTMSReportsPage />} />
            <Route path="/ttms/alarms" element={<TTMSAlarmsPage />} />
            <Route path="/ttms/history" element={<TTMSHistoryPage />} />
            <Route path="/ttms/spare" element={<TTMSSparePage />} />

            {/* PTMS Routes */}
            <Route path="/ptms" element={<Navigate to="/ptms/hmi-01" replace />} />
            <Route path="/ptms/hmi-01" element={
              <PTMSLayout>
                <HMI01Overview />
              </PTMSLayout>
            } />
            <Route path="/ptms/hmi-01/*" element={
              <PTMSLayout>
                <HMI01Tabs />
              </PTMSLayout>
            }>
              <Route index element={<Navigate to="tank" replace />} />
              <Route path="tank" element={<HMI01TankSection />} />
              <Route path="pickling" element={<HMI02PicklingSection />} />
              <Route path="legends" element={<HMI02LegendsSection />} />
            </Route>
            <Route path="/ptms/pump-operation" element={
              <PTMSLayout>
                <HMI03PumpOperation />
              </PTMSLayout>
            } />
            <Route path="/ptms/trends" element={
              <PTMSLayout>
                <HMI04Trends />
              </PTMSLayout>
            } />
            <Route path="/ptms/alarms" element={
              <PTMSLayout>
                <HMI05Alarms />
              </PTMSLayout>
            } />
            <Route path="/ptms/reports" element={
              <PTMSLayout>
                <HMI06Reports />
              </PTMSLayout>
            } />
            <Route path="/ptms/historical" element={
              <PTMSLayout>
                <HMI07Historical />
              </PTMSLayout>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
