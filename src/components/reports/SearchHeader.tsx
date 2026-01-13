"use client"

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, Clock } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useRealTimeData } from '@/hooks/useRealTimeData'

const shifts = ['Shift', 'Shift-A', 'Shift-B', 'Shift-C'] as const

type Props = {
  value?: string
  onVehicleChange?: (reg: string) => void
  shift: typeof shifts[number]
  onShiftChange: (s: typeof shifts[number]) => void
}

export default function SearchHeader({ value, onVehicleChange, shift, onShiftChange }: Props) {
  const { vehicleData } = useRealTimeData()
  const [query, setQuery] = useState(value ?? '')
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const options = useMemo(() => {
    const base = vehicleData.map((v) => v.regNo)
    const set = Array.from(new Set(base))

    // Filter vehicles based on selected shift
    let filteredByShift = set
    if (shift === 'Shift-A') {
      filteredByShift = set.slice(0, 5)
    } else if (shift === 'Shift-B') {
      filteredByShift = set.slice(5, 10)
    } else if (shift === 'Shift-C') {
      filteredByShift = set.slice(10)
    }

    // Apply search query if present
    if (showAll) return filteredByShift
    if (!query) return filteredByShift
    const q = query.toLowerCase()
    return filteredByShift.filter((r) => r.toLowerCase().includes(q))
  }, [vehicleData, query, showAll, shift])

  useEffect(() => { setQuery(value ?? '') }, [value])

  // Clear vehicle selection when shift changes
  useEffect(() => {
    if (value && options.length > 0 && !options.includes(value)) {
      onVehicleChange?.('')
      setQuery('')
    }
  }, [shift])


  const stats = useMemo(() => {
    const stageKeys: Array<'gateEntry' | 'tareWeighing' | 'loading' | 'postLoadingWeighing' | 'gateExit'> = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']

    // If a vehicle is selected, show metrics for that vehicle only
    if (value) {
      const vehicle = vehicleData.find((v) => v.regNo === value)
      if (vehicle) {
        // Calculate total dwell time from all stages
        let totalDwell = 0
        stageKeys.forEach((stage) => {
          const stageData = vehicle.stages[stage]
          if (stageData && stageData.idleTime !== undefined) {
            totalDwell += stageData.idleTime
          }
        })

        const avgDwell = totalDwell > 0 ? Math.round((totalDwell / stageKeys.length) * 10) / 10 : 0
        const dwellRatio = (vehicle.ttr && vehicle.ttr > 0 && totalDwell > 0) ? Math.round((totalDwell / vehicle.ttr) * 10000) / 100 : 0
        return { avgDwell, dwellRatio }
      }
    }

    // If no vehicle selected, show aggregate for all vehicles
    if (vehicleData.length === 0) {
      return { avgDwell: 0, dwellRatio: 0 }
    }

    let totalDwell = 0
    let totalTimeTaken = 0
    let validVehicles = 0

    vehicleData.forEach((vehicle) => {
      if (vehicle.totalDwellTime !== undefined) {
        totalDwell += vehicle.totalDwellTime
        totalTimeTaken += vehicle.ttr || 0
        validVehicles++
      }
    })

    const avgDwell = validVehicles > 0 ? Math.round((totalDwell / stageKeys.length) * 10) / 10 : 0
    const dwellRatio = (totalTimeTaken && totalTimeTaken > 0 && totalDwell > 0) ? Math.round((totalDwell / totalTimeTaken) * 10000) / 100 : 0

    return { avgDwell, dwellRatio }
  }, [vehicleData, value])

  return (
    <div className="card p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-2 flex items-center text-slate-400"><Search size={16} /></div>
          <input
            className="w-full pl-8 pr-12 py-2 border border-slate-200 rounded-ui focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Vehicle Registration No"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); setShowAll(false) }}
            onFocus={() => { setOpen(true); setShowAll(true) }}
            onClick={() => { setOpen(true); setShowAll(true) }}
            onBlur={() => setTimeout(() => { setOpen(false); setShowAll(false) }, 150)}
          />

          {query && (
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setQuery(''); setOpen(false); setShowAll(false); onVehicleChange?.('') }}
              title="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              ×
            </button>
          )}

          {open && options.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-ui shadow-card max-h-64 overflow-auto">
              {options.map((opt) => (
                <button
                  key={opt}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50"
                  onMouseDown={() => { setQuery(opt); setOpen(false); setShowAll(false); onVehicleChange?.(opt) }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          className="hidden md:block border border-slate-200 rounded-ui px-2 py-2"
          value={shift}
          onChange={(e) => onShiftChange(e.target.value as any)}
          aria-label="Select shift"
        >
          {shifts.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-6 text-lg whitespace-nowrap md:border-l md:border-slate-200 md:pl-6">
        <div>
          <span className="text-slate-600 mr-2">Avg Dwell Time:</span>
          <span className="font-bold text-slate-900">{stats.avgDwell} min</span>
        </div>
        <div>
          <span className="text-slate-600 mr-2">Dwell Ratio:</span>
          <span className="font-bold text-slate-900">{stats.dwellRatio.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  )
}
