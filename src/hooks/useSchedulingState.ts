"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'

type CellState = 'available' | 'occupied' | 'reserved'
export type OccupancyCell = { id: string; state: CellState; newlyAvailable?: boolean; details?: string }
export type VehicleEntry = {
  id: string
  sn: number
  gateEntryTime: string
  regNo: string
  area: string
  position: string
  tareWeight: string
  loadingGate: string
  wtPostLoading: string
  selected: boolean
}
export type AlertItem = { id: string; level: 'critical'|'warning'|'info'|'success'; message: string; ts: number }

function makeGrid(count: number, prefix: string): OccupancyCell[] {
  return Array.from({ length: count }, (_, i) => {
    const r = Math.random()
    const state: CellState = r > 0.66 ? 'available' : r > 0.33 ? 'occupied' : 'reserved'
    return { id: `${prefix}-${i+1}`, state, details: `Slot ${i+1}` }
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
    setVehicleEntries(Array.from({ length: 8 }, (_, i) => ({
      id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `v-${i + 1}`,
      sn: i + 1,
      gateEntryTime: new Date(Date.now() - i * 600000).toISOString().slice(0, 16),
      regNo: `MH12-${1000 + i}`,
      area: 'AREA-1',
      position: '',
      loadingGate: '',
      selected: false,
    })))

    const t = setInterval(() => {
      setOccupancyGrid((grid) => grid.map((cell) => {
        if (Math.random() > 0.96) {
          const next: CellState = cell.state === 'available' ? (Math.random()>0.5?'occupied':'reserved') : 'available'
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
        const levels: AlertItem['level'][] = ['critical','warning','info','success']
        const level = levels[Math.floor(Math.random()*levels.length)]
        const msg = level === 'critical' ? 'RFID read failure at Gate 3' : level === 'warning' ? 'Delay at Loading Bay 2' : level === 'info' ? 'New vehicle queued at Gate 1' : 'Document verified for MH12-1234'
        const item: AlertItem = { id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : `a-${Date.now()}`, level, message: msg, ts: Date.now() }
        const next = [item, ...prev].slice(0, 30)
        return next
      })
    }, 30000)
    return () => clearInterval(t)
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
        gateEntryTime: new Date().toISOString().slice(0,16),
        regNo: entry.regNo || '',
        area: entry.area || 'AREA-1',
        position: entry.position || '',
        loadingGate: entry.loadingGate || '',
        selected: false,
      }
      return [row, ...rows]
    })
  }, [])

  const generateReport = useCallback(() => {
    const header = ['SN','Gate Entry Time','Vehicle Reg No','Area','Position','Loading Gate']
    const csv = [header.join(',')].concat(
      vehicleEntries.map((r) => [r.sn, r.gateEntryTime, r.regNo, r.area, r.position, r.loadingGate].join(','))
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
