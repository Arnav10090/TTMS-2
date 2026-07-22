"use client"

import { useEffect, useMemo, useState } from 'react'
import { VehicleEntry } from '@/hooks/useSchedulingState'
import { ParkingData } from '@/types/dashboard'

type Props = {
  rows: VehicleEntry[];
  onRowsChange: (rows: VehicleEntry[]) => void;
  selectedSlots: string[];
  parkingData: ParkingData;
  onExportCSV: () => void;
  onPrint: () => void;
  onAllot: (row: VehicleEntry) => void;
  onRevert: (row: VehicleEntry, target?: string) => void;
}

export default function VehicleEntryTable({ rows, onRowsChange, selectedSlots, parkingData, onExportCSV, onPrint, onAllot, onRevert }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof VehicleEntry>('sn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [colorMapUpdate, setColorMapUpdate] = useState(0) // Track colorMap updates
  const [assignmentUpdate, setAssignmentUpdate] = useState(0) // Track assignment updates

  // Listen to colorMap, assignment, and station status updates from localStorage
  const [tareWeightStatuses, setTareWeightStatuses] = useState<Record<string, string>>({})
  const [loadingGateStatuses, setLoadingGateStatuses] = useState<Record<string, string>>({})
  const [wtPostLoadingStatuses, setWtPostLoadingStatuses] = useState<Record<string, string>>({})

  // Revert Modal State
  const [revertModalOpen, setRevertModalOpen] = useState(false)
  const [revertCandidate, setRevertCandidate] = useState<VehicleEntry | null>(null)

  // Vehicle Assignment Maps (to track allocated state per vehicle)
  const [vehicleTareAssignments, setVehicleTareAssignments] = useState<Record<string, string>>({})
  const [vehicleLoadingGateAssignments, setVehicleLoadingGateAssignments] = useState<Record<string, string>>({})
  const [vehicleWtPostLoadingAssignments, setVehicleWtPostLoadingAssignments] = useState<Record<string, string>>({})
  const [vehicleGateExitAssignments, setVehicleGateExitAssignments] = useState<Record<string, string>>({})

  // Station Status Maps from LocalStorage
  const [gateExitStatuses, setGateExitStatuses] = useState<Record<string, string>>({})

  // Completed maps (persisted when lifecycle finishes)
  const [vehicleTareCompleted, setVehicleTareCompleted] = useState<Record<string, boolean>>({})
  const [vehicleLoadingCompleted, setVehicleLoadingCompleted] = useState<Record<string, boolean>>({})
  const [vehicleWtPostCompleted, setVehicleWtPostCompleted] = useState<Record<string, boolean>>({})
  const [vehicleParkingCompleted, setVehicleParkingCompleted] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const handleUpdate = () => {
      setColorMapUpdate(prev => prev + 1)
      setAssignmentUpdate(prev => prev + 1)
      syncAssignments() // Sync assignments on update
    }

    const syncAssignments = () => {
      try {
        const tr = localStorage.getItem('vehicleTareWeightAssignments')
        if (tr) setVehicleTareAssignments(JSON.parse(tr))
        else setVehicleTareAssignments({})

        const gr = localStorage.getItem('vehicleLoadingGateAssignments')
        if (gr) setVehicleLoadingGateAssignments(JSON.parse(gr))
        else setVehicleLoadingGateAssignments({})

        const wr = localStorage.getItem('vehicleWtPostLoadingAssignments')
        if (wr) setVehicleWtPostLoadingAssignments(JSON.parse(wr))
        else setVehicleWtPostLoadingAssignments({})

        const er = localStorage.getItem('vehicleGateExitAssignments')
        if (er) setVehicleGateExitAssignments(JSON.parse(er))
        else setVehicleGateExitAssignments({})

        // Load completed maps so UI can render persistent "Completed" state
        try {
          const tc = localStorage.getItem('vehicleTareWeightCompleted')
          setVehicleTareCompleted(tc ? JSON.parse(tc) : {})
        } catch { setVehicleTareCompleted({}) }
        try {
          const lc = localStorage.getItem('vehicleLoadingGateCompleted')
          setVehicleLoadingCompleted(lc ? JSON.parse(lc) : {})
        } catch { setVehicleLoadingCompleted({}) }
        try {
          const wc = localStorage.getItem('vehicleWtPostLoadingCompleted')
          setVehicleWtPostCompleted(wc ? JSON.parse(wc) : {})
        } catch { setVehicleWtPostCompleted({}) }
        try {
          const pc = localStorage.getItem('vehicleParkingCompleted')
          setVehicleParkingCompleted(pc ? JSON.parse(pc) : {})
        } catch { setVehicleParkingCompleted({}) }
      } catch { }
    }

    const syncStatuses = () => {
      try {
        const tr = localStorage.getItem('tareWeightStatuses')
        if (tr) {
          const arr = JSON.parse(tr) as { id: string; status: string }[]
          const map: Record<string, string> = {}
          arr.forEach(i => map[i.id] = i.status)
          setTareWeightStatuses(map)
        }
        const gr = localStorage.getItem('loadingGateStatuses')
        if (gr) {
          const arr = JSON.parse(gr) as { id: string; status: string }[]
          const map: Record<string, string> = {}
          arr.forEach(i => map[i.id] = i.status)
          setLoadingGateStatuses(map)
        }
        const wr = localStorage.getItem('wtPostLoadingStatuses')
        if (wr) {
          const arr = JSON.parse(wr) as { id: string; status: string }[]
          const map: Record<string, string> = {}
          arr.forEach(i => map[i.id] = i.status)
          setWtPostLoadingStatuses(map)
        }
        const er = localStorage.getItem('gateExitStatuses')
        if (er) {
          const arr = JSON.parse(er) as { id: string; status: string }[]
          const map: Record<string, string> = {}
          arr.forEach(i => map[i.id] = i.status)
          setGateExitStatuses(map)
        }
      } catch { }
    }

    syncStatuses()
    syncAssignments()

    window.addEventListener('parkingColorMap-updated', handleUpdate as any)
    window.addEventListener('vehicleParkingAssignments-updated', handleUpdate as any)
    window.addEventListener('vehicleTareWeightCompleted-updated', handleUpdate as any)
    window.addEventListener('vehicleLoadingGateCompleted-updated', handleUpdate as any)
    window.addEventListener('vehicleWtPostLoadingCompleted-updated', handleUpdate as any)
    window.addEventListener('vehicleParkingCompleted-updated', handleUpdate as any)
    window.addEventListener('tareWeightStatuses-updated', syncStatuses as any)
    window.addEventListener('loadingGateStatuses-updated', syncStatuses as any)
    window.addEventListener('wtPostLoadingStatuses-updated', syncStatuses as any)
    window.addEventListener('gateExitStatuses-updated', syncStatuses as any)
    window.addEventListener('storage', () => { handleUpdate(); syncStatuses() })
    return () => {
      window.removeEventListener('parkingColorMap-updated', handleUpdate as any)
      window.removeEventListener('vehicleParkingAssignments-updated', handleUpdate as any)
      window.removeEventListener('vehicleTareWeightCompleted-updated', handleUpdate as any)
      window.removeEventListener('vehicleLoadingGateCompleted-updated', handleUpdate as any)
      window.removeEventListener('vehicleWtPostLoadingCompleted-updated', handleUpdate as any)
      window.removeEventListener('vehicleParkingCompleted-updated', handleUpdate as any)
      window.removeEventListener('tareWeightStatuses-updated', syncStatuses as any)
      window.removeEventListener('loadingGateStatuses-updated', syncStatuses as any)
      window.removeEventListener('wtPostLoadingStatuses-updated', syncStatuses as any)
      window.removeEventListener('gateExitStatuses-updated', syncStatuses as any)
      window.removeEventListener('storage', handleUpdate) // This was slightly buggy in original, standardizing
    }
  }, [])

  const filtered = useMemo(() => rows.filter((r) => r.regNo.toLowerCase().includes(query.toLowerCase())), [rows, query])
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a, b) => {
      const av = a[sortKey] as any; const bv = b[sortKey] as any
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return arr
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  useEffect(() => { if (page > totalPages) setPage(totalPages) }, [totalPages, page])
  useEffect(() => { setPage(1) }, [query])

  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paged = useMemo(() => sorted.slice(startIndex, endIndex), [sorted, startIndex, endIndex])

  const availableByArea = useMemo(() => {
    // Respect persisted color overrides in localStorage (keys like 'AREA-1-S1')
    const colorMap: Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> = (() => {
      try {
        const raw = localStorage.getItem('parkingColorMap')
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    })()

    // Also check explicit vehicle assignments to be doubly sure
    const occupiedKeys = new Set<string>()
    try {
      const raw = localStorage.getItem('vehicleParkingAssignments')
      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
      Object.values(map).forEach(v => {
        occupiedKeys.add(`${v.area}-${v.label}`.toUpperCase())
      })
    } catch { }

    const make = (area: 'AREA-1' | 'AREA-2') => (parkingData?.[area] || [])
      .flat()
      .filter((cell) => {
        const key = `${area}-${cell.label}`
        // Default to green if not in colorMap (all cells start as available)
        const currentColor = (colorMap[key] ?? 'bg-green-500')
        // Must be green (available) AND not explicitly assigned in vehicleParkingAssignments
        const isAssigned = occupiedKeys.has(key.toUpperCase())
        return currentColor === 'bg-green-500' && !isAssigned
      })
      .map((cell) => cell.label.toUpperCase())

    return {
      'AREA-1': make('AREA-1'),
      'AREA-2': make('AREA-2'),
    }
  }, [parkingData, colorMapUpdate, assignmentUpdate])

  // Removed auto-assignment of position to prevent interference with "Select spot" option
  // Users should explicitly select a position from the dropdown

  // Memoize whether each vehicle can be reverted (checks all allocation types)
  const canRevertMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    rows.forEach((r) => {
      try {
        const pRaw = localStorage.getItem('vehicleParkingAssignments')
        const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}

        const tRaw = localStorage.getItem('vehicleTareWeightAssignments')
        const tMap = tRaw ? JSON.parse(tRaw) as Record<string, string> : {}

        const gRaw = localStorage.getItem('vehicleLoadingGateAssignments')
        const gMap = gRaw ? JSON.parse(gRaw) as Record<string, string> : {}

        const wRaw = localStorage.getItem('vehicleWtPostLoadingAssignments')
        const wMap = wRaw ? JSON.parse(wRaw) as Record<string, string> : {}

        const eRaw = localStorage.getItem('vehicleGateExitAssignments')
        const eMap = eRaw ? JSON.parse(eRaw) as Record<string, string> : {}

        map[r.regNo] = Boolean(pMap[r.regNo] || tMap[r.regNo] || gMap[r.regNo] || wMap[r.regNo] || eMap[r.regNo])
      } catch {
        map[r.regNo] = false
      }
    })
    return map
  }, [rows, assignmentUpdate])

  const toggleAll = (checked: boolean) => {
    const ids = new Set(paged.map(p => p.id))
    onRowsChange(rows.map(r => ids.has(r.id) ? { ...r, selected: checked } : r))
  }
  const allPageSelected = useMemo(() => paged.length > 0 && paged.every(r => r.selected), [paged])

  const setCell = <K extends keyof VehicleEntry>(id: string, key: K, value: VehicleEntry[K]) => {
    onRowsChange(rows.map((r) => {
      if (r.id !== id) return r
      if (key === 'area') {
        const areaValue = value as VehicleEntry['area']
        const areaKey = (areaValue || 'AREA-1') as 'AREA-1' | 'AREA-2'
        const options = availableByArea[areaKey] || []
        const normalizedCurrent = (r.position || '').toUpperCase()
        const nextPosition = options.includes(normalizedCurrent) ? normalizedCurrent : (options[0] ?? '')
        return { ...r, area: areaValue, position: nextPosition }
      }
      if (key === 'position') {
        const normalized = (value as string).toUpperCase()
        return { ...r, position: normalized }
      }
      const next = { ...r, [key]: value }

      // Persist pending selections so Dashboard can reflect "ongoing" state
      try {
        if (key === 'tareWeight') {
          const mapKey = 'vehicleTareWeightPending'
          const raw = localStorage.getItem(mapKey)
          const map = raw ? JSON.parse(raw) as Record<string, string> : {}
          const reg = r.regNo
          if (value) map[reg] = value as string
          else delete map[reg]
          localStorage.setItem(mapKey, JSON.stringify(map))
          window.dispatchEvent(new Event('vehicleTareWeightPending-updated'))
        }
        if (key === 'loadingGate') {
          const mapKey = 'vehicleLoadingGatePending'
          const raw = localStorage.getItem(mapKey)
          const map = raw ? JSON.parse(raw) as Record<string, string> : {}
          const reg = r.regNo
          if (value) map[reg] = value as string
          else delete map[reg]
          localStorage.setItem(mapKey, JSON.stringify(map))
          window.dispatchEvent(new Event('vehicleLoadingGatePending-updated'))
        }
        if (key === 'wtPostLoading') {
          const mapKey = 'vehicleWtPostLoadingPending'
          const raw = localStorage.getItem(mapKey)
          const map = raw ? JSON.parse(raw) as Record<string, string> : {}
          const reg = r.regNo
          if (value) map[reg] = value as string
          else delete map[reg]
          localStorage.setItem(mapKey, JSON.stringify(map))
          window.dispatchEvent(new Event('vehicleWtPostLoadingPending-updated'))
        }
      } catch { }

      return next
    }))
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search/Filter" className="border border-slate-300 rounded-ui px-3 py-2" />
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-ui bg-slate-100" onClick={onExportCSV}>Export CSV</button>
          <button className="px-3 py-1.5 rounded-ui bg-slate-100" onClick={onPrint}>Export PDF</button>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#e5e7eb] rounded-ui">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f4f6] text-base font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-3 w-[50px]"><input type="checkbox" checked={allPageSelected} onChange={(e) => toggleAll(e.target.checked)} /></th>
              {[
                { key: 'sn', label: 'SN', w: 'w-[60px]', align: 'text-center' },
                { key: 'reportingTime', label: 'Reporting Time', w: 'w-[130px]', align: 'text-center' },
                { key: 'regNo', label: 'Vehicle Reg No', w: 'w-[130px]' },
                { key: 'area', label: 'Parking Area', w: 'w-[140px]' },
                { key: 'position', label: 'Parking Spot', w: 'w-[160px]' },
                { key: 'tareWeight', label: 'Tare Weight', w: 'w-[140px]' },
                { key: 'loadingGate', label: 'Loading Gate', w: 'w-[140px]' },
                { key: 'wtPostLoading', label: 'Wt Post Loading', w: 'w-[140px]' },
                { key: 'actions', label: 'Actions', w: 'w-[120px]', align: 'text-center' },
              ].map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 ${c.align ?? 'text-left'} ${c.w}`}
                >
                  <div className={`flex items-center gap-1 ${c.align === 'text-center' ? 'justify-center' : ''}`}>
                    <span>{c.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r, i) => (
              <tr key={r.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f9fafb]'} border-t border-[#e5e7eb] hover:bg-blue-50`}>
                <td className="px-4 py-3 w-[50px] text-center"><input type="checkbox" checked={r.selected} onChange={(e) => setCell(r.id, 'selected', e.target.checked)} /></td>
                <td className="px-4 py-3 w-[60px] text-center">{r.sn}</td>
                <td className="px-4 py-3 w-[130px] text-center">
                  {(() => {
                    const date = new Date(r.reportingTime)
                    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                    return <span className="text-slate-700">{timeStr}</span>
                  })()}
                </td>
                <td className="px-4 py-3 w-[130px]"><input type="text" value={r.regNo} readOnly className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed" /></td>
                <td className="px-4 py-3 w-[140px]">
                  {/* Show assigned parking spot (if any) else allow area selection */}
                  {(() => {
                    // If parking for this vehicle is completed, show Completed and disable
                    if (vehicleParkingCompleted[r.regNo]) {
                      return (
                        <select value={"COMPLETED"} disabled className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed opacity-80">
                          <option value="COMPLETED">Completed</option>
                        </select>
                      )
                    }

                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      const assigned = map[r.regNo]
                      if (assigned) {
                        return <input type="text" value={assigned.area} readOnly className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50" />
                      }
                    } catch { }
                    return (
                      <select value={r.area} onChange={(e) => setCell(r.id, 'area', e.target.value as any)} className="border border-slate-300 rounded px-2 py-1 w-full">
                        <option value="">Select area</option>
                        <option value="AREA-1">AREA-1</option>
                        <option value="AREA-2">AREA-2</option>
                      </select>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 w-[160px]">
                  {(() => {
                    // If parking completed, show Completed for position too
                    if (vehicleParkingCompleted[r.regNo]) {
                      return (
                        <select value={"COMPLETED"} disabled className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed opacity-80">
                          <option value="COMPLETED">Completed</option>
                        </select>
                      )
                    }

                    // Check if this vehicle has an allocated parking spot
                    let isAllocated = false
                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      isAllocated = Boolean(map[r.regNo])
                    } catch { }

                    const areaKey = (r.area || 'AREA-1') as 'AREA-1' | 'AREA-2'
                    const options = availableByArea[areaKey] || []
                    const fallback = selectedSlots[0] ? selectedSlots[0].toUpperCase() : ''
                    const value = (r.position || fallback || '').toUpperCase()
                    const uniqueOptions = Array.from(new Set([value, ...options.filter((opt) => opt !== value && opt !== '')])).filter(Boolean)
                    return (
                      <select
                        value={value}
                        onChange={(e) => setCell(r.id, 'position', e.target.value as VehicleEntry['position'])}
                        disabled={isAllocated}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${isAllocated ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}`}
                      >
                        <option value="">Select spot</option>
                        {uniqueOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 w-[140px]">
                  {(() => {
                    // Check if this vehicle has an allocated parking spot
                    let isParkingAllocated = false
                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      isParkingAllocated = Boolean(map[r.regNo])
                    } catch { }

                    // If this vehicle's tare stage is completed, show persistent disabled Completed option
                    if (vehicleTareCompleted[r.regNo]) {
                      return (
                        <select value={"COMPLETED"} disabled className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed opacity-80">
                          <option value="COMPLETED">Completed</option>
                        </select>
                      )
                    }

                    return (
                      <select
                        value={r.tareWeight}
                        onChange={(e) => setCell(r.id, 'tareWeight', e.target.value as any)}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${vehicleTareAssignments[r.regNo] ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        disabled={!!vehicleTareAssignments[r.regNo]}
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 4 }, (_, i) => `TW-${i + 1}`).map((tw) => {
                          return <option key={tw} value={tw}>{tw}</option>
                        })}
                      </select>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 w-[140px]">
                  {(() => {
                    // Check if this vehicle has an allocated parking spot
                    let isParkingAllocated = false
                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      isParkingAllocated = Boolean(map[r.regNo])
                    } catch { }

                    // If loading gate stage completed, show persistent disabled Completed option
                    if (vehicleLoadingCompleted[r.regNo]) {
                      return (
                        <select value={"COMPLETED"} disabled className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed opacity-80">
                          <option value="COMPLETED">Completed</option>
                        </select>
                      )
                    }

                    try {
                      const raw = localStorage.getItem('vehicleLoadingGateAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                      const assigned = map[r.regNo]
                      if (assigned) {
                        // Render a disabled select for assigned loading gate to match tare-weight disabled style
                        return (
                          <select value={assigned} disabled className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-100 text-slate-500 cursor-not-allowed">
                            <option value={assigned}>{assigned}</option>
                          </select>
                        )
                      }
                    } catch { }
                    return (
                      <select
                        value={r.loadingGate}
                        onChange={(e) => setCell(r.id, 'loadingGate', e.target.value as any)}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${vehicleLoadingGateAssignments[r.regNo] ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        disabled={!!vehicleLoadingGateAssignments[r.regNo]}
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 8 }, (_, i) => `G-${i + 1}`).map((g) => {
                          return <option key={g} value={g}>{g}</option>
                        })}
                      </select>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 w-[140px]">
                  {(() => {
                    // Check if this vehicle has an allocated parking spot
                    let isParkingAllocated = false
                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      isParkingAllocated = Boolean(map[r.regNo])
                    } catch { }

                    // If wt-post-loading stage completed, show persistent disabled Completed option
                    if (vehicleWtPostCompleted[r.regNo]) {
                      return (
                        <select value={"COMPLETED"} disabled className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed opacity-80">
                          <option value="COMPLETED">Completed</option>
                        </select>
                      )
                    }

                    return (
                      <select
                        value={r.wtPostLoading}
                        onChange={(e) => setCell(r.id, 'wtPostLoading', e.target.value as any)}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${vehicleWtPostLoadingAssignments[r.regNo] ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : ''}`}
                        disabled={!!vehicleWtPostLoadingAssignments[r.regNo]}
                      >
                        <option value="">Select</option>
                        {Array.from({ length: 4 }, (_, i) => `WPL-${i + 1}`).map((wpl) => {
                          return <option key={wpl} value={wpl}>{wpl}</option>
                        })}
                      </select>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 w-[120px] text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      className="px-3 py-1.5 rounded-ui bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                      onClick={() => onAllot(r)}
                    >
                      Allot
                    </button>
                    {(() => {
                      const canRevert = canRevertMap[r.regNo] ?? false
                      return (
                        <button
                          className="px-3 py-1.5 rounded-ui bg-slate-100 text-slate-800 hover:bg-slate-200 disabled:opacity-60"
                          onClick={() => {
                            const assignments: { target: string }[] = []
                            try {
                              const pRaw = localStorage.getItem('vehicleParkingAssignments')
                              const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
                              if (pMap[r.regNo]) assignments.push({ target: 'parking' })

                              const tRaw = localStorage.getItem('vehicleTareWeightAssignments')
                              const tMap = tRaw ? JSON.parse(tRaw) as Record<string, string> : {}
                              if (tMap[r.regNo]) assignments.push({ target: 'tare' })

                              const gRaw = localStorage.getItem('vehicleLoadingGateAssignments')
                              const gMap = gRaw ? JSON.parse(gRaw) as Record<string, string> : {}
                              if (gMap[r.regNo]) assignments.push({ target: 'gate' })

                              const wRaw = localStorage.getItem('vehicleWtPostLoadingAssignments')
                              const wMap = wRaw ? JSON.parse(wRaw) as Record<string, string> : {}
                              if (wMap[r.regNo]) assignments.push({ target: 'wtpost' })

                              const eRaw = localStorage.getItem('vehicleGateExitAssignments')
                              const eMap = eRaw ? JSON.parse(eRaw) as Record<string, string> : {}
                              if (eMap[r.regNo]) assignments.push({ target: 'exit' })
                            } catch { }

                            if (assignments.length === 1) {
                              onRevert(r, assignments[0].target)
                            } else {
                              setRevertCandidate(r)
                              setRevertModalOpen(true)
                            }
                          }}
                          disabled={!canRevert}
                          title={!canRevert ? 'No allocations to revert' : undefined}
                        >
                          Revert
                        </button>
                      )
                    })()}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Rows per page</span>
            <select
              className="border border-slate-300 rounded-ui px-2 py-1"
              value={pageSize}
              onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(1) }}
            >
              {[5, 10, 20, 50].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-slate-500">{sorted.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, sorted.length)} of {sorted.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={() => { setPage(1) }}
              disabled={page === 1}
            >«</button>
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={() => { setPage(p => Math.max(1, p - 1)) }}
              disabled={page === 1}
            >Prev</button>
            <span className="px-2 text-slate-600">Page {page} / {totalPages}</span>
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)) }}
              disabled={page === totalPages}
            >Next</button>
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={() => { setPage(totalPages) }}
              disabled={page === totalPages}
            >»</button>
          </div>
        </div>
      </div>

      {/* Revert Modal */}
      {revertModalOpen && revertCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Revert Allocations</h3>
            <p className="text-sm text-slate-600 mb-4">Select the allocation you want to revert for vehicle <span className="font-semibold text-slate-900">{revertCandidate.regNo}</span>.</p>

            <div className="space-y-3">
              {(() => {
                const assignments: { label: string, target: string, value: string }[] = []
                try {
                  // Check Parking (only if parking not completed)
                  const pRaw = localStorage.getItem('vehicleParkingAssignments')
                  const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
                  const pcRaw = localStorage.getItem('vehicleParkingCompleted')
                  const pcMap = pcRaw ? JSON.parse(pcRaw) as Record<string, string> : {}
                  if (pMap[revertCandidate.regNo] && !pcMap[revertCandidate.regNo]) assignments.push({ label: 'Parking Spot', target: 'parking', value: `${pMap[revertCandidate.regNo].area} - ${pMap[revertCandidate.regNo].label}` })

                  // Check Tare (only if not completed)
                  const tRaw = localStorage.getItem('vehicleTareWeightAssignments')
                  const tMap = tRaw ? JSON.parse(tRaw) as Record<string, string> : {}
                  const tcRaw = localStorage.getItem('vehicleTareWeightCompleted')
                  const tcMap = tcRaw ? JSON.parse(tcRaw) as Record<string, string> : {}
                  if (tMap[revertCandidate.regNo] && !tcMap[revertCandidate.regNo]) assignments.push({ label: 'Tare Weight', target: 'tare', value: tMap[revertCandidate.regNo] })

                  // Check Gate (only if not completed)
                  const gRaw = localStorage.getItem('vehicleLoadingGateAssignments')
                  const gMap = gRaw ? JSON.parse(gRaw) as Record<string, string> : {}
                  const gcRaw = localStorage.getItem('vehicleLoadingGateCompleted')
                  const gcMap = gcRaw ? JSON.parse(gcRaw) as Record<string, string> : {}
                  if (gMap[revertCandidate.regNo] && !gcMap[revertCandidate.regNo]) assignments.push({ label: 'Loading Gate', target: 'gate', value: gMap[revertCandidate.regNo] })

                  // Check Wt Post (only if not completed)
                  const wRaw = localStorage.getItem('vehicleWtPostLoadingAssignments')
                  const wMap = wRaw ? JSON.parse(wRaw) as Record<string, string> : {}
                  const wcRaw = localStorage.getItem('vehicleWtPostLoadingCompleted')
                  const wcMap = wcRaw ? JSON.parse(wcRaw) as Record<string, string> : {}
                  if (wMap[revertCandidate.regNo] && !wcMap[revertCandidate.regNo]) assignments.push({ label: 'Wt Post Loading', target: 'wtpost', value: wMap[revertCandidate.regNo] })

                  // Check Exit (only if not completed)
                  const eRaw = localStorage.getItem('vehicleGateExitAssignments')
                  const eMap = eRaw ? JSON.parse(eRaw) as Record<string, string> : {}
                  const ecRaw = localStorage.getItem('vehicleGateExitCompleted')
                  const ecMap = ecRaw ? JSON.parse(ecRaw) as Record<string, string> : {}
                  if (eMap[revertCandidate.regNo] && !ecMap[revertCandidate.regNo]) assignments.push({ label: 'Gate Exit', target: 'exit', value: eMap[revertCandidate.regNo] })

                } catch { }

                if (assignments.length === 0) return <div className="text-center text-slate-500 py-4">No active allocations found.</div>

                return assignments.map(a => (
                  <div key={a.target} className="flex items-center justify-between p-3 bg-slate-50 rounded-ui border border-slate-200">
                    <div>
                      <div className="text-xs font-medium text-slate-500 uppercase">{a.label}</div>
                      <div className="font-semibold text-slate-800">{a.value}</div>
                    </div>
                    <button
                      onClick={() => { if (revertCandidate) { onRevert(revertCandidate, a.target); setRevertModalOpen(false) } }}
                      className="text-sm px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-ui font-medium"
                    >
                      Revert
                    </button>
                  </div>
                ))
              })()}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => { if (revertCandidate) { onRevert(revertCandidate); setRevertModalOpen(false) } }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-ui font-medium"
              >
                Revert All
              </button>
              <button
                onClick={() => setRevertModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-ui font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
