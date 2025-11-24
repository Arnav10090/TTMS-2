import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { HMISidebar } from "@/components/HMISidebar";
import { Navbar } from "@/components/Navbar";
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

const isPtmsRoute = (pathname: string): boolean => {
  const ptmsRoutes = ['/ptms', '/hmi-01', '/pump-operation', '/trends', '/alarms', '/reports', '/historical'];
  return ptmsRoutes.some(route => pathname.startsWith(route));
};

const App = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const showPtmsUI = isPtmsRoute(location.pathname);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="flex flex-col min-h-screen w-full bg-background">
            {showPtmsUI && <PTMSNavigation />}
            <div className="flex flex-1">
              <div className="flex-1 relative">
                <main className={showPtmsUI ? "pb-20" : ""}>
                  <Routes>
                    {/* TTMS Routes */}
                    <Route path="/" element={<TTMSDashboardPage />} />
                    <Route path="/document-verification" element={<TTMSDocumentVerificationPage />} />
                    <Route path="/scheduling" element={<TTMSSchedulingPage />} />
                    <Route path="/ttms-reports" element={<TTMSReportsPage />} />
                    <Route path="/ttms-alarms" element={<TTMSAlarmsPage />} />
                    <Route path="/history" element={<TTMSHistoryPage />} />
                    <Route path="/spare" element={<TTMSSparePage />} />

                    {/* PTMS Routes */}
                    <Route path="/ptms" element={<Navigate to="/hmi-01" replace />} />
                    <Route path="/hmi-01" element={<HMI01Overview />} />
                    <Route path="/hmi-01/*" element={<HMI01Tabs />}>
                      <Route index element={<Navigate to="tank" replace />} />
                      <Route path="tank" element={<HMI01TankSection />} />
                      <Route path="pickling" element={<HMI02PicklingSection />} />
                      <Route path="legends" element={<HMI02LegendsSection />} />
                    </Route>
                    <Route path="/pump-operation" element={<HMI03PumpOperation />} />
                    <Route path="/trends" element={<HMI04Trends />} />
                    <Route path="/alarms" element={<HMI05Alarms />} />
                    <Route path="/reports" element={<HMI06Reports />} />
                    <Route path="/historical" element={<HMI07Historical />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                {showPtmsUI && <AlarmsFooter />}
              </div>
            </div>
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
