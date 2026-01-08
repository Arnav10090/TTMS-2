import { X } from 'lucide-react';
import { VehicleRow, StageKey } from '@/types/vehicle';
import { useState, useEffect } from 'react';

interface VehicleLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: VehicleRow | null;
  stage: StageKey | null;
}

// Delay reason messages based on stage
function getDelayReason(stage: StageKey | null, waitTime: number, stdTime: number): string {
  const ratio = stdTime ? waitTime / stdTime : 0;
  const exceedance = Math.round((ratio - 1) * 100);

  const reasons: Record<StageKey, string> = {
    gateEntry: `Vehicle is taking ${exceedance}% more time than standard at gate entry. This could be due to high traffic or document verification delays.`,
    tareWeighing: `Vehicle is delayed at tare weighing by ${exceedance}%. This may be caused by scale equipment issues or high volume of vehicles.`,
    loading: `Loading operation is delayed by ${exceedance}%. This could be due to cargo unavailability or loading dock congestion.`,
    postLoadingWeighing: `Post-loading weighing is taking ${exceedance}% longer than expected. This may indicate weight verification issues.`,
    gateExit: `Gate exit is delayed by ${exceedance}%. This could be due to documentation checks or traffic at the exit.`,
  };

  return stage ? reasons[stage] : 'Vehicle is experiencing delays.';
}

// Facility layout zones
const FacilityZones = [
  { id: 'entry', label: 'Gate Entry', x: 15, y: 20, width: 80, height: 30, color: '#3b82f6' },
  { id: 'weighing', label: 'Tare Weighing', x: 15, y: 60, width: 35, height: 25, color: '#8b5cf6' },
  { id: 'loading', label: 'Loading Zone', x: 55, y: 45, width: 35, height: 40, color: '#eab308' },
  { id: 'exit', label: 'Gate Exit', x: 15, y: 90, width: 80, height: 8, color: '#10b981' },
];

const StageToZone: Record<StageKey, string> = {
  gateEntry: 'entry',
  tareWeighing: 'weighing',
  loading: 'loading',
  postLoadingWeighing: 'loading',
  gateExit: 'exit',
};

export default function VehicleLocationModal({
  isOpen,
  onClose,
  vehicle,
  stage,
}: VehicleLocationModalProps) {
  const [vehiclePosition, setVehiclePosition] = useState({ x: 50, y: 50 });

  // Generate random position within current zone when modal opens or vehicle changes
  useEffect(() => {
    if (isOpen && vehicle && stage) {
      const zoneId = StageToZone[stage];
      const zone = FacilityZones.find(z => z.id === zoneId);
      
      if (zone) {
        // Random position within the zone with padding
        const randomX = zone.x + Math.random() * (zone.width - 10);
        const randomY = zone.y + Math.random() * (zone.height - 10);
        setVehiclePosition({ x: randomX, y: randomY });
      }
    }
  }, [isOpen, vehicle, stage]);

  if (!isOpen || !vehicle || !stage) return null;

  const stageData = vehicle.stages[stage];
  const delayReason = getDelayReason(stage, stageData.waitTime, stageData.stdTime);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vehicle Location Map</h2>
            <p className="text-sm text-gray-600 mt-1">
              Vehicle: <span className="font-semibold">{vehicle.regNo}</span> | Stage: <span className="font-semibold capitalize">{stage}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Facility Layout Map */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Facility Layout</h3>
            <svg
              viewBox="0 0 400 300"
              className="w-full border border-gray-200 rounded-lg bg-gray-50"
            >
              {/* Draw zones */}
              {FacilityZones.map(zone => (
                <g key={zone.id}>
                  <rect
                    x={zone.x * 4}
                    y={zone.y * 3}
                    width={zone.width * 4}
                    height={zone.height * 3}
                    fill={zone.color}
                    opacity="0.2"
                    stroke={zone.color}
                    strokeWidth="2"
                  />
                  <text
                    x={(zone.x + zone.width / 2) * 4}
                    y={(zone.y + zone.height / 2) * 3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-xs font-medium fill-gray-700"
                    fontSize="12"
                  >
                    {zone.label}
                  </text>
                </g>
              ))}

              {/* Draw vehicle with blinking indicator */}
              <g>
                {/* Vehicle box */}
                <rect
                  x={vehiclePosition.x * 4 - 8}
                  y={vehiclePosition.y * 3 - 8}
                  width="16"
                  height="16"
                  fill="#f59e0b"
                  stroke="#d97706"
                  strokeWidth="2"
                  rx="2"
                />
                {/* Blinking indicator circle */}
                <circle
                  cx={vehiclePosition.x * 4}
                  cy={vehiclePosition.y * 3}
                  r="10"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  opacity="0.6"
                  className="animate-pulse"
                />
              </g>

              {/* Vehicle label */}
              <text
                x={vehiclePosition.x * 4}
                y={(vehiclePosition.y - 8) * 3}
                textAnchor="middle"
                className="text-xs font-bold fill-orange-600"
                fontSize="10"
              >
                {vehicle.regNo}
              </text>
            </svg>
          </div>

          {/* Delay Reason */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Reason for Delay</h3>
            <p className="text-sm text-amber-800">{delayReason}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-amber-700">
                Wait Time: <span className="font-semibold">{stageData.waitTime}m</span> / Standard: <span className="font-semibold">{stageData.stdTime}m</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
