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

  // Get vehicle number for a parking spot
  const getVehicleForSpot = (spotLabel: string): string | null => {
    const normalizedLabel = spotLabel.toUpperCase()
    for (const [vehicle, assignment] of Object.entries(vehicleAssignments)) {
      const assignmentArea = assignment.area || ''
      const assignmentLabel = (assignment.label || '').toUpperCase()
      if (assignmentArea === areaKey && assignmentLabel === normalizedLabel) {
        return vehicle
      }
    }
    return null
  }

  // Persisted map: `${area}-${label}` -> color class
  const [colorMap, setColorMap] = useState<Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'>>(() => {
    try {
      const saved = localStorage.getItem('parkingColorMap')
      if (saved) return JSON.parse(saved)
    } catch {}
    return {}
  })

  // Track vehicle assignments for re-rendering
  const [vehicleAssignments, setVehicleAssignments] = useState<Record<string, { area: string; label: string }>>(() => {
    try {
      const raw = localStorage.getItem('vehicleParkingAssignments')
      return raw ? JSON.parse(raw) : {}
    } catch {}
    return {}
  })

  const statusToColor = (status: 'available' | 'occupied' | 'reserved'): 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500' =>
    status === 'available' ? 'bg-green-500' : status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'

  // (Removed separate load effect; state is hydrated synchronously)

  // Ensure colors for current grid; all cells start as green
  useEffect(() => {
    const next = { ...colorMap } as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'>
    grid.forEach(row => row.forEach(cell => {
      const k = `${areaKey}-${cell.label}`
      // Initialize all cells as green, but preserve any existing allocations (yellow/red)
      if (!next[k]) {
        next[k] = 'bg-green-500'
      }
    }))
    const changed = Object.keys(next).length !== Object.keys(colorMap).length ||
      Object.keys(next).some(k => next[k] !== colorMap[k as keyof typeof colorMap])
    if (changed) {
      setColorMap(next)
      try { localStorage.setItem('parkingColorMap', JSON.stringify(next)) } catch {}
    }
  }, [grid, areaKey, colorMap])

  // UI state for confirm modal and toast
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingLabel, setPendingLabel] = useState<string | null>(null)
  const [vehicleNo, setVehicleNo] = useState<string>('')
  const vehiclePattern = /^[A-Z]{2}\d{2}-\d{4}$/
  const isVehicleValid = vehiclePattern.test(vehicleNo.trim())
  const [toast, setToast] = useState<{message: string} | null>(null)

  // Sync color map and vehicle assignments from localStorage when updated elsewhere
  useEffect(() => {
    const sync = () => {
      try {
        const saved = localStorage.getItem('parkingColorMap')
        if (saved) setColorMap(JSON.parse(saved))
      } catch {}
      try {
        const raw = localStorage.getItem('vehicleParkingAssignments')
        if (raw) setVehicleAssignments(JSON.parse(raw))
      } catch {}
      // Force a re-render to update tooltips with new vehicle assignments
      setColorMap(prev => ({ ...prev }))
    }

    window.addEventListener('storage', sync)
    window.addEventListener('parkingColorMap-updated', sync as any)
    window.addEventListener('vehicleParkingAssignments-updated', sync as any)

    // Initial sync on mount - initialize all cells as green
    const initMap: Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> = {}
    grid.forEach(row => {
      row.forEach(cell => {
        initMap[`${areaKey}-${cell.label}`] = 'bg-green-500'
      })
    })

    try {
      const saved = localStorage.getItem('parkingColorMap')
      const savedMap = saved ? JSON.parse(saved) : {}
      // Merge: start with all green, then override with any saved allocations
      setColorMap({ ...initMap, ...savedMap })
    } catch {
      setColorMap(initMap)
    }

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener('parkingColorMap-updated', sync as any)
      window.removeEventListener('vehicleParkingAssignments-updated', sync as any)
    }
  }, [areaKey, grid])

  const openConfirm = (label: string) => {
    setPendingLabel(label)
    setVehicleNo('')
    setConfirmOpen(true)
  }

  const closeConfirm = () => {
    setConfirmOpen(false)
    setPendingLabel(null)
  }

  const handleAllocate = () => {
    if (!pendingLabel) return
    const label = pendingLabel
    const entered = vehicleNo.trim()
    if (!entered || !vehiclePattern.test(entered)) return // enforce format guard
    // Call upstream allocate to synchronize across app and dashboard
    onAllocate?.(label, entered)
    // Update local color map immediately to red
    const k = `${areaKey}-${label}`
    const next = { ...colorMap, [k]: 'bg-yellow-500' as const }
    setColorMap(next)
    try { localStorage.setItem('parkingColorMap', JSON.stringify(next)) } catch {}
    // Show toast
    setToast({ message: `Parking spot ${label} allocated to ${entered || 'vehicle'}.` })
    setTimeout(() => setToast(null), 5000)
    // Close the dialog automatically after allocation
    closeConfirm()
  }

  const body = (
    <>
      {!hideTitle && title ? (<h3 className="text-slate-800 font-semibold mb-3">{title}</h3>) : null}
      <div className="grid grid-cols-5 gap-2">
        {grid.map((row, r) =>
          row.map((cell, c) => {
            const currentColor = (colorMap[`${areaKey}-${cell.label}`] ?? spotColor(cell.status))
            const statusLabel = currentColor === 'bg-green-500' ? 'available' : currentColor === 'bg-red-500' ? 'occupied' : 'allocated'
            const vehicleNo = getVehicleForSpot(cell.label)
            const tooltipText = vehicleNo ? `${cell.label} - ${statusLabel} (${vehicleNo})` : `${cell.label} - ${statusLabel}`
            return (
              <div key={`${r}-${c}`} className="relative group">
                <button
                  onClick={(e) => { e.preventDefault() }}
                  disabled
                  aria-disabled
                  className={`relative rounded-ui ${currentColor} text-white flex items-center justify-center h-10 md:h-12 transition cursor-default w-full`}
                  title={tooltipText}
                  aria-label={tooltipText}
                >
                  <span className="text-[11px] md:text-xs font-medium">{cell.label}</span>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                </button>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {tooltipText}
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

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 w-[92%] max-w-md rounded-xl bg-white shadow-2xl border border-slate-200 p-4">
            <button
              aria-label="Close"
              onClick={closeConfirm}
              className="absolute top-2 right-2 inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700"
            >
              <span className="text-xl leading-none">×</span>
            </button>
            <h4 className="text-slate-800 font-semibold mb-2 pr-8">Allocate Parking Spot</h4>
            <p className="text-sm text-slate-600 mb-3">Would you like to allocate this parking spot {pendingLabel ? `(${pendingLabel})` : ''} to this vehicle?</p>
            <input
              value={vehicleNo}
              onChange={(e) => setVehicleNo(e.target.value.toUpperCase())}
              placeholder="Enter vehicle number"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
            />
            {!isVehicleValid && vehicleNo && (
              <div className="text-xs text-red-600 mb-2">Format must be like MH12-1000</div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={closeConfirm} className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm">No</button>
              <button
                onClick={handleAllocate}
                disabled={!isVehicleValid}
                aria-disabled={!isVehicleValid}
                className={`px-3 py-1.5 rounded-md text-white text-sm ${
                  !isVehicleValid ? 'bg-blue-400 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Yes, Allocate
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-sm px-4 py-2 rounded-md shadow-lg">{toast.message}</div>
      )}
    </>
  )
}
