"use client"

import { useEffect, useState } from 'react'

type ItemStatus = 'available' | 'occupied' | 'reserved'

type Item = { id: string; status: ItemStatus }

function statusColor(s: ItemStatus) {
  return s === 'available' ? 'bg-green-500' : s === 'occupied' ? 'bg-red-500' : 'bg-yellow-500'
}

export default function LoadingGateStatus() {
  const [tareWeights, setTareWeights] = useState<Item[]>(() => {
    try {
      const raw = localStorage.getItem('tareWeightStatuses')
      if (raw) return JSON.parse(raw) as Item[]
    } catch { }
    const init = Array.from({ length: 4 }, (_, i) => ({ id: `TW-${i + 1}`, status: 'available' as const }))
    try { localStorage.setItem('tareWeightStatuses', JSON.stringify(init)) } catch { }
    return init
  })

  const [gates, setGates] = useState<Item[]>(() => {
    try {
      const raw = localStorage.getItem('loadingGateStatuses')
      if (raw) return JSON.parse(raw) as Item[]
    } catch { }
    const init = Array.from({ length: 12 }, (_, i) => {
      const r = Math.random()
      const status: ItemStatus = r > 0.66 ? 'available' : r > 0.33 ? 'occupied' : 'reserved'
      return { id: `G-${i + 1}`, status }
    })
    try { localStorage.setItem('loadingGateStatuses', JSON.stringify(init)) } catch { }
    return init
  })

  const [wtPostLoadings, setWtPostLoadings] = useState<Item[]>(() => {
    try {
      const raw = localStorage.getItem('wtPostLoadingStatuses')
      if (raw) return JSON.parse(raw) as Item[]
    } catch { }
    const init = Array.from({ length: 4 }, (_, i) => ({ id: `WPL-${i + 1}`, status: 'available' as const }))
    try { localStorage.setItem('wtPostLoadingStatuses', JSON.stringify(init)) } catch { }
    return init
  })

  const [gateExits, setGateExits] = useState<Item[]>(() => {
    try {
      const raw = localStorage.getItem('gateExitStatuses')
      if (raw) return JSON.parse(raw) as Item[]
    } catch { }
    const init = Array.from({ length: 1 }, (_, i) => ({ id: `GE-${i + 1}`, status: 'available' as const }))
    try { localStorage.setItem('gateExitStatuses', JSON.stringify(init)) } catch { }
    return init
  })

  // Helper to get vehicle number for an allocated item
  const getVehicleForItem = (itemId: string, itemType: 'tare' | 'gate' | 'wtpost' | 'exit'): string | null => {
    try {
      const key = itemType === 'tare' ? 'vehicleTareWeightAssignments' : itemType === 'gate' ? 'vehicleLoadingGateAssignments' : itemType === 'wtpost' ? 'vehicleWtPostLoadingAssignments' : 'vehicleGateExitAssignments'
      const raw = localStorage.getItem(key)
      const map = raw ? JSON.parse(raw) as Record<string, string> : {}
      for (const [vehicle, assignedId] of Object.entries(map)) {
        if (assignedId === itemId) {
          return vehicle
        }
      }
    } catch { }
    return null
  }

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingGate, setPendingGate] = useState<Item | null>(null)
  const [vehicleNo, setVehicleNo] = useState('')
  const vehiclePattern = /^[A-Z]{2}\d{2}-\d{4}$/
  const isVehicleValid = vehiclePattern.test(vehicleNo.trim())

  const openConfirm = (gate: Item) => { setPendingGate(gate); setVehicleNo(''); setConfirmOpen(true) }
  const closeConfirm = () => { setConfirmOpen(false); setPendingGate(null) }
  const [toast, setToast] = useState<{ message: string } | null>(null)

  const handleAllocate = () => {
    if (!pendingGate || !isVehicleValid) return
    const assignedVehicle = vehicleNo.trim()
    setGates((prev) => {
      const next = prev.map(g => g.id === pendingGate?.id ? { ...g, status: 'occupied' as const } : g)
      try { localStorage.setItem('loadingGateStatuses', JSON.stringify(next)) } catch { }
      return next
    })

    // Persist vehicle -> loading gate assignment
    try {
      const key = 'vehicleLoadingGateAssignments'
      const raw = localStorage.getItem(key)
      const map = raw ? JSON.parse(raw) as Record<string, string> : {}
      map[assignedVehicle] = pendingGate.id
      localStorage.setItem(key, JSON.stringify(map))
    } catch { }

    setToast({ message: `Loading gate ${pendingGate.id} allocated to ${assignedVehicle}.` })
    setTimeout(() => setToast(null), 5000)
    closeConfirm()
  }

  useEffect(() => {
    const id = setInterval(() => {
      setGates((prev) => {
        const next = prev.map((g) => {
          if (Math.random() > 0.92) {
            const order: ItemStatus[] = ['available', 'occupied', 'reserved']
            const idx = Math.floor(Math.random() * order.length)
            return { ...g, status: order[idx] }
          }
          return g
        })
        try { localStorage.setItem('loadingGateStatuses', JSON.stringify(next)) } catch { }
        return next
      })
    }, 30000)

    const syncTareWeights = () => {
      try {
        const raw = localStorage.getItem('tareWeightStatuses')
        if (raw) setTareWeights(JSON.parse(raw) as Item[])
      } catch { }
    }

    const syncGates = () => {
      try {
        const raw = localStorage.getItem('loadingGateStatuses')
        if (raw) setGates(JSON.parse(raw) as Item[])
      } catch { }
    }

    const syncWtPostLoadings = () => {
      try {
        const raw = localStorage.getItem('wtPostLoadingStatuses')
        if (raw) setWtPostLoadings(JSON.parse(raw) as Item[])
      } catch { }
    }

    const syncGateExits = () => {
      try {
        const raw = localStorage.getItem('gateExitStatuses')
        if (raw) setGateExits(JSON.parse(raw) as Item[])
      } catch { }
    }

    window.addEventListener('storage', syncTareWeights)
    window.addEventListener('storage', syncGates)
    window.addEventListener('storage', syncWtPostLoadings)
    window.addEventListener('storage', syncGateExits)
    window.addEventListener('tareWeightStatuses-updated', syncTareWeights as any)
    window.addEventListener('loadingGateStatuses-updated', syncGates as any)
    window.addEventListener('wtPostLoadingStatuses-updated', syncWtPostLoadings as any)
    window.addEventListener('gateExitStatuses-updated', syncGateExits as any)

    return () => {
      clearInterval(id)
      window.removeEventListener('storage', syncTareWeights)
      window.removeEventListener('storage', syncGates)
      window.removeEventListener('storage', syncWtPostLoadings)
      window.removeEventListener('storage', syncGateExits)
      window.removeEventListener('tareWeightStatuses-updated', syncTareWeights as any)
      window.removeEventListener('loadingGateStatuses-updated', syncGates as any)
      window.removeEventListener('wtPostLoadingStatuses-updated', syncWtPostLoadings as any)
      window.removeEventListener('gateExitStatuses-updated', syncGateExits as any)
    }
  }, [])


  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-slate-800 font-semibold">Station Status</h3>
      </div>
      <div className="grid grid-cols-4">
        {/* Column 1: Tare Weight Section */}
        <div className="flex flex-col gap-2 border-r-2 border-slate-800 pr-3">
          <div className="bg-slate-100 rounded-ui p-2 text-center">
            <h4 className="text-xs font-semibold text-slate-700">Tare Weight</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {tareWeights.map((item) => {
              const statusLabel = item.status === 'reserved' ? 'allocated' : item.status
              const vehicleNo = getVehicleForItem(item.id, 'tare')
              const vehicleCount = countVehiclesAtStation(item.id, 'tare')
              const tooltipText = vehicleNo ? `${item.id} - ${statusLabel} (${vehicleNo})` : `${item.id} - ${statusLabel}`
              return (
                <div key={item.id} className="relative">
                  <button
                    className={`relative rounded-ui ${statusColor(item.status)} text-white h-12 flex items-center justify-center transition cursor-default w-full`}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={tooltipText}
                  >
                    <span className="text-xs font-semibold">{item.id}</span>
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                  </button>
                  {hoveredItem === item.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {tooltipText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Columns 2-3: Loading Gate Section */}
        <div className="col-span-2 flex flex-col gap-2 border-r-2 border-slate-800 px-3">
          <div className="bg-slate-100 rounded-ui p-2 text-center">
            <h4 className="text-xs font-semibold text-slate-700">Loading Gate</h4>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {gates.slice(0, 8).map((g) => {
              const statusLabel = g.status === 'reserved' ? 'allocated' : g.status
              const vehicleNo = getVehicleForItem(g.id, 'gate')
              const tooltipText = vehicleNo ? `${g.id} - ${statusLabel} (${vehicleNo})` : `${g.id} - ${statusLabel}`
              return (
                <div key={g.id} className="relative">
                  <button
                    onClick={() => { /* allocation disabled from grid */ }}
                    className={`relative rounded-ui ${statusColor(g.status)} text-white h-12 flex items-center justify-center transition cursor-default w-full`}
                    onMouseEnter={() => setHoveredItem(g.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={tooltipText}
                  >
                    <span className="text-xs font-semibold">{g.id}</span>
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                  </button>
                  {hoveredItem === g.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {tooltipText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Column 4: Wt Post Loading Section */}
        <div className="flex flex-col gap-2 pl-3">
          <div className="bg-slate-100 rounded-ui p-2 text-center">
            <h4 className="text-xs font-semibold text-slate-700">Wt Post Loading</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {wtPostLoadings.map((item) => {
              const statusLabel = item.status === 'reserved' ? 'allocated' : item.status
              const vehicleNo = getVehicleForItem(item.id, 'wtpost')
              const tooltipText = vehicleNo ? `${item.id} - ${statusLabel} (${vehicleNo})` : `${item.id} - ${statusLabel}`
              return (
                <div key={item.id} className="relative">
                  <button
                    className={`relative rounded-ui ${statusColor(item.status)} text-white h-12 flex items-center justify-center transition cursor-default w-full`}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    aria-label={tooltipText}
                  >
                    <span className="text-xs font-semibold">{item.id}</span>
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                  </button>
                  {hoveredItem === item.id && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                      {tooltipText}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Gate Exit Section - Full Width */}
      <div className="mt-4 pt-4 border-t-2 border-slate-800 flex flex-col gap-2">
        <div className="bg-slate-100 rounded-ui p-2 text-center">
          <h4 className="text-xs font-semibold text-slate-700">Gate Exit</h4>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {gateExits.map((item) => {
            const statusLabel = item.status === 'reserved' ? 'allocated' : item.status
            const vehicleNo = getVehicleForItem(item.id, 'exit')
            const tooltipText = vehicleNo ? `${item.id} - ${statusLabel} (${vehicleNo})` : `${item.id} - ${statusLabel}`
            return (
              <div key={item.id} className="relative">
                <button
                  className={`relative rounded-ui ${statusColor(item.status)} text-white h-12 flex items-center justify-center transition cursor-default w-full`}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  aria-label={tooltipText}
                >
                  <span className="text-xs font-semibold">{item.id}</span>
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white/80" />
                </button>
                {hoveredItem === item.id && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                    {tooltipText}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Available</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Occupied</div>
        <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" /> Allocated</div>
      </div>

      {false && confirmOpen && (
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
            <h4 className="text-slate-800 font-semibold mb-2 pr-8">Allocate Loading Gate</h4>
            <p className="text-sm text-slate-600 mb-3">Would you like to allocate this loading gate {pendingGate ? `(${pendingGate?.id})` : ''} to this vehicle?</p>
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
                className={`px-3 py-1.5 rounded-md text-white text-sm ${!isVehicleValid ? 'bg-blue-400 cursor-not-allowed opacity-60' : 'bg-blue-600 hover:bg-blue-700'}`}
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
    </div>
  )
}
