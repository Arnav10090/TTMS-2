import { X } from 'lucide-react';
import { VehicleRow, StageKey } from '@/types/vehicle';
import { useState, useEffect, useRef } from 'react';

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

// Map zone areas (BAY-3, BAY-4, BAY-5 are loading zones)
const StageToMapArea: Record<StageKey, { xRange: [number, number]; yRange: [number, number] }> = {
  gateEntry: { xRange: [40, 320], yRange: [40, 120] },      // BAY-1 area
  tareWeighing: { xRange: [400, 600], yRange: [530, 580] },  // Weighing Rooms
  loading: { xRange: [40, 740], yRange: [160, 520] },        // BAY-2, BAY-3, BAY-4, BAY-5
  postLoadingWeighing: { xRange: [400, 600], yRange: [530, 580] }, // Weighing Rooms again
  gateExit: { xRange: [760, 860], yRange: [610, 680] },      // Exit gate area
};

function MapViewport({ vehicleX, vehicleY, initialZoomMultiplier = 1 }: { vehicleX: number; vehicleY: number; initialZoomMultiplier?: number }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const [start, setStart] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement | null>(null);

  const CONTENT_W = 920;
  const CONTENT_H = 700;

  const fitToScreen = () => {
    const el = ref.current;
    if (!el) return;
    const cw = el.clientWidth || 0;
    const ch = el.clientHeight || 0;
    if (!cw || !ch) return;
    const s = Math.min(cw / CONTENT_W, ch / CONTENT_H) * initialZoomMultiplier;
    const tx = (cw - CONTENT_W * s) / 2;
    const ty = (ch - CONTENT_H * s) / 2;
    setScale(+Math.min(3, Math.max(0.3, s)).toFixed(3));
    setPos({ x: Math.round(tx), y: Math.round(ty) });
  };

  useEffect(() => {
    fitToScreen();
    const onResize = () => fitToScreen();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const zoomIn = () => setScale((s) => Math.min(3, +(s + 0.2).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.3, +(s - 0.2).toFixed(2)));
  const reset = () => fitToScreen();

  const onMouseDown = (e: React.MouseEvent) => {
    setPanning(true);
    setStart({ x: e.clientX - pos.x, y: e.clientY - pos.y });
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (panning) setPos({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const onMouseUp = () => setPanning(false);

  return (
    <div
      ref={ref}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      className="relative border border-slate-200 rounded-lg overflow-hidden bg-white cursor-grab active:cursor-grabbing select-none"
      style={{ height: '100%' }}
    >
      <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 shadow text-slate-700"
        >
          −
        </button>
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 shadow text-slate-700"
        >
          +
        </button>
        <button
          onClick={reset}
          aria-label="Fit to screen"
          title="Fit to screen"
          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 shadow text-slate-700"
        >
          ⟳
        </button>
      </div>
      <svg width="100%" height="100%">
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>
        <g transform={`translate(${pos.x},${pos.y}) scale(${scale})`}>
          <rect x="20" y="20" width="880" height="640" rx="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="2" />
          <rect x="40" y="40" width="280" height="80" rx="8" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
          <text x="180" y="85" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-1</text>
          <rect x="150" y="125" width="60" height="18" rx="3" fill="#3b82f6" />
          <text x="180" y="138" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff">GATE-4</text>
          <rect x="40" y="160" width="90" height="120" rx="8" fill="#d1d5db" stroke="#6b7280" strokeWidth="1" />
          <text x="85" y="225" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">BAY-2</text>
          <rect x="40" y="300" width="180" height="220" rx="12" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <text x="130" y="415" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-3</text>
          <rect x="45" y="450" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="70" y="463" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-2</text>
          <rect x="170" y="350" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="195" y="363" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-3</text>
          <rect x="300" y="160" width="180" height="360" rx="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <text x="390" y="345" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-4</text>
          <rect x="250" y="280" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="275" y="293" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-5</text>
          <rect x="480" y="380" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="505" y="393" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-6</text>
          <rect x="480" y="220" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="505" y="233" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-7</text>
          <rect x="560" y="160" width="180" height="360" rx="15" fill="#fde68a" stroke="#f59e0b" strokeWidth="2" />
          <text x="650" y="345" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#374151">BAY-5</text>
          <rect x="510" y="280" width="50" height="18" rx="3" fill="#3b82f6" />
          <text x="535" y="293" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-8</text>
          <rect x="400" y="530" width="80" height="50" rx="4" fill="#fff2cc" stroke="#d69e2e" strokeWidth="1" />
          <text x="440" y="548" textAnchor="middle" fontSize="9" fill="#374151">Weighing</text>
          <text x="440" y="560" textAnchor="middle" fontSize="9" fill="#374151">Room #1</text>
          <rect x="770" y="530" width="80" height="50" rx="4" fill="#fff2cc" stroke="#d69e2e" strokeWidth="1" />
          <text x="810" y="548" textAnchor="middle" fontSize="9" fill="#374151">Weighing</text>
          <text x="810" y="560" textAnchor="middle" fontSize="9" fill="#374151">Room #2</text>
          <g>
            <rect x="40" y="540" width="180" height="60" rx="6" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
            <text x="130" y="575" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">PARKING AREA</text>
            <g fill="#065f46" opacity="0.4">
              <rect x="50" y="545" width="30" height="12" rx="2" />
              <rect x="85" y="545" width="30" height="12" rx="2" />
              <rect x="120" y="545" width="30" height="12" rx="2" />
              <rect x="50" y="580" width="30" height="12" rx="2" />
              <rect x="85" y="580" width="30" height="12" rx="2" />
              <rect x="120" y="580" width="30" height="12" rx="2" />
            </g>

            <rect x="300" y="540" width="180" height="60" rx="6" fill="#86efac" stroke="#16a34a" strokeWidth="1" />
            <text x="390" y="575" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#065f46">PARKING AREA</text>
            <g fill="#065f46" opacity="0.4">
              <rect x="310" y="545" width="30" height="12" rx="2" />
              <rect x="345" y="545" width="30" height="12" rx="2" />
              <rect x="380" y="545" width="30" height="12" rx="2" />
              <rect x="415" y="545" width="30" height="12" rx="2" />
              <rect x="310" y="580" width="30" height="12" rx="2" />
              <rect x="345" y="580" width="30" height="12" rx="2" />
              <rect x="380" y="580" width="30" height="12" rx="2" />
              <rect x="415" y="580" width="30" height="12" rx="2" />
            </g>
          </g>
          <rect x="300" y="610" width="280" height="70" rx="6" fill="#fff" stroke="#374151" strokeWidth="1" />
          <text x="440" y="635" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">SALES AND</text>
          <text x="440" y="655" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#374151">ADMIN BLDG</text>
          <rect x="40" y="610" width="100" height="70" rx="6" fill="#3b82f6" />
          <text x="90" y="635" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">MAIN GATE</text>
          <text x="90" y="650" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">ENTRY</text>
          <rect x="150" y="660" width="60" height="15" rx="3" fill="#3b82f6" />
          <text x="180" y="671" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-1</text>
          <rect x="760" y="610" width="100" height="70" rx="6" fill="#3b82f6" />
          <text x="810" y="635" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">MAIN GATE</text>
          <text x="810" y="650" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#fff">EXIT</text>
          <rect x="690" y="660" width="60" height="15" rx="3" fill="#3b82f6" />
          <text x="720" y="671" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">GATE-9</text>
          <g stroke="#2563eb" strokeWidth="2" fill="none" markerEnd="url(#arrow)">
            <path d="M 200 100 L 240 100" />
            <path d="M 280 100 L 320 100" />
            <path d="M 200 150 L 200 140" />
            <path d="M 390 150 L 390 140" />
            <path d="M 650 150 L 650 140" />
            <path d="M 140 200 L 180 200" />
            <path d="M 320 300 L 360 300" />
            <path d="M 580 300 L 620 300" />
            <path d="M 200 400 L 240 400" />
            <path d="M 540 400 L 580 400" />
            <path d="M 90 600 L 90 590" />
            <path d="M 180 600 L 220 600" />
            <path d="M 680 600 L 720 600" />
            <path d="M 810 600 L 810 590" />
          </g>

          {/* Vehicle indicator */}
          <g>
            {/* Blinking outer circle */}
            <circle
              cx={vehicleX}
              cy={vehicleY}
              r="18"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              opacity="0.6"
              className="animate-pulse"
              style={{
                animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
            />
            {/* Vehicle box */}
            <rect
              x={vehicleX - 10}
              y={vehicleY - 10}
              width="20"
              height="20"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="2"
              rx="2"
            />
            {/* Inner indicator */}
            <circle cx={vehicleX} cy={vehicleY} r="4" fill="#d97706" />
          </g>
        </g>
      </svg>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.6;
          }
          50% {
            opacity: 0.2;
          }
        }
      `}</style>
    </div>
  );
}

export default function VehicleLocationModal({
  isOpen,
  onClose,
  vehicle,
  stage,
}: VehicleLocationModalProps) {
  const [vehiclePosition, setVehiclePosition] = useState({ x: 250, y: 250 });
  const [expandedOpen, setExpandedOpen] = useState(false);

  // Generate random position within the relevant stage area
  useEffect(() => {
    if (isOpen && vehicle && stage) {
      const area = StageToMapArea[stage];
      if (area) {
        const randomX = area.xRange[0] + Math.random() * (area.xRange[1] - area.xRange[0]);
        const randomY = area.yRange[0] + Math.random() * (area.yRange[1] - area.yRange[0]);
        setVehiclePosition({ x: randomX, y: randomY });
      }
    }
  }, [isOpen, vehicle, stage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpandedOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!isOpen || !vehicle || !stage) return null;

  const stageData = vehicle.stages[stage];
  const delayReason = getDelayReason(stage, stageData.waitTime, stageData.stdTime);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vehicle Location Map</h2>
            <p className="text-sm text-gray-600 mt-1">
              Vehicle: <span className="font-semibold">{vehicle.regNo}</span> | Stage: <span className="font-semibold capitalize">{stage.replace(/([A-Z])/g, ' $1').trim()}</span>
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
        <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">
          {/* Facility Layout Map */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Facility Layout - Vehicle Position</h3>
              <button
                onClick={() => setExpandedOpen(true)}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
              >
                Extend
              </button>
            </div>
            <div className="flex-1 min-h-[450px]">
              <MapViewport vehicleX={vehiclePosition.x} vehicleY={vehiclePosition.y} />
            </div>
            <div className="mt-3 flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-400 border-2 border-amber-600"></div>
              <span className="text-xs text-gray-600">Vehicle Location</span>
            </div>
          </div>

          {/* Delay Reason */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 mb-2">Reason for Delay</h3>
            <p className="text-sm text-amber-800">{delayReason}</p>
            <div className="mt-3 text-xs text-amber-700">
              Wait Time: <span className="font-semibold">{stageData.waitTime}m</span> / Standard: <span className="font-semibold">{stageData.stdTime}m</span>
            </div>
          </div>
        </div>

        {/* Footer - with gap */}
        <div className="border-t border-gray-200 p-6 flex justify-end">
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
