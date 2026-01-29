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
  onRevert: (row: VehicleEntry) => void;
}

export default function VehicleEntryTable({ rows, onRowsChange, selectedSlots, parkingData, onExportCSV, onPrint, onAllot, onRevert }: Props) {
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<keyof VehicleEntry>('sn')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [colorMapUpdate, setColorMapUpdate] = useState(0) // Track colorMap updates
  const [assignmentUpdate, setAssignmentUpdate] = useState(0) // Track assignment updates

  // Listen to colorMap and assignment updates from localStorage
  useEffect(() => {
    const handleUpdate = () => {
      setColorMapUpdate(prev => prev + 1)
      setAssignmentUpdate(prev => prev + 1)
    }
    window.addEventListener('parkingColorMap-updated', handleUpdate as any)
    window.addEventListener('vehicleParkingAssignments-updated', handleUpdate as any)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('parkingColorMap-updated', handleUpdate as any)
      window.removeEventListener('vehicleParkingAssignments-updated', handleUpdate as any)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const filtered = useMemo(() => rows.filter((r) => r.regNo.toLowerCase().includes(query.toLowerCase())), [rows, query])
  const sorted = useMemo(() => {
    const arr = [...filtered]
    arr.sort((a,b) => {
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
    const colorMap: Record<string, 'bg-green-500'|'bg-red-500'|'bg-yellow-500'> = (() => {
      try {
        const raw = localStorage.getItem('parkingColorMap')
        return raw ? JSON.parse(raw) : {}
      } catch {
        return {}
      }
    })()

    const spotColor = (status: 'available'|'occupied'|'reserved') => status === 'available' ? 'bg-green-500' : status === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'

    const make = (area: 'AREA-1'|'AREA-2') => (parkingData?.[area] || [])
      .flat()
      .filter((cell) => {
        const key = `${area}-${cell.label}`
        // Default to green if not in colorMap (all cells start as available)
        const currentColor = (colorMap[key] ?? 'bg-green-500')
        return currentColor === 'bg-green-500'
      })
      .map((cell) => cell.label.toUpperCase())

    return {
      'AREA-1': make('AREA-1'),
      'AREA-2': make('AREA-2'),
    }
  }, [parkingData, colorMapUpdate])

  // Removed auto-assignment of position to prevent interference with "Select spot" option
  // Users should explicitly select a position from the dropdown

  // Memoize whether each vehicle can be reverted
  const canRevertMap = useMemo(() => {
    const map: Record<string, boolean> = {}
    rows.forEach((r) => {
      try {
        const pRaw = localStorage.getItem('vehicleParkingAssignments')
        const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
        const gRaw = localStorage.getItem('vehicleLoadingGateAssignments')
        const gMap = gRaw ? JSON.parse(gRaw) as Record<string, string> : {}
        map[r.regNo] = Boolean(pMap[r.regNo] || gMap[r.regNo])
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
        const areaKey = (areaValue || 'AREA-1') as 'AREA-1'|'AREA-2'
        const options = availableByArea[areaKey] || []
        const normalizedCurrent = (r.position || '').toUpperCase()
        const nextPosition = options.includes(normalizedCurrent) ? normalizedCurrent : (options[0] ?? '')
        return { ...r, area: areaValue, position: nextPosition }
      }
      if (key === 'position') {
        const normalized = (value as string).toUpperCase()
        return { ...r, position: normalized }
      }
      return { ...r, [key]: value }
    }))
  }

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search/Filter" className="border border-slate-300 rounded-ui px-3 py-2" />
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-ui bg-slate-100" onClick={onExportCSV}>Export CSV</button>
          <button className="px-3 py-1.5 rounded-ui bg-slate-100" onClick={onPrint}>Export PDF</button>
        </div>
      </div>

      <div className="overflow-x-auto border border-[#e5e7eb] rounded-ui">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f3f4f6] text-base font-semibold text-slate-700">
            <tr>
              <th className="px-4 py-3 w-[50px]"><input type="checkbox" checked={allPageSelected} onChange={(e)=>toggleAll(e.target.checked)} /></th>
              {[
                { key: 'sn', label: 'SN', w: 'w-[60px]' },
                { key: 'gateEntryTime', label: 'Gate Entry Time', w: 'w-[130px]' },
                { key: 'regNo', label: 'Vehicle Reg No', w: 'w-[130px]' },
                { key: 'area', label: 'Area', w: 'w-[140px]' },
                { key: 'position', label: 'Position', w: 'w-[160px]' },
                { key: 'tareWeight', label: 'Tare Weight', w: 'w-[140px]' },
                { key: 'loadingGate', label: 'Loading Gate', w: 'w-[140px]' },
                { key: 'wtPostLoading', label: 'Wt Post Loading', w: 'w-[140px]' },
                { key: 'actions', label: 'Actions', w: 'w-[120px]', align: 'text-center' },
              ].map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 ${c.align ?? 'text-left'} ${c.w} cursor-pointer`}
                  onClick={() => {
                    if (sortKey === (c.key as keyof VehicleEntry)) {
                      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
                    } else {
                      setSortKey(c.key as keyof VehicleEntry)
                      setSortDir('asc')
                    }
                    setPage(1)
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>{c.label}</span>
                    <span className="text-slate-400">{sortKey === c.key ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((r, i) => (
              <tr key={r.id} className={`${i%2===0?'bg-white':'bg-[#f9fafb]'} border-t border-[#e5e7eb] hover:bg-blue-50`}>
                <td className="px-4 py-3 w-[50px]"><input type="checkbox" checked={r.selected} onChange={(e)=>setCell(r.id,'selected',e.target.checked)} /></td>
                <td className="px-4 py-3 w-[60px]">{r.sn}</td>
                <td className="px-4 py-3 w-[130px]"><input type="datetime-local" value={r.gateEntryTime} readOnly className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50 cursor-not-allowed" /></td>
                <td className="px-4 py-3 w-[130px]"><input type="text" value={r.regNo} onChange={(e)=>setCell(r.id,'regNo',e.target.value)} pattern="[A-Z]{2}[0-9]{2}-[0-9]{4}" className="border border-slate-300 rounded px-2 py-1 w-full" /></td>
                <td className="px-4 py-3 w-[140px]">
                  {/* Show assigned parking spot (if any) else allow area selection */}
                  {(() => {
                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      const assigned = map[r.regNo]
                      if (assigned) {
                        return <input type="text" value={assigned.area} readOnly className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50" />
                      }
                    } catch {}
                    return (
                      <select value={r.area} onChange={(e)=>setCell(r.id,'area',e.target.value as any)} className="border border-slate-300 rounded px-2 py-1 w-full">
                        <option value="">Select area</option>
                        <option value="AREA-1">AREA-1</option>
                        <option value="AREA-2">AREA-2</option>
                      </select>
                    )
                  })()}
                </td>
                <td className="px-4 py-3 w-[160px]">
                  {(() => {
                    // Check if this vehicle has an allocated parking spot
                    let isAllocated = false
                    try {
                      const raw = localStorage.getItem('vehicleParkingAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
                      isAllocated = Boolean(map[r.regNo])
                    } catch {}

                    const areaKey = (r.area || 'AREA-1') as 'AREA-1'|'AREA-2'
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
                    } catch {}

                    return (
                      <select
                        value={r.tareWeight}
                        onChange={(e)=>setCell(r.id,'tareWeight',e.target.value as any)}
                        disabled={isParkingAllocated}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${isParkingAllocated ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}`}
                      >
                        <option value="">Select</option>
                        {Array.from({length:4},(_,i)=>`TW-${i+1}`).map((tw)=> <option key={tw} value={tw}>{tw}</option>)}
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
                    } catch {}

                    try {
                      const raw = localStorage.getItem('vehicleLoadingGateAssignments')
                      const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                      const assigned = map[r.regNo]
                      if (assigned) {
                        return <input type="text" value={assigned} readOnly className="border border-slate-300 rounded px-2 py-1 w-full bg-slate-50" />
                      }
                    } catch {}
                    return (
                      <select
                        value={r.loadingGate}
                        onChange={(e)=>setCell(r.id,'loadingGate',e.target.value as any)}
                        disabled={isParkingAllocated}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${isParkingAllocated ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}`}
                      >
                        <option value="">Select</option>
                        {Array.from({length:8},(_,i)=>`G-${i+1}`).map((g)=> <option key={g} value={g}>{g}</option>)}
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
                    } catch {}

                    return (
                      <select
                        value={r.wtPostLoading}
                        onChange={(e)=>setCell(r.id,'wtPostLoading',e.target.value as any)}
                        disabled={isParkingAllocated}
                        className={`border border-slate-300 rounded px-2 py-1 w-full ${isParkingAllocated ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}`}
                      >
                        <option value="">Select</option>
                        {Array.from({length:4},(_,i)=>`WPL-${i+1}`).map((wpl)=> <option key={wpl} value={wpl}>{wpl}</option>)}
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
                          onClick={() => onRevert(r)}
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
              onChange={(e)=>{ setPageSize(parseInt(e.target.value)); setPage(1) }}
            >
              {[5,10,20,50].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="text-slate-500">{sorted.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, sorted.length)} of {sorted.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={()=>{ setPage(1) }}
              disabled={page === 1}
            >«</button>
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={()=>{ setPage(p => Math.max(1, p - 1)) }}
              disabled={page === 1}
            >Prev</button>
            <span className="px-2 text-slate-600">Page {page} / {totalPages}</span>
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={()=>{ setPage(p => Math.min(totalPages, p + 1)) }}
              disabled={page === totalPages}
            >Next</button>
            <button
              className="px-2 py-1 rounded-ui border border-slate-300 disabled:opacity-40"
              onClick={()=>{ setPage(totalPages) }}
              disabled={page === totalPages}
            >»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
