import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RootLayout } from "@/components/layout/RootLayout";
import { LayoutErrorBoundary } from "@/components/layout/LayoutErrorBoundary";
import TTMSRoutes from "@/components/routes/TTMSRoutes";
import PTMSRoutes from "@/components/routes/PTMSRoutes";
import NotFound from "./ptms/pages/NotFound";

const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LayoutErrorBoundary>
            <RootLayout>
              <Routes>
                {/* Default redirect to TTMS Dashboard */}
                <Route path="/" element={<Navigate to="/ttms/dashboard" replace />} />

                {/* TTMS Routes - Grouped under TTMSRoutes */}
                <Route path="/ttms/*" element={<TTMSRoutes />} />

                {/* PTMS Routes - Grouped under PTMSRoutes */}
                <Route path="/ptms/*" element={<PTMSRoutes />} />

                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RootLayout>
          </LayoutErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
