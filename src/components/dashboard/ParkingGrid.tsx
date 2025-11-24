"use client";

import { ParkingData } from "@/types/dashboard";
import { useEffect, useMemo, useState } from "react";

function Spot({
  color,
  label,
}: {
  color: "bg-green-500" | "bg-red-500" | "bg-yellow-500";
  label: string;
}) {
  return (
    <div
      className={`relative rounded-ui ${color} text-white flex items-center justify-center h-10 md:h-12`}
      title={label}
    >
      <span className="text-[11px] md:text-xs font-medium">{label}</span>
      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
    </div>
  );
}

export default function ParkingGrid({ data }: { data: ParkingData }) {
  const [active, setActive] = useState<"AREA-1" | "AREA-2">("AREA-1");
  const areas = useMemo(() => ["AREA-1", "AREA-2"] as const, []);
  const grid = data[active];

  // Map of `${area}-${label}` -> color class, persisted across refreshes
  // Initialize synchronously from localStorage to avoid initial flicker
  const [colorMap, setColorMap] = useState<
    Record<string, "bg-green-500" | "bg-red-500" | "bg-yellow-500">
  >(() => {
    try {
      const saved = localStorage.getItem("parkingColorMap");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const statusToColor = (
    status: "available" | "occupied" | "reserved"
  ): "bg-green-500" | "bg-red-500" | "bg-yellow-500" =>
    status === "available"
      ? "bg-green-500"
      : status === "occupied"
      ? "bg-red-500"
      : "bg-yellow-500";

  // (Removed separate load effect; state is hydrated synchronously)

  // Ensure every current cell has a color; for new/missing entries, initialize from current status
  useEffect(() => {
    const next: Record<
      string,
      "bg-green-500" | "bg-red-500" | "bg-yellow-500"
    > = { ...colorMap };
    const ensureForArea = (areaKey: "AREA-1" | "AREA-2") => {
      const g = data[areaKey] || [];
      g.forEach((row) =>
        row.forEach((cell) => {
          const k = `${areaKey}-${cell.label}`;
          if (!next[k]) {
            next[k] = statusToColor(cell.status);
          }
        })
      );
    };
    ensureForArea("AREA-1");
    ensureForArea("AREA-2");

    // Only update state and persist if something changed
    const changed =
      Object.keys(next).length !== Object.keys(colorMap).length ||
      Object.keys(next).some((k) => next[k] !== colorMap[k]);
    if (changed) {
      setColorMap(next);
      try {
        localStorage.setItem("parkingColorMap", JSON.stringify(next));
      } catch {}
    }
  }, [data, colorMap]);

  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem("parkingColorMap");
        if (saved) setColorMap(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("storage", sync);
    window.addEventListener("parkingColorMap-updated", sync as any);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("parkingColorMap-updated", sync as any);
    };
  }, []);

  const stats = useMemo(() => {
    const flat = (data[active] || []).flat() as {
      status: "available" | "occupied" | "reserved";
      label: string;
    }[];
    const total = flat.length;
    const available = flat.filter((c) => c.status === "available").length;
    const occupied = flat.filter((c) => c.status === "occupied").length;
    const reserved = flat.filter((c) => c.status === "reserved").length;
    return [{ area: active, total, available, occupied, reserved }];
  }, [data, active]);

  const Mini = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: "blue" | "green" | "red" | "yellow";
  }) => (
    <div className="px-0.5 py-2 rounded-ui bg-white border border-slate-200 shadow-sm text-center min-w-0 flex-1">
      <div className="text-[10px] uppercase tracking-tight text-slate-900 font-bold">
        {label}
      </div>
      <div
        className={`text-sm font-bold ${
          color === "green"
            ? "text-green-600"
            : color === "red"
            ? "text-red-600"
            : color === "yellow"
            ? "text-yellow-600"
            : "text-blue-600"
        }`}
      >
        {value}
      </div>
    </div>
  );

  return (
    <div>
      {/* KPI mini-cards per area (full-width) */}
      <div className="mb-3">
        {stats.map((s) => (
          <div
            key={s.area}
            className="flex items-center gap-0 bg-slate-50 border border-slate-200 rounded-ui p-2 w-full"
          >
            <div className="text-sm font-semibold text-slate-700 shrink-0 w-16">
              {s.area}
            </div>
            <div className="flex-1 grid grid-cols-4 gap-2">
              <Mini label="Total" value={s.total} color="blue" />
              <Mini label="Available" value={s.available} color="green" />
              <Mini label="Occupied" value={s.occupied} color="red" />
              <Mini label="Allocated" value={s.reserved} color="yellow" />
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center mb-3">
        <h3 className="text-slate-800 font-semibold mr-2">
          Real-Time Parking Occupancy
        </h3>
        <div className="flex gap-1">
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => setActive(a)}
              className={`px-3 py-1.5 min-w-[64px] flex items-center justify-center rounded-full text-sm whitespace-nowrap leading-none ${
                active === a
                  ? "bg-cssPrimary text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const k = `${active}-${cell.label}`;
            const color = colorMap[k] ?? statusToColor(cell.status);
            return <Spot key={`${r}-${c}`} color={color} label={cell.label} />;
          })
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />{" "}
          Available
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" />{" "}
          Occupied
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />{" "}
          Allocated
        </div>
      </div>
    </div>
  );
}
