"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VehicleRow, StageKey, StageState } from "@/types/vehicle";
import ProgressBar from "@/components/ui/ProgressBar";
import VehicleSearch from "@/components/filters/VehicleSearch";
import DayWiseFilter from "@/components/filters/DayWiseFilter";
import PeriodFilter from "@/components/filters/PeriodFilter";
import { Check, AlertTriangle, Siren, Truck } from "lucide-react";
import { AlertManager } from "@/utils/alerts";
import VehicleLocationModal from "@/components/dashboard/VehicleLocationModal";

function sortData(
  rows: VehicleRow[],
  key: keyof VehicleRow,
  dir: "asc" | "desc"
) {
  return [...rows].sort((a, b) => {
    let av = a[key] as any;
    let bv = b[key] as any;

    // Handle Date objects
    if (av instanceof Date) av = av.getTime();
    if (bv instanceof Date) bv = bv.getTime();

    if (av < bv) return dir === "asc" ? -1 : 1;
    if (av > bv) return dir === "asc" ? 1 : -1;
    return 0;
  });
}

// Hardcoded standard times for each stage (in minutes)
const STAGE_STANDARDS: Record<StageKey, number> = {
  gateEntry: 5,
  tareWeighing: 15,
  loading: 75, // 1 hr 15 min
  postLoadingWeighing: 25,
  gateExit: 30,
}

// Get the next stage in the workflow
function getNextStage(currentStage: StageKey): StageKey | null {
  const order: StageKey[] = [
    "gateEntry",
    "tareWeighing",
    "loading",
    "postLoadingWeighing",
    "gateExit",
  ];
  const currentIndex = order.indexOf(currentStage);
  return currentIndex < order.length - 1 ? order[currentIndex + 1] : null;
}

// Calculate truck idle time for a specific stage
// Idle time starts counting after 1.5x the standard time for that stage
function calculateStageIdleTime(row: VehicleRow, stage: StageKey): number {
  const stageState = row.stages[stage];
  const stdTime = STAGE_STANDARDS[stage];
  const threshold = stdTime * 1.5;

  if (stageState.waitTime > threshold) {
    return stageState.waitTime - threshold;
  }
  return 0;
}

// Calculate total dwell time for a vehicle (sum of idle times across all stages)
function calculateTotalDwellTime(row: VehicleRow): number {
  const order: StageKey[] = [
    "gateEntry",
    "tareWeighing",
    "loading",
    "postLoadingWeighing",
    "gateExit",
  ];

  return order.reduce((sum, stage) => {
    return sum + calculateStageIdleTime(row, stage);
  }, 0);
}

// Calculate dwell ratio: Total Dwell Time / TTR
function calculateDwellRatio(row: VehicleRow): number {
  const ttr = calculateTTR(row);
  const totalDwell = calculateTotalDwellTime(row);

  return ttr > 0 ? Number((totalDwell / ttr).toFixed(2)) : 0;
}

// Check if current stage should blink (waiting time exceeds 1.5x standard time)
function shouldStageBlink(row: VehicleRow, stage: StageKey): boolean {
  const stageState = row.stages[stage];
  if (stageState.state !== "active") return false;
  // Gate Entry should never blink
  if (stage === 'gateEntry') return false;
  const stdTime = STAGE_STANDARDS[stage];
  const threshold = stdTime * 1.5;
  return stageState.waitTime > threshold;
}

function getStageStatus(
  stageState: StageState,
  row: VehicleRow,
  stage: StageKey
) {
  const ratio = stageState.stdTime
    ? stageState.waitTime / stageState.stdTime
    : 0;

  // 1) Green Light - Stage completed
  if (stageState.state === "completed") {
    return {
      status: "completed" as const,
      className: "status-cell status-completed",
      shouldAlert: false,
      shouldBlink: false,
    };
  }

  // For active stages
  if (stageState.state === "active") {
    // Gate Entry: do not blink or raise alerts per requirement
    if (stage === 'gateEntry') {
      return {
        status: "active" as const,
        className: "status-cell status-next",
        shouldAlert: false,
        shouldBlink: false,
      };
    }

    const std = stageState.stdTime || 30;
    const r = std ? stageState.waitTime / std : 0;

    // Critical - much higher than standard (>= 2x)
    if (r >= 2.0) {
      return {
        status: "critical" as const,
        className: "status-cell status-critical",
        shouldAlert: true,
        shouldBlink: true,
      };
    }

    // Blink when exceed 1.5x standard (>45m for std=30)
    if (r > 1.5) {
      return {
        status: "active" as const,
        className: "status-cell status-next",
        shouldAlert: true,
        shouldBlink: true,
      };
    }

    // Normal ongoing stage - orange
    return {
      status: "active" as const,
      className: "status-cell status-next",
      shouldAlert: false,
      shouldBlink: false,
    };
  }

  // Default case
  return {
    status: "inactive" as const,
    className: "status-cell status-inactive",
    shouldAlert: false,
    shouldBlink: false,
  };
}

