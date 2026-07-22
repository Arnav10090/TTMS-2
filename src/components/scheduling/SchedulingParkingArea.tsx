"use client"

import React, { useEffect, useState } from 'react'
import { ParkingGrid as ParkingGridType } from '@/types/dashboard'

function spotColor(status: 'available' | 'occupied' | 'reserved') {
  return status === 'available' ? 'bg-green-500' : status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
}

export default function SchedulingParkingArea({
  title,
  grid,
  onSelect,
  onAllocate,
  containerless,
  hideTitle,
}: {
  title: string
  grid: ParkingGridType
  onSelect: (label: string) => void
  onAllocate?: (label: string, vehicleNo: string) => void
  containerless?: boolean
  hideTitle?: boolean
}) {
  // Derive area key from the title (expects "AREA-1" or "AREA-2" to be present)
  const areaKey = (title.match(/AREA-1|AREA-2/)?.[0] as 'AREA-1' | 'AREA-2') ?? 'AREA-1'

  // Get all vehicles allocated to a parking spot
  const getVehiclesForSpot = (spotLabel: string): string[] => {
    const normalizedLabel = spotLabel.toUpperCase()
    const vehicles: string[] = []
    for (const [vehicle, assignment] of Object.entries(vehicleAssignments)) {
      const assignmentArea = assignment.area || ''
      const assignmentLabel = (assignment.label || '').toUpperCase()
      if (assignmentArea === areaKey && assignmentLabel === normalizedLabel) {
        vehicles.push(vehicle)
      }
    }
    return vehicles
  }

  // Persisted map: `${area}-${label}` -> color class
  const [colorMap, setColorMap] = useState<Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'>>(() => {
    try {
      const saved = localStorage.getItem('parkingColorMap')
      if (saved) return JSON.parse(saved)
    } catch { }
    return {}
  })

  // Track vehicle assignments for re-rendering
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, { area: string; label: string }>>(() => {
    try {
      const raw = localStorage.getItem('vehicleParkingAssignments')
      return raw ? JSON.parse(raw) : {}
    } catch { }
    return {}
  })

  const statusToColor = (status: 'available' | 'occupied' | 'reserved'): 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500' =>
    status === 'available' ? 'bg-green-500' : status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'

  // (Removed separate load effect; state is hydrated synchronously)

  // Ensure colors for current grid; all cells start as green unless already allocated
  useEffect(() => {
    const next = { ...colorMap } as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'>
    grid.forEach(row => row.forEach(cell => {
      const k = `${areaKey}-${cell.label}`
      // Only initialize if not already set (preserve allocations from localStorage)
      if (!next[k]) {
        next[k] = 'bg-green-500'
      }
    }))
    const changed = Object.keys(next).length !== Object.keys(colorMap).length ||
      Object.keys(next).some(k => next[k] !== colorMap[k as keyof typeof colorMap])
    if (changed) {
      setColorMap(next)
      try { localStorage.setItem('parkingColorMap', JSON.stringify(next)) } catch { }
    }
  }, [grid, areaKey])

  const [toast, setToast] = useState<{ message: string } | null>(null)

  // Sync color map and vehicle assignments from localStorage when updated elsewhere
  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem('parkingColorMap')
        if (saved) setColorMap(JSON.parse(saved))
      } catch { }
      try {
        const raw = localStorage.getItem('vehicleParkingAssignments')
        if (raw) setVehicleAssignments(JSON.parse(raw))
      } catch { }
    }

    window.addEventListener('storage', sync)
    window.addEventListener('parkingColorMap-updated', sync as any)
    window.addEventListener('vehicleParkingAssignments-updated', sync as any)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('parkingColorMap-updated', sync as any)
      window.removeEventListener('vehicleParkingAssignments-updated', sync as any)
    }
  }, [])

  const body = (
    <>
      {!hideTitle && title ? (<h3 className="text-slate-800 font-semibold mb-3">{title}</h3>) : null}
      <div className="grid grid-cols-5 gap-2">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const currentColor = (colorMap[`${areaKey}-${cell.label}`] ?? spotColor(cell.status))
            const statusLabel = currentColor === 'bg-green-500' ? 'available' : currentColor === 'bg-red-500' ? 'occupied' : 'allocated'
            const allocatedVehicles = getVehiclesForSpot(cell.label)
            const tooltipText = allocatedVehicles.length > 0 ? `${cell.label} - ${statusLabel}` : `${cell.label} - ${statusLabel}`
            return (
              <div key={`${r}-${c}`} className="relative group">
                <div
                  className={`relative rounded-ui ${currentColor} text-white flex items-center justify-center h-10 md:h-12 transition w-full`}
                  title={tooltipText}
                  aria-label={tooltipText}
                >
                  <span className="text-[11px] md:text-xs font-medium">{cell.label}</span>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                </div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-xs">
                  <div className="font-semibold mb-1">{cell.label} - {statusLabel}</div>
                  {allocatedVehicles.length > 0 ? (
                    <div className="space-y-1">
                      {allocatedVehicles.map((vehicle, idx) => (
                        <div key={idx} className="text-white/90">{vehicle}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/90">No vehicles allocated</div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Available</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Occupied</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> Allocated</div>
      </div>
    </>
  )

  return (
    <>
      {containerless ? (
        body
      ) : (
        <div className="card p-4">
          {body}
        </div>
      )}

      {/* Modal removed */}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-sm px-4 py-2 rounded-md shadow-lg">{toast.message}</div>
      )}
    </>
  )
}
