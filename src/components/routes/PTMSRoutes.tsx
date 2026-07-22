import { Routes, Route, Navigate } from 'react-router-dom';
import PTMSLayout from '@/components/layout/PTMSLayout';

// PTMS Pages
import HMI01Overview from '@/ptms/pages/HMI01Overview';
import HMI01Tabs from '@/ptms/pages/HMI01Tabs';
import HMI01TankSection from '@/ptms/pages/HMI01TankSection';
import HMI02LegendsSection from '@/ptms/pages/HMI02LegendsSection';
import HMI02PicklingSection from '@/ptms/pages/HMI02PicklingSection';
import HMI03PumpOperation from '@/ptms/pages/HMI03PumpOperation';
import HMI04Trends from '@/ptms/pages/HMI04Trends';
import HMI05Alarms from '@/ptms/pages/HMI05Alarms';
import HMI06Reports from '@/ptms/pages/HMI06Reports';
import HMI07Historical from '@/ptms/pages/HMI07Historical';

/**
 * PTMSRoutes component groups all PTMS routes under a single PTMSLayout wrapper.
 * This ensures the layout persists across PTMS route transitions.
 */
const PTMSRoutes = () => {
  return (
    <PTMSLayout>
      <Routes>
        <Route index element={<Navigate to="hmi-01" replace />} />
        <Route path="hmi-01" element={<HMI01Overview />} />
        <Route path="hmi-01/*" element={<HMI01Tabs />}>
          <Route index element={<Navigate to="tank" replace />} />
          <Route path="tank" element={<HMI01TankSection />} />
          <Route path="pickling" element={<HMI02PicklingSection />} />
          <Route path="legends" element={<HMI02LegendsSection />} />
        </Route>
        <Route path="pump-operation" element={<HMI03PumpOperation />} />
        <Route path="trends" element={<HMI04Trends />} />
        <Route path="alarms" element={<HMI05Alarms />} />
        <Route path="reports" element={<HMI06Reports />} />
        <Route path="historical" element={<HMI07Historical />} />
      </Routes>
    </PTMSLayout>
  );
};

export default PTMSRoutes;