// Calculate TTR as sum of actual wait times for completed stages only
function calculateTTR(row: VehicleRow): number {
  const order: StageKey[] = [
    "gateEntry",
    "tareWeighing",
    "loading",
    "postLoadingWeighing",
    "gateExit",
  ];
  return order.reduce((total, stage) => {
    const stageState = row.stages[stage];
    // Only add wait time for completed (green) stages
    if (stageState.state === "completed") {
      return total + Math.max(0, stageState.waitTime);
    }
    return total; // Don't add anything for non-completed stages
  }, 0);
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}
function formatHHMM(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function TimeCell({
  label,
  stage,
  data,
  display,
  onAlert,
  onStageClick,
}: {
  label: string;
  stage: StageKey;
  data: VehicleRow;
  display: string;
  onAlert: (stage: StageKey) => void;
  onStageClick?: (vehicle: VehicleRow, stage: StageKey) => void;
}) {
  const st = data.stages[stage];
  const { status, className, shouldAlert, shouldBlink } = getStageStatus(
    st,
    data,
    stage
  );
  const alerted = useRef(false);

  useEffect(() => {
    if (shouldAlert && !alerted.current) {
      alerted.current = true;
      const ratio = st.stdTime ? st.waitTime / st.stdTime : 0;
      AlertManager.sendAlert({
        vehicleRegNo: data.regNo,
        stage,
        waitTime: st.waitTime,
        standardTime: st.stdTime,
        exceedanceRatio: ratio,
        alertLevel: ratio >= 1.5 ? "critical" : "warning",
        timestamp: new Date(),
        recipients: [],
      });
    }
  }, [shouldAlert, st.waitTime, st.stdTime, data.regNo, stage]);

  const blinkClass = shouldBlink ? "hard-blink" : "";

  const handleClick = () => {
    if (shouldBlink && onStageClick) {
      onStageClick(data, stage);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!shouldBlink}
      className={`${className} ${blinkClass} ${shouldBlink ? 'cursor-pointer hover:opacity-90' : ''} border-none bg-transparent p-0`}
      title={`${label} • ${st.state} (${st.waitTime}/${st.stdTime}m)`}
    >
      {status === "completed" && <Check size={14} className="text-white" />}
      {status === "critical" && <Siren size={14} className="text-white" />}
      {(status === "active" || status === "inactive") && (
        <span className="w-2 h-2 rounded-full bg-white/90" />
      )}
      <span className="ml-1 font-semibold">{display}</span>
    </button>
  );
}

export default function VehicleTable({ data }: { data: VehicleRow[] }) {
  const [sortKey, setSortKey] = useState<keyof VehicleRow>("reportingTime");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [day, setDay] = useState<Date | null>(null);
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRow | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageKey | null>(null);
  const pageSize = 7;

  // Generate random reporting times in descending order
  const dataWithTimes = useMemo(() => {
    const now = new Date();
    return data.map((row, index) => {
      if (!row.reportingTime) {
        // Generate random time within last 8 hours, with descending order for top vehicles
        const minutesAgo = Math.floor(Math.random() * 480); // 0-480 minutes (8 hours)
        const reportingTime = new Date(now.getTime() - minutesAgo * 60000);
        return { ...row, reportingTime };
      }
      return row;
    });
  }, [data]);

  const handleStageClick = (vehicle: VehicleRow, stage: StageKey) => {
    setSelectedVehicle(vehicle);
    setSelectedStage(stage);
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    return dataWithTimes.filter((row) => {
      const matchReg = row.regNo.toLowerCase().includes(query.toLowerCase());
      const ts = new Date(row.timestamp).getTime();
      const matchDay = day
        ? new Date(row.timestamp).toDateString() === day.toDateString()
        : true;
      const matchPeriod =
        (start ? ts >= start.getTime() : true) &&
        (end ? ts <= end.getTime() : true);
      return matchReg && matchDay && matchPeriod;
    });
  }, [dataWithTimes, query, day, start, end]);

  // compute max TTR across all provided data rows so we can blink the regNo with maximum TTR
  const maxTTR = useMemo(() => {
    if (!dataWithTimes || dataWithTimes.length === 0) return 0
    return dataWithTimes.reduce((m, r) => Math.max(m, calculateTTR(r)), 0)
  }, [dataWithTimes]);

  const sorted = useMemo(
    () => sortData(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir]
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageData = sorted
    .filter((row) => {
      const ttr = calculateTTR(row);
      // If vehicle exceeded 225 minutes and has completed gateExit, remove from this active summary table
      if (ttr > 225 && row.stages.gateExit.state === 'completed') return false;
      return true;
    })
    .slice((page - 1) * pageSize, page * pageSize);

  const changeSort = (key: keyof VehicleRow) => {
    if (key === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  // Compute cumulative stage completion/estimated times per row to ensure increasing times
  const computeDisplayTimes = (row: VehicleRow): Record<StageKey, string> => {
    const order: StageKey[] = [
      "gateEntry",
      "tareWeighing",
      "loading",
      "postLoadingWeighing",
      "gateExit",
    ];
    let current = new Date(row.timestamp);
    const out: Partial<Record<StageKey, string>> = {};
    for (const key of order) {
      const st = row.stages[key];
      const addMin = Math.max(
        0,
        Math.round(st.state === "completed" ? st.waitTime : st.stdTime)
      );
      current = new Date(current.getTime() + addMin * 60_000);
      out[key] = formatHHMM(current);
    }
    return out as Record<StageKey, string>;
  };

  return (
    <div>
      <h3 className="text-slate-800 font-semibold mb-3 text-lg">
        Summary of Logistics
      </h3>

      <div className="flex items-end gap-4 mb-4">
        <div className="w-[300px]">
          <label className="block text-lg font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <VehicleSearch onSearch={setQuery} />
          </div>
        </div>
        <div className="w-[200px]">
          <label className="block text-lg font-medium text-gray-700 mb-1">
            From Date & Time
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={
                start
                  ? new Date(
                      start.getTime() - start.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, -1)
                  : ""
              }
              onChange={(e) =>
                setStart(e.target.value ? new Date(e.target.value) : null)
              }
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
              placeholder="dd-mm-yyyy --:--"
            />
            {start && (
              <button
                type="button"
                onClick={() => setStart(null)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Clear from date"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="w-[200px]">
          <label className="block text-lg font-medium text-gray-700 mb-1">
            To Date & Time
          </label>
          <div className="relative">
            <input
              type="datetime-local"
              value={
                end
                  ? new Date(end.getTime() - end.getTimezoneOffset() * 60000)
                      .toISOString()
                      .slice(0, -1)
                  : ""
              }
              onChange={(e) =>
                setEnd(e.target.value ? new Date(e.target.value) : null)
              }
              className="w-full px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-8"
              placeholder="dd-mm-yyyy --:--"
            />
            {end && (
              <button
                type="button"
                onClick={() => setStart(null)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                title="Clear to date"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Legend Section */}
        <div className="ml-auto mb-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status Legend
          </label>
          <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <div className="flex items-center gap-1.5">
              <span className="legend-blink-box"></span>
              <span className="text-xs text-gray-700">Too much time</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  backgroundColor: "#f59e0b",
                }}
              ></span>
              <span className="text-xs text-gray-700">Ongoing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  backgroundColor: "#22c55e",
                }}
              ></span>
              <span className="text-xs text-gray-700">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  borderRadius: "3px",
                  backgroundColor: "#6b7280",
                }}
              ></span>
              <span className="text-xs text-gray-700">Not reached</span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr className="border-b border-slate-200">
              {[
                { key: "sn", label: "SN" },
                { key: "regNo", label: "Vehicle Reg No" },
                { key: "rfidNo", label: "RFID No." },
                { key: "reportingTime", label: "Reporting Time" },
                { key: "gateEntry", label: "Gate Entry" },
                { key: "tareWeighing", label: "Tare Weight" },
                { key: "loading", label: "Loading" },
                { key: "postLoadingWeighing", label: "Wt After Loading" },
                { key: "gateExit", label: "Gate Exit" },
                { key: "progress", label: "Progress" },
                { key: "ttr", label: "TTR" },
              ].map((col) => (
                <th
                  key={col.key}
                  className="select-none py-1 px-2 text-xs text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{col.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((row, index) => {
              const times = computeDisplayTimes(row);
              const calculatedTTR = calculateTTR(row);
              return (
                <tr
                  key={row.sn}
                  className={`${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } border-b border-slate-100 hover:bg-blue-50 transition-colors`}
                >
                  <td className="px-1 py-1 text-xs font-medium text-gray-900 whitespace-nowrap text-center">
                    {row.sn}
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-gray-400" />
                      <span className={`text-sm font-medium text-gray-900 max-w-[110px] truncate ${calculatedTTR > 225 && row.stages.gateExit.state !== 'completed' ? 'hard-blink' : ''}`}>
                        {row.regNo}
                      </span>
                    </div>
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-700">
                    {row.rfidNo ?? '-'}
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-700">
                    {row.reportingTime ? row.reportingTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-'}
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap">
                    <TimeCell
                      label="Gate Entry"
                      stage="gateEntry"
                      data={row}
                      display={times.gateEntry}
                      onAlert={() => {}}
                      onStageClick={handleStageClick}
                    />
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap">
                    <TimeCell
                      label="Tare Weighing"
                      stage="tareWeighing"
                      data={row}
                      display={times.tareWeighing}
                      onAlert={() => {}}
                      onStageClick={handleStageClick}
                    />
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap">
                    <TimeCell
                      label="Loading"
                      stage="loading"
                      data={row}
                      display={times.loading}
                      onAlert={() => {}}
                      onStageClick={handleStageClick}
                    />
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap">
                    <TimeCell
                      label="Post Load Weigh"
                      stage="postLoadingWeighing"
                      data={row}
                      display={times.postLoadingWeighing}
                      onAlert={() => {}}
                      onStageClick={handleStageClick}
                    />
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap">
                    <TimeCell
                      label="Gate Exit"
                      stage="gateExit"
                      data={row}
                      display={times.gateExit}
                      onAlert={() => {}}
                      onStageClick={handleStageClick}
                    />
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap min-w-[110px]">
                    <div className="flex items-center gap-2">
                      <div className="w-full min-w-[80px]">
                        <ProgressBar
                          value={row.progress}
                          color={
                            row.progress >= 80
                              ? "green"
                              : row.progress >= 50
                              ? "yellow"
                              : "red"
                          }
                        />
                      </div>
                      <span className="text-xs text-slate-600 tabular-nums w-[28px] text-right">
                        {Math.round(row.progress)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-1 py-1 whitespace-nowrap text-sm text-gray-900 text-center">
                    {calculatedTTR} min
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-3 text-sm">
        <button
          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous
        </button>
        <div>
          Page {page} of {totalPages}
        </div>
        <button
          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>

      <style>{`
        .status-cell {
          display: inline-flex;
          align-items: center;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .status-completed {
          background-color: #22c55e;
          color: white;
        }
        
        .status-next {
          /* Ongoing stage - orange */
          background-color: #f59e0b;
          color: white;
        }
        
        .status-critical {
          background-color: #dc2626;
          color: white;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .status-inactive {
          background-color: #6b7280;
          color: white;
        }

        @keyframes legendBlink {
   0%, 100% {
   opacity: 1;
   background-color: #f59e0b;
   }
  50% {
  opacity: 0.2;
  background-color: #fbbf24;
  }
 }

.legend-blink-box {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 3px;
  background-color: #f59e0b;
  animation: legendBlink 0.8s ease-in-out infinite;
}
        
        .hard-blink {
  animation: urgentBlink 0.8s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

@keyframes urgentBlink {
  0% {
    opacity: 1;
    background-color: #ef4444;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
  25% {
    opacity: 0.3;
    background-color: #fbbf24;
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(251, 191, 36, 0.3);
  }
  50% {
    opacity: 0.1;
    background-color: #fbbf24;
    transform: scale(1.15);
    box-shadow: 0 0 0 12px rgba(251, 191, 36, 0.1);
  }
  75% {
    opacity: 0.3;
    background-color: #ef4444;
    transform: scale(1.1);
    box-shadow: 0 0 0 8px rgba(239, 68, 68, 0.3);
  }
  100% {
    opacity: 1;
    background-color: #ef4444;
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
  }
}
      `}</style>

      <VehicleLocationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        vehicle={selectedVehicle}
        stage={selectedStage}
      />
    </div>
  );
}
