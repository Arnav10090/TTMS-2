"use client"

import { useEffect, useMemo, useState } from 'react'
import { Search, ChevronDown, Clock } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { useRealTimeData } from '@/hooks/useRealTimeData'

const shifts = ['Day', 'Shift-A', 'Shift-B', 'Shift-C'] as const

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
    if (showAll) return set.slice(0, 20)
    if (!query) return set.slice(0, 20)
    const q = query.toLowerCase()
    return set.filter((r) => r.toLowerCase().includes(q)).slice(0, 20)
  }, [vehicleData, query, showAll])

  useEffect(() => { setQuery(value ?? '') }, [value])


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
    </div>
  )
}
