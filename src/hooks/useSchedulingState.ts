"use client"

import { useCallback, useEffect, useState } from 'react'
import { getVehicleByIndex, getVehicleEntryTime } from '@/utils/vehicleData'

type CellState = 'available' | 'occupied' | 'reserved'
export type OccupancyCell = { id: string; state: CellState; newlyAvailable?: boolean; details?: string }
export type VehicleEntry = {
  id: string
  sn: number
  reportingTime: string
  regNo: string
  area: string
  position: string
  tareWeight: string
  loadingGate: string
  wtPostLoading: string
  selected: boolean
}
export type AlertItem = { id: string; level: 'critical' | 'warning' | 'info' | 'success'; message: string; ts: number }

function makeGrid(count: number, prefix: string): OccupancyCell[] {
  return Array.from({ length: count }, (_, i) => {
    return { id: `${prefix}-${i + 1}`, state: 'available', details: `Slot ${i + 1}` }
  })
}

export function useSchedulingState() {
  const [occupancyGrid, setOccupancyGrid] = useState<OccupancyCell[]>([])
  const [availableGrid, setAvailableGrid] = useState<OccupancyCell[]>([])
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [vehicleEntries, setVehicleEntries] = useState<VehicleEntry[]>([])
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  // initialize client-only randomized data on mount to avoid server/client mismatches
  useEffect(() => {
    setOccupancyGrid(makeGrid(25, 'A'))
    setAvailableGrid(makeGrid(20, 'B'))

    // Load vehicle assignments from localStorage
    const loadAssignments = () => {
      try {
        const parkingRaw = localStorage.getItem('vehicleParkingAssignments')
        const parkingMap = parkingRaw ? JSON.parse(parkingRaw) as Record<string, { area: string; label: string }> : {}

        const tareRaw = localStorage.getItem('vehicleTareWeightAssignments')
        const tareMap = tareRaw ? JSON.parse(tareRaw) as Record<string, string> : {}

        const gateRaw = localStorage.getItem('vehicleLoadingGateAssignments')
        const gateMap = gateRaw ? JSON.parse(gateRaw) as Record<string, string> : {}

        const wtPostRaw = localStorage.getItem('vehicleWtPostLoadingAssignments')
        const wtPostMap = wtPostRaw ? JSON.parse(wtPostRaw) as Record<string, string> : {}

        return { parkingMap, tareMap, gateMap, wtPostMap }
      } catch {
        return { parkingMap: {}, tareMap: {}, gateMap: {}, wtPostMap: {} }
      }
    }

    const assignments = loadAssignments()

    setVehicleEntries(Array.from({ length: 25 }, (_, i) => {
      const regNo = getVehicleByIndex(i)
      const parkingAssignment = assignments.parkingMap[regNo]

      return {
        id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `v-${i + 1}`,
        sn: i + 1,
        // Store as local datetime string to avoid UTC conversion issues
        reportingTime: (() => {
          const d = getVehicleEntryTime(i)
          const year = d.getFullYear()
          const month = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          const hours = String(d.getHours()).padStart(2, '0')
          const mins = String(d.getMinutes()).padStart(2, '0')
          return `${year}-${month}-${day}T${hours}:${mins}`
        })(),
        regNo,
        area: parkingAssignment?.area || 'AREA-1',
        position: parkingAssignment?.label || '',
        tareWeight: assignments.tareMap[regNo] || '',
        loadingGate: assignments.gateMap[regNo] || '',
        wtPostLoading: assignments.wtPostMap[regNo] || '',
        selected: false,
      }
    }))

    // Listen for assignment removal events and clear the corresponding fields
    const clearFieldOnAssignmentRemoval = (mapKey: string, field: keyof VehicleEntry) => {
      const handler = () => {
        try {
          const raw = localStorage.getItem(mapKey)
          const map = raw ? JSON.parse(raw) as Record<string, any> : {}

          setVehicleEntries((rows) => rows.map((r) => {
            // If this vehicle no longer has an assignment, clear the field
            if (!map[r.regNo] && r[field]) {
              return { ...r, [field]: '' }
            }
            return r
          }))
        } catch { }
      }
      window.addEventListener(`${mapKey}-updated`, handler as any)
      return handler
    }

    const clearParkingOnRemoval = () => {
      try {
        const raw = localStorage.getItem('vehicleParkingAssignments')
        const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}

        setVehicleEntries((rows) => rows.map((r) => {
          // If this vehicle no longer has a parking assignment, clear position
          if (!map[r.regNo] && r.position) {
            return { ...r, position: '' }
          }
          return r
        }))
      } catch { }
    }

    const tareHandler = clearFieldOnAssignmentRemoval('vehicleTareWeightAssignments', 'tareWeight')
    const gateHandler = clearFieldOnAssignmentRemoval('vehicleLoadingGateAssignments', 'loadingGate')
    const wtPostHandler = clearFieldOnAssignmentRemoval('vehicleWtPostLoadingAssignments', 'wtPostLoading')

    window.addEventListener('vehicleParkingAssignments-updated', clearParkingOnRemoval as any)

    const t = setInterval(() => {
      setOccupancyGrid((grid) => grid.map((cell) => {
        if (Math.random() > 0.96) {
          const next: CellState = cell.state === 'available' ? (Math.random() > 0.5 ? 'occupied' : 'reserved') : 'available'
          return { ...cell, state: next, newlyAvailable: next === 'available' }
        }
        return { ...cell, newlyAvailable: false }
      }))
      setAvailableGrid((grid) => grid.map((cell) => {
        if (Math.random() > 0.9) {
          const becameAvailable = Math.random() > 0.5
          return { ...cell, state: becameAvailable ? 'available' : 'occupied', newlyAvailable: becameAvailable }
        }
        return { ...cell, newlyAvailable: false }
      }))
      setAlerts((prev) => {
        const add = Math.random() > 0.7
        if (!add) return prev
        const levels: AlertItem['level'][] = ['critical', 'warning', 'info', 'success']
        const level = levels[Math.floor(Math.random() * levels.length)]
        const msg = level === 'critical' ? 'RFID read failure at Gate 3' : level === 'warning' ? 'Delay at Loading Bay 2' : level === 'info' ? 'New vehicle queued at Gate 1' : 'Document verified for MH12-1234'
        const item: AlertItem = { id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `a-${Date.now()}`, level, message: msg, ts: Date.now() }
        const next = [item, ...prev].slice(0, 30)
        return next
      })
    }, 30000)
    return () => {
      clearInterval(t)
      window.removeEventListener('vehicleTareWeightAssignments-updated', tareHandler as any)
      window.removeEventListener('vehicleLoadingGateAssignments-updated', gateHandler as any)
      window.removeEventListener('vehicleWtPostLoadingAssignments-updated', wtPostHandler as any)
      window.removeEventListener('vehicleParkingAssignments-updated', clearParkingOnRemoval as any)
    }
  }, [])

  const selectParkingSlot = useCallback((id: string) => {
    setSelectedSlots((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      setVehicleEntries((rows) => rows.map((r, idx) => idx === 0 ? { ...r, position: next.map((slot) => slot.toUpperCase()).join(',') } : r))
      return next
    })
  }, [])

  const updateGridStatus = useCallback((id: string, state: CellState) => {
    setOccupancyGrid((grid) => grid.map((c) => (c.id === id ? { ...c, state } : c)))
  }, [])

  const addVehicleEntry = useCallback((entry: Partial<VehicleEntry>) => {
    setVehicleEntries((rows) => {
      const sn = rows.length ? Math.max(...rows.map((r) => r.sn)) + 1 : 1
      const row: VehicleEntry = {
        id: crypto.randomUUID(),
        sn,
        reportingTime: new Date().toISOString().slice(0, 16),
        regNo: entry.regNo || '',
        area: entry.area || 'AREA-1',
        position: entry.position || '',
        tareWeight: entry.tareWeight || '',
        loadingGate: entry.loadingGate || '',
        wtPostLoading: entry.wtPostLoading || '',
        selected: false,
      }
      return [row, ...rows]
    })
  }, [])

  const generateReport = useCallback(() => {
    const header = ['SN', 'Reporting Time', 'Vehicle Reg No', 'Area', 'Position', 'Tare Weight', 'Loading Gate', 'Wt Post Loading']
    const csv = [header.join(',')].concat(
      vehicleEntries.map((r) => [r.sn, r.reportingTime, r.regNo, r.area, r.position, r.tareWeight, r.loadingGate, r.wtPostLoading].join(','))
    ).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vehicle-entries.csv'
    a.click()
    URL.revokeObjectURL(url)
  }, [vehicleEntries])

  const refreshAlerts = useCallback(() => {
    setAlerts((prev) => prev.slice())
  }, [])

  return {
    occupancyGrid,
    availableGrid,
    selectedSlots,
    vehicleEntries,
    alerts,
    selectParkingSlot,
    updateGridStatus,
    addVehicleEntry,
    generateReport,
    refreshAlerts,
    setVehicleEntries,
  }
}
