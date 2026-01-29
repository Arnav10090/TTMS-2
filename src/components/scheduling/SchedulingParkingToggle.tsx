"use client"

import { useMemo, useState } from 'react'
import SchedulingParkingArea from './SchedulingParkingArea'
import { ParkingData } from '@/types/dashboard'

export default function SchedulingParkingToggle({
  data,
  onSelect,
  onAllocate,
}: {
  data: ParkingData
  onSelect: (label: string) => void
  onAllocate?: (label: string, vehicleNo: string) => void
}) {
  const areas = useMemo(() => ['AREA-1','AREA-2'] as const, [])
  const [active, setActive] = useState<typeof areas[number]>('AREA-1')

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-800 font-semibold">Real-Time Parking Occupancy</h3>
        <div className="flex gap-2">
          {areas.map((a) => (
            <button
              key={a}
              onClick={() => setActive(a)}
              className={`px-2 py-1 rounded-full text-sm ${active===a ? 'bg-cssPrimary text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <SchedulingParkingArea
        containerless
        hideTitle
        title={`Real-Time Parking Occupancy - ${active}`}
        grid={data[active]}
        onSelect={onSelect}
      />
    </div>
  )
}
