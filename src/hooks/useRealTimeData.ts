"use client"

import { useEffect, useMemo, useState, useRef } from 'react'
import { KPIData } from '@/types/kpi'
import { VehicleRow } from '@/types/vehicle'
import { ParkingData } from '@/types/dashboard'
import { dashboardService } from '@/services/dashboardService'
import { rfidAssignmentService } from '@/utils/rfidAssignments'
import { toast } from '@/components/ui/sonner'
import { AlertManager } from '@/utils/alerts'
import { VEHICLE_NUMBERS, getVehicleEntryTime } from '@/utils/vehicleData'

/**
 * Calculate stage completion time based on vehicle reporting time and cumulative wait times
 * This ensures alarm times match the times shown in the Summary of Logistics table
 */
function calculateStageTime(vehicleRegNo: string, stage: string): Date {
  // Get the vehicle's reporting time based on its index
  const vehicleIndex = VEHICLE_NUMBERS.indexOf(vehicleRegNo)
  const reportingTime = getVehicleEntryTime(vehicleIndex >= 0 ? vehicleIndex : 0)
  
  // Stage order and standard times (in minutes)
  const STAGE_STANDARDS: Record<string, number> = {
    'Reporting': 0,
    'Gate Entry': 5,
    'Tare Weight': 15,
    'Loading': 75,
    'Wt Post Loading': 25,
    'Gate Exit': 30,
  }
  const stageOrder = ['Reporting', 'Gate Entry', 'Tare Weight', 'Loading', 'Wt Post Loading', 'Gate Exit']
  
  // Add all stage times up to and including the current stage
  let totalMinutes = 0
  for (const s of stageOrder) {
    totalMinutes += STAGE_STANDARDS[s] || 0
    if (s === stage) break
  }
  
  return new Date(reportingTime.getTime() + totalMinutes * 60000)
}

/**
 * Calculate utilization percentage with edge case handling
 * @param trucksInside - Current number of trucks inside the plant
 * @param plantCapacity - Maximum plant capacity
 * @returns Rounded utilization percentage (0-100+)
 */
function calculateUtilization(trucksInside: number, plantCapacity: number): number {
  return Math.round((trucksInside / Math.max(1, plantCapacity)) * 100)
}

export function useRealTimeData() {
  const [kpiData, setKpiData] = useState<KPIData>({
    capacity: { utilization: 0, plantCapacity: 0, trucksInside: 0, trend: { direction: 'up', percentage: 0 } },
    turnaround: { avgDay: 0, avgCum: 0, lastYear: 0, trend: { direction: 'up', percentage: 0 }, performanceColor: 'blue', sparkline: [] },
    vehicles: { inDay: 0, outDay: 0, inCum: 0, outCum: 0, trend: { direction: 'up', percentage: 0 }, target: 0 },
    dispatch: { today: 0, cumMonth: 0, targetDay: 0, trend: { direction: 'up', percentage: 0 } },
    dwell: { totalDwellDay: 0, totalDwellCum: 0, avgDwellDay: 0, avgDwellCum: 0, totalDwellRatioDay: 0, totalDwellRatioCum: 0, avgDwellRatioDay: 0, avgDwellRatioCum: 0, trend: { direction: 'up', percentage: 0 }, sparkline: [] },
  })
  const [vehicleData, setVehicleData] = useState<VehicleRow[]>([])
  const [parkingData, setParkingData] = useState<ParkingData>({ 'AREA-1': [], 'AREA-2': [] } as any)
  const [loading, setLoading] = useState(true)
  const scheduledRef = useRef<{ tare: Record<string, boolean>, loading: Record<string, boolean>, wtpost: Record<string, boolean> }>({ tare: {}, loading: {}, wtpost: {} })

  // Helpers to persist and apply parking status overrides shared across pages
  type Status = 'available' | 'occupied' | 'reserved'
  const OVERRIDES_KEY = 'parkingStatusOverrides'
  const readOverrides = (): Record<string, Status> => {
    try {
      const raw = localStorage.getItem(OVERRIDES_KEY)
      if (!raw) return {}
      return JSON.parse(raw) as Record<string, Status>
    } catch {
      return {}
    }
  }
  const writeOverrides = (map: Record<string, Status>) => {
    try { localStorage.setItem(OVERRIDES_KEY, JSON.stringify(map)) } catch { }
  }
  const applyOverrides = (p: ParkingData): ParkingData => {
    const ov = readOverrides()
    const applyArea = (area: 'AREA-1' | 'AREA-2') => p[area].map(row => row.map(cell => {
      const k = `${area}-${cell.label}`
      const s = ov[k]
      return s ? { ...cell, status: s } : cell
    }))
    return { 'AREA-1': applyArea('AREA-1'), 'AREA-2': applyArea('AREA-2') }
  }

  // Allocate a spot by forcing its status to 'occupied' and persisting override
  const allocateSpot = (area: 'AREA-1' | 'AREA-2', label: string, vehicleNo?: string) => {
    const k = `${area}-${label}`
    const ov = { ...readOverrides(), [k]: 'reserved' as Status }
    writeOverrides(ov)
    window.dispatchEvent(new Event('parkingStatusOverrides-updated'))

    // Persist vehicle -> parking assignment so other pages can read it
    if (vehicleNo) {
      try {
        const key = 'vehicleParkingAssignments'
        const raw = localStorage.getItem(key)
        const map = raw ? JSON.parse(raw) as Record<string, { area: string; label: string }> : {}
        map[vehicleNo] = { area, label }
        localStorage.setItem(key, JSON.stringify(map))
        window.dispatchEvent(new Event('vehicleParkingAssignments-updated'))
      } catch { }
    }

    // Also persist the UI color to yellow for parity across Dashboard and Scheduling pages
    try {
      const colorRaw = localStorage.getItem('parkingColorMap')
      const colorMap = colorRaw ? JSON.parse(colorRaw) as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> : {}
      colorMap[k] = 'bg-yellow-500' // Always set to yellow when allocated
      localStorage.setItem('parkingColorMap', JSON.stringify(colorMap))
      window.dispatchEvent(new Event('parkingColorMap-updated'))
    } catch { }
    // Update current state immediately
    setParkingData(prev => applyOverrides(prev))
    // Simulate lifecycle: reserved -> occupied (after 10s) -> available (after additional 10s)
    try {
      setTimeout(() => {
        try {
          // Check that the slot was not reverted before changing to occupied
          const currentOverrides = readOverrides()
          if (currentOverrides[k] !== 'reserved') return

          const ov2 = { ...currentOverrides, [k]: 'occupied' as Status }
          writeOverrides(ov2)
          window.dispatchEvent(new Event('parkingStatusOverrides-updated'))

          // Trigger alert when vehicle reaches parking spot (for MH12AB4829)
          if (vehicleNo === 'MH12AB4829') {
            try {
              const shownKey = `parkingReachedAlertShown:${label}`
              if (!sessionStorage.getItem(shownKey)) {
                setTimeout(() => {
                  const parkingReachedTime = new Date()
                  parkingReachedTime.setHours(8, 10, 0, 0)
                  const timeString = parkingReachedTime.toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })
                  AlertManager.sendAlert({
                    vehicleRegNo: vehicleNo,
                    stage: 'Parking Reached',
                    waitTime: 0,
                    standardTime: 0,
                    exceedanceRatio: 0,
                    alertLevel: 'info',
                    timestamp: parkingReachedTime,
                    recipients: [],
                    message: `Vehicle ${vehicleNo} has reached parking spot ${label} (${area}) at ${timeString}`,
                  })
                  sessionStorage.setItem(shownKey, '1')
                }, 3000)
              }
            } catch { }
          }

          try {
            const colorRaw2 = localStorage.getItem('parkingColorMap')
            const colorMap2 = colorRaw2 ? JSON.parse(colorRaw2) as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> : {}
            colorMap2[k] = 'bg-red-500'
            localStorage.setItem('parkingColorMap', JSON.stringify(colorMap2))
            window.dispatchEvent(new Event('parkingColorMap-updated'))
          } catch { }
          setParkingData(prev => applyOverrides(prev))
        } catch { }
      }, 10000)

      setTimeout(() => {
        try {
          // mark available again only if slot is currently occupied (i.e., not reverted earlier)
          const currentOverrides = readOverrides()
          if (currentOverrides[k] !== 'occupied') return

          const ov3 = { ...currentOverrides, [k]: 'available' as Status }
          writeOverrides(ov3)
          window.dispatchEvent(new Event('parkingStatusOverrides-updated'))

          // Trigger alert when vehicle leaves parking spot (for MH12AB4829)
          if (vehicleNo === 'MH12AB4829') {
            try {
              const shownKey = `parkingLeftAlertShown:${label}`
              if (!sessionStorage.getItem(shownKey)) {
                setTimeout(() => {
                  const parkingLeftTime = new Date()
                  parkingLeftTime.setHours(8, 15, 0, 0)
                  const timeString = parkingLeftTime.toLocaleString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })
                  AlertManager.sendAlert({
                    vehicleRegNo: vehicleNo,
                    stage: 'Parking Left',
                    waitTime: 0,
                    standardTime: 0,
                    exceedanceRatio: 0,
                    alertLevel: 'info',
                    timestamp: parkingLeftTime,
                    recipients: [],
                    message: `Vehicle ${vehicleNo} has left parking spot ${label} (${area}) at ${timeString}`
                  })
                  sessionStorage.setItem(shownKey, '1')
                }, 3000)
              }
            } catch { }
          }

          try {
            const colorRaw3 = localStorage.getItem('parkingColorMap')
            const colorMap3 = colorRaw3 ? JSON.parse(colorRaw3) as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> : {}
            colorMap3[k] = 'bg-green-500'
            localStorage.setItem('parkingColorMap', JSON.stringify(colorMap3))
            window.dispatchEvent(new Event('parkingColorMap-updated'))
          } catch { }

          // Remove parking assignment (but don't mark as completed - allow re-allocation)
          if (vehicleNo) {
            try {
              const pKey = 'vehicleParkingAssignments'
              const pRaw = localStorage.getItem(pKey)
              const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
              // Only remove assignment if this vehicle is still assigned to this exact slot
              const assigned = pMap[vehicleNo]
              if (assigned && assigned.area === area && assigned.label === label) {
                delete pMap[vehicleNo]
                localStorage.setItem(pKey, JSON.stringify(pMap))
                window.dispatchEvent(new Event('vehicleParkingAssignments-updated'))
              }
            } catch { }
          }

          setParkingData(prev => applyOverrides(prev))
        } catch { }
      }, 20000)
    } catch { }
  }


  useEffect(() => {
    const reconcileTransientState = (parking?: ParkingData) => {
      try {
        // Reconcile parking color map and overrides: if a slot shows reserved/occupied but no vehicle is assigned, reset to available/green
        const colorRaw = localStorage.getItem('parkingColorMap')
        const colorMap = colorRaw ? JSON.parse(colorRaw) as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> : {}
        const ovRaw = localStorage.getItem('parkingStatusOverrides')
        const ov = ovRaw ? JSON.parse(ovRaw) as Record<string, 'available' | 'occupied' | 'reserved'> : {}
        const pAssignRaw = localStorage.getItem('vehicleParkingAssignments')
        const pAssign = pAssignRaw ? JSON.parse(pAssignRaw) as Record<string, { area: string; label: string }> : {}

        const assignedSet = new Set<string>()
        Object.values(pAssign).forEach(v => assignedSet.add(`${v.area}-${v.label}`))

        let changed = false
        Object.keys(colorMap).forEach(k => {
          if (!assignedSet.has(k) && colorMap[k] !== 'bg-green-500') { colorMap[k] = 'bg-green-500'; changed = true }
        })
        Object.keys(ov).forEach(k => {
          if (!assignedSet.has(k) && ov[k] !== 'available') { ov[k] = 'available'; changed = true }
        })
        if (changed) {
          try { localStorage.setItem('parkingColorMap', JSON.stringify(colorMap)); window.dispatchEvent(new Event('parkingColorMap-updated')) } catch { }
          try { localStorage.setItem('parkingStatusOverrides', JSON.stringify(ov)); window.dispatchEvent(new Event('parkingStatusOverrides-updated')) } catch { }
        }

        // Reconcile station status arrays: if a station shows occupied/reserved but no assignment references it, set to available
        const reconcileStatuses = (statusesKey: string, assignmentKey: string) => {
          try {
            const sRaw = localStorage.getItem(statusesKey)
            const items = sRaw ? JSON.parse(sRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
            const aRaw = localStorage.getItem(assignmentKey)
            const amap = aRaw ? JSON.parse(aRaw) as Record<string, string> : {}
            let ch = false
            const next = items.map(it => {
              if ((it.status === 'occupied' || it.status === 'reserved') && !Object.values(amap).includes(it.id)) { ch = true; return { ...it, status: 'available' as const } }
              return it
            })
            if (ch) { localStorage.setItem(statusesKey, JSON.stringify(next)); window.dispatchEvent(new Event(`${statusesKey}-updated`)) }
          } catch { }
        }

        reconcileStatuses('tareWeightStatuses', 'vehicleTareWeightAssignments')
        reconcileStatuses('loadingGateStatuses', 'vehicleLoadingGateAssignments')
        reconcileStatuses('wtPostLoadingStatuses', 'vehicleWtPostLoadingAssignments')
        reconcileStatuses('gateExitStatuses', 'vehicleGateExitAssignments')

        // Re-apply parking overrides to the in-memory parking data if provided
        if (parking) {
          try { setParkingData(applyOverrides(parking)) } catch { }
        } else {
          try { setParkingData(prev => applyOverrides(prev)) } catch { }
        }
      } catch { }
    }

    Promise.all([
      dashboardService.getKPIData(),
      dashboardService.getVehicleRows(),
      dashboardService.getParking(),
    ]).then(([kpi, vehicles, parking]) => {
      setKpiData(kpi)
      setVehicleData(vehicles)
      setParkingData(applyOverrides(parking))
      // Ensure any stale transient state left in localStorage is reconciled on startup
      reconcileTransientState(parking)
      // Ensure KPI counters reflect any already-completed gate-entry / gate-exit events
      try {
        const ensureInitialKpiCounts = () => {
          try {
            const rfidMap = rfidAssignmentService.getAssignments()
            const gateExitRaw = localStorage.getItem('vehicleGateExitCompleted')
            const gateExitMap = gateExitRaw ? JSON.parse(gateExitRaw) as Record<string, string> : {}

            Object.keys(rfidMap || {}).forEach((reg) => {
              try {
                const entryKey = `kpiGateEntryCounted:${reg}`
                if (!sessionStorage.getItem(entryKey)) {
                  setKpiData((prev) => {
                    const inDay = (prev.vehicles.inDay || 0) + 1
                    const inCum = (prev.vehicles.inCum || 0) + 1
                    const trucksInside = (prev.capacity.trucksInside || 0) + 1
                    const plantCapacity = prev.capacity.plantCapacity || 0
                    const utilization = calculateUtilization(trucksInside, plantCapacity)
                    try { sessionStorage.setItem(entryKey, '1') } catch { }
                    return {
                      ...prev,
                      vehicles: { ...prev.vehicles, inDay, inCum },
                      capacity: { ...prev.capacity, trucksInside, utilization },
                    }
                  })
                }
              } catch { }
            })

            Object.keys(gateExitMap || {}).forEach((reg) => {
              try {
                const exitKey = `kpiGateExitCounted:${reg}`
                if (!sessionStorage.getItem(exitKey)) {
                  setKpiData((prev) => {
                    const outDay = (prev.vehicles.outDay || 0) + 1
                    const outCum = (prev.vehicles.outCum || 0) + 1
                    const trucksInside = Math.max(0, (prev.capacity.trucksInside || 0) - 1)
                    const plantCapacity = prev.capacity.plantCapacity || 0
                    const utilization = calculateUtilization(trucksInside, plantCapacity)
                    try { sessionStorage.setItem(exitKey, '1') } catch { }
                    return {
                      ...prev,
                      vehicles: { ...prev.vehicles, outDay, outCum },
                      capacity: { ...prev.capacity, trucksInside, utilization },
                      dispatch: {
                        ...prev.dispatch,
                        today: (prev.dispatch.today || 0) + 1,
                        cumMonth: (prev.dispatch.cumMonth || 0) + 1,
                      },
                    }
                  })
                }
              } catch { }
            })
          } catch { }
        }
        ensureInitialKpiCounts()
      } catch { }
      // On server restart, show reporting-style alert for special vehicle once per server restart (fallback per session)
      try {
        const special = 'MH12AB4829'
        const serverToken = localStorage.getItem('serverRestartToken')
        if (serverToken) {
          const shownKey = `reportingAlertShown:${serverToken}`
          if (!localStorage.getItem(shownKey)) {
            try {
              // Use hardcoded time 08:00 AM for MH12AB4829
              const reportingTime = new Date()
              reportingTime.setHours(8, 0, 0, 0)
              AlertManager.sendAlert({ vehicleRegNo: special, stage: 'Reporting', waitTime: 0, standardTime: 0, exceedanceRatio: 0, alertLevel: 'info', timestamp: reportingTime, recipients: [] })
              try { localStorage.setItem(shownKey, '1') } catch { }
            } catch { }
          }
        } else {
          const fallback = 'reportingAlertShownFallback'
          if (!sessionStorage.getItem(fallback)) {
            try {
              // Use hardcoded time 08:00 AM for MH12AB4829
              const reportingTime = new Date()
              reportingTime.setHours(8, 0, 0, 0)
              AlertManager.sendAlert({ vehicleRegNo: special, stage: 'Reporting', waitTime: 0, standardTime: 0, exceedanceRatio: 0, alertLevel: 'info', timestamp: reportingTime, recipients: [] })
              try { sessionStorage.setItem(fallback, '1') } catch { }
            } catch { }
          }
        }
      } catch { }
    }).finally(() => setLoading(false))

    // Listen for assignment and pending updates and refresh vehicle rows
    const refreshVehicleRows = () => {
      console.log('Assignment/pending update event received, refreshing vehicle data...');
      dashboardService.getVehicleRows().then(vehicles => {
        console.log('Vehicle data refreshed:', vehicles);
        setVehicleData(vehicles);
      });
    }

    const eventsToListen = [
      'rfidAssignments-updated',
      'vehicleParkingAssignments-updated',
      'vehicleTareWeightAssignments-updated',
      'vehicleLoadingGateAssignments-updated',
      'vehicleWtPostLoadingAssignments-updated',
      'vehicleGateExitAssignments-updated',
      'vehicleTareWeightPending-updated',
      'vehicleLoadingGatePending-updated',
      'vehicleWtPostLoadingPending-updated',
      'vehicleGateEntryPending-updated',
      // Also refresh vehicle rows when station status arrays change (reserved -> occupied)
      'tareWeightStatuses-updated',
      'loadingGateStatuses-updated',
      'wtPostLoadingStatuses-updated',
      'gateExitStatuses-updated',
    ]

    eventsToListen.forEach(ev => window.addEventListener(ev, refreshVehicleRows))

    // Schedule lifecycle simulation for tare/loading/wtpost assignments so stages move reserved->occupied->available

    const scheduleForAssignments = (mapKey: string, statusesKey: string, completedKey: string, type: 'tare' | 'loading' | 'wtpost') => {
      try {
        const raw = localStorage.getItem(mapKey)
        const map = raw ? JSON.parse(raw) as Record<string, string> : {}
        Object.entries(map).forEach(([vehicleNo, id]) => {
          const scheduledBucket = scheduledRef.current[type]
          if (scheduledBucket[vehicleNo]) return

          // Helper that actually schedules the lifecycle timers
          const doSchedule = () => {
            // mark scheduled to avoid duplicates
            scheduledBucket[vehicleNo] = true

            // after 10s -> occupied
            setTimeout(() => {
              try {
                const sRaw = localStorage.getItem(statusesKey)
                const items = sRaw ? JSON.parse(sRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next = items.map(it => it.id === id ? { ...it, status: 'occupied' as const } : it)
                localStorage.setItem(statusesKey, JSON.stringify(next))
                window.dispatchEvent(new Event(`${statusesKey}-updated`))
              } catch { }
            }, 10000)

            // after additional 10s (total 20s) -> available and mark completed for the vehicle
            setTimeout(() => {
              try {
                const sRaw2 = localStorage.getItem(statusesKey)
                const items2 = sRaw2 ? JSON.parse(sRaw2) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next2 = items2.map(it => it.id === id ? { ...it, status: 'available' as const } : it)
                localStorage.setItem(statusesKey, JSON.stringify(next2))
                window.dispatchEvent(new Event(`${statusesKey}-updated`))

                // Mark completed for this vehicle and remove assignment
                const compRaw = localStorage.getItem(completedKey)
                const compMap = compRaw ? JSON.parse(compRaw) as Record<string, string> : {}
                compMap[vehicleNo] = id
                localStorage.setItem(completedKey, JSON.stringify(compMap))
                window.dispatchEvent(new Event(`${completedKey}-updated`))

                // remove from assignment map
                try {
                  const aRaw = localStorage.getItem(mapKey)
                  const aMap = aRaw ? JSON.parse(aRaw) as Record<string, string> : {}
                  if (aMap[vehicleNo]) {
                    delete aMap[vehicleNo]
                    localStorage.setItem(mapKey, JSON.stringify(aMap))
                    window.dispatchEvent(new Event(`${mapKey}-updated`))
                  }
                } catch { }
              } catch { }
            }, 15000)
          }

          // Check prerequisite based on type. If prerequisite not met, wait for relevant event.
          const checkPrereq = () => {
            try {
              if (type === 'tare') {
                // gate entry completion is indicated by saved RFID for vehicle
                const rfidMap = rfidAssignmentService.getAssignments()
                return Boolean(rfidMap[vehicleNo])
              }
              if (type === 'loading') {
                const rawT = localStorage.getItem('vehicleTareWeightCompleted')
                const tmap = rawT ? JSON.parse(rawT) as Record<string, string> : {}
                return Boolean(tmap[vehicleNo])
              }
              if (type === 'wtpost') {
                const rawL = localStorage.getItem('vehicleLoadingGateCompleted')
                const lmap = rawL ? JSON.parse(rawL) as Record<string, string> : {}
                return Boolean(lmap[vehicleNo])
              }
            } catch { }
            return false
          }

          if (checkPrereq()) {
            doSchedule()
          } else {
            // Attach a one-time listener for the event that signals prerequisite completion
            let listener: any = null
            if (type === 'tare') {
              listener = () => {
                if (checkPrereq()) {
                  window.removeEventListener('rfidAssignments-updated', listener)
                  doSchedule()
                }
              }
              window.addEventListener('rfidAssignments-updated', listener)
            } else if (type === 'loading') {
              listener = () => {
                const rawT = localStorage.getItem('vehicleTareWeightCompleted')
                const tmap = rawT ? JSON.parse(rawT) as Record<string, string> : {}
                if (tmap[vehicleNo]) {
                  window.removeEventListener('vehicleTareWeightCompleted-updated', listener)
                  doSchedule()
                }
              }
              window.addEventListener('vehicleTareWeightCompleted-updated', listener)
            } else if (type === 'wtpost') {
              listener = () => {
                const rawL = localStorage.getItem('vehicleLoadingGateCompleted')
                const lmap = rawL ? JSON.parse(rawL) as Record<string, string> : {}
                if (lmap[vehicleNo]) {
                  window.removeEventListener('vehicleLoadingGateCompleted-updated', listener)
                  doSchedule()
                }
              }
              window.addEventListener('vehicleLoadingGateCompleted-updated', listener)
            }
          }
        })
      } catch { }
    }

    // Initial schedule pass for existing assignments
    scheduleForAssignments('vehicleTareWeightAssignments', 'tareWeightStatuses', 'vehicleTareWeightCompleted', 'tare')
    scheduleForAssignments('vehicleLoadingGateAssignments', 'loadingGateStatuses', 'vehicleLoadingGateCompleted', 'loading')
    scheduleForAssignments('vehicleWtPostLoadingAssignments', 'wtPostLoadingStatuses', 'vehicleWtPostLoadingCompleted', 'wtpost')

    // Listeners to pick up new assignment events and schedule lifecycles
    const onTareAssign = () => scheduleForAssignments('vehicleTareWeightAssignments', 'tareWeightStatuses', 'vehicleTareWeightCompleted', 'tare')
    const onLoadingAssign = () => scheduleForAssignments('vehicleLoadingGateAssignments', 'loadingGateStatuses', 'vehicleLoadingGateCompleted', 'loading')
    const onWtPostAssign = () => scheduleForAssignments('vehicleWtPostLoadingAssignments', 'wtPostLoadingStatuses', 'vehicleWtPostLoadingCompleted', 'wtpost')

    window.addEventListener('vehicleTareWeightAssignments-updated', onTareAssign)
    window.addEventListener('vehicleLoadingGateAssignments-updated', onLoadingAssign)
    window.addEventListener('vehicleWtPostLoadingAssignments-updated', onWtPostAssign)

    // When a wt-post-loading lifecycle completes for a vehicle, automatically allocate gate-exit and start its lifecycle
    const onWtPostCompleted = () => {
      try {
        const raw = localStorage.getItem('vehicleWtPostLoadingCompleted')
        const map = raw ? JSON.parse(raw) as Record<string, string> : {}
        Object.keys(map).forEach((vehicleNo) => {
          try {
            // if gate exit already assigned, skip
            const exitRaw = localStorage.getItem('vehicleGateExitAssignments')
            const exitMap = exitRaw ? JSON.parse(exitRaw) as Record<string, string> : {}
            if (exitMap[vehicleNo]) return

            // find an available gateExit id
            const gRaw = localStorage.getItem('gateExitStatuses')
            const gates = gRaw ? JSON.parse(gRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : Array.from({ length: 1 }, (_, i) => ({ id: `GE-${i + 1}`, status: 'available' as const }))
            const avail = gates.find(g => g.status === 'available')
            const chosenId = avail ? avail.id : (gates[0] ? gates[0].id : `GE-1`)

            // reserve chosen gate exit
            const nextGates = gates.map(g => g.id === chosenId ? { ...g, status: 'reserved' as const } : g)
            localStorage.setItem('gateExitStatuses', JSON.stringify(nextGates))
            window.dispatchEvent(new Event('gateExitStatuses-updated'))

            // persist assignment
            exitMap[vehicleNo] = chosenId
            localStorage.setItem('vehicleGateExitAssignments', JSON.stringify(exitMap))
            window.dispatchEvent(new Event('vehicleGateExitAssignments-updated'))

            // schedule lifecycle: 10s -> occupied, +5s -> available + mark completed
            setTimeout(() => {
              try {
                const gRaw2 = localStorage.getItem('gateExitStatuses')
                const gates2 = gRaw2 ? JSON.parse(gRaw2) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next2 = gates2.map(g => g.id === chosenId ? { ...g, status: 'occupied' as const } : g)
                localStorage.setItem('gateExitStatuses', JSON.stringify(next2))
                window.dispatchEvent(new Event('gateExitStatuses-updated'))
              } catch { }
            }, 10000)

            setTimeout(() => {
              try {
                const gRaw3 = localStorage.getItem('gateExitStatuses')
                const gates3 = gRaw3 ? JSON.parse(gRaw3) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next3 = gates3.map(g => g.id === chosenId ? { ...g, status: 'available' as const } : g)
                localStorage.setItem('gateExitStatuses', JSON.stringify(next3))
                window.dispatchEvent(new Event('gateExitStatuses-updated'))

                // mark completed for this vehicle and remove assignment
                const compKey = 'vehicleGateExitCompleted'
                const compRaw = localStorage.getItem(compKey)
                const compMap = compRaw ? JSON.parse(compRaw) as Record<string, string> : {}
                compMap[vehicleNo] = chosenId
                localStorage.setItem(compKey, JSON.stringify(compMap))
                window.dispatchEvent(new Event(`${compKey}-updated`))

                // Also mark all other stages completed for this vehicle so scheduling table shows Completed
                try {
                  // Parking
                  const pKey = 'vehicleParkingCompleted'
                  const pRaw = localStorage.getItem(pKey)
                  const pMap = pRaw ? JSON.parse(pRaw) as Record<string, string> : {}
                  // try to use existing parking assignment label if present
                  try {
                    const paRaw = localStorage.getItem('vehicleParkingAssignments')
                    const paMap = paRaw ? JSON.parse(paRaw) as Record<string, { area: string; label: string }> : {}
                    if (paMap[vehicleNo]) pMap[vehicleNo] = paMap[vehicleNo].label
                    else pMap[vehicleNo] = chosenId
                  } catch { pMap[vehicleNo] = chosenId }
                  localStorage.setItem(pKey, JSON.stringify(pMap))
                  window.dispatchEvent(new Event(`${pKey}-updated`))

                  // Tare
                  const tKey = 'vehicleTareWeightCompleted'
                  const tRaw = localStorage.getItem(tKey)
                  const tMap = tRaw ? JSON.parse(tRaw) as Record<string, string> : {}
                  try { const taRaw = localStorage.getItem('vehicleTareWeightAssignments'); const taMap = taRaw ? JSON.parse(taRaw) as Record<string, string> : {}; if (taMap[vehicleNo]) tMap[vehicleNo] = taMap[vehicleNo]; else tMap[vehicleNo] = chosenId } catch { tMap[vehicleNo] = chosenId }
                  localStorage.setItem(tKey, JSON.stringify(tMap))
                  window.dispatchEvent(new Event(`${tKey}-updated`))

                  // Loading
                  const lKey = 'vehicleLoadingGateCompleted'
                  const lRaw = localStorage.getItem(lKey)
                  const lMap = lRaw ? JSON.parse(lRaw) as Record<string, string> : {}
                  try { const laRaw = localStorage.getItem('vehicleLoadingGateAssignments'); const laMap = laRaw ? JSON.parse(laRaw) as Record<string, string> : {}; if (laMap[vehicleNo]) lMap[vehicleNo] = laMap[vehicleNo]; else lMap[vehicleNo] = chosenId } catch { lMap[vehicleNo] = chosenId }
                  localStorage.setItem(lKey, JSON.stringify(lMap))
                  window.dispatchEvent(new Event(`${lKey}-updated`))

                  // WtPost
                  const wKey = 'vehicleWtPostLoadingCompleted'
                  const wRaw = localStorage.getItem(wKey)
                  const wMap = wRaw ? JSON.parse(wRaw) as Record<string, string> : {}
                  try { const waRaw = localStorage.getItem('vehicleWtPostLoadingAssignments'); const waMap = waRaw ? JSON.parse(waRaw) as Record<string, string> : {}; if (waMap[vehicleNo]) wMap[vehicleNo] = waMap[vehicleNo]; else wMap[vehicleNo] = chosenId } catch { wMap[vehicleNo] = chosenId }
                  localStorage.setItem(wKey, JSON.stringify(wMap))
                  window.dispatchEvent(new Event(`${wKey}-updated`))
                } catch { }

                try {
                  const aRaw = localStorage.getItem('vehicleGateExitAssignments')
                  const aMap = aRaw ? JSON.parse(aRaw) as Record<string, string> : {}
                  if (aMap[vehicleNo]) {
                    delete aMap[vehicleNo]
                    localStorage.setItem('vehicleGateExitAssignments', JSON.stringify(aMap))
                    window.dispatchEvent(new Event('vehicleGateExitAssignments-updated'))
                  }
                } catch { }
              } catch { }
            }, 15000)
          } catch { }
        })
      } catch { }
    }

    window.addEventListener('vehicleWtPostLoadingCompleted-updated', onWtPostCompleted)

    const onGateExitCompletedToast = () => {
      try {
        const raw = localStorage.getItem('vehicleGateExitCompleted')
        const map = raw ? JSON.parse(raw) as Record<string, string> : {}

        // Update KPIs for ALL vehicles that have completed gate exit (not just the special vehicle)
        Object.keys(map || {}).forEach((vehicleReg) => {
          try {
            const kpiExitKey = `kpiGateExitCounted:${vehicleReg}`
            if (!sessionStorage.getItem(kpiExitKey)) {
              setKpiData((prev) => {
                const outDay = (prev.vehicles.outDay || 0) + 1
                const outCum = (prev.vehicles.outCum || 0) + 1
                const trucksInside = Math.max(0, (prev.capacity.trucksInside || 0) - 1)
                const plantCapacity = prev.capacity.plantCapacity || 0
                const utilization = calculateUtilization(trucksInside, plantCapacity)

                // Calculate turnaround time for this vehicle
                let newAvgDay = prev.turnaround.avgDay
                let newAvgCum = prev.turnaround.avgCum
                let newSparkline = prev.turnaround.sparkline
                let newPerformanceColor = prev.turnaround.performanceColor

                try {
                  // Get vehicle entry timestamp
                  const entryTimestampsRaw = localStorage.getItem('vehicleEntryTimestamps')
                  const entryTimestamps = entryTimestampsRaw ? JSON.parse(entryTimestampsRaw) as Record<string, number> : {}

                  if (entryTimestamps[vehicleReg]) {
                    const exitTime = Date.now()
                    const entryTime = entryTimestamps[vehicleReg]
                    const turnaroundMinutes = Math.round((exitTime - entryTime) / (1000 * 60))

                    // Update daily average (simple moving average)
                    const turnaroundCountRaw = sessionStorage.getItem('turnaroundCountDay')
                    const turnaroundCount = turnaroundCountRaw ? parseInt(turnaroundCountRaw, 10) : 0
                    const turnaroundSumRaw = sessionStorage.getItem('turnaroundSumDay')
                    const turnaroundSum = turnaroundSumRaw ? parseFloat(turnaroundSumRaw) : 0

                    const newCount = turnaroundCount + 1
                    const newSum = turnaroundSum + turnaroundMinutes
                    newAvgDay = Math.round(newSum / newCount)

                    sessionStorage.setItem('turnaroundCountDay', newCount.toString())
                    sessionStorage.setItem('turnaroundSumDay', newSum.toString())

                    // Update cumulative average
                    const turnaroundCountCumRaw = localStorage.getItem('turnaroundCountCum')
                    const turnaroundCountCum = turnaroundCountCumRaw ? parseInt(turnaroundCountCumRaw, 10) : 0
                    const turnaroundSumCumRaw = localStorage.getItem('turnaroundSumCum')
                    const turnaroundSumCum = turnaroundSumCumRaw ? parseFloat(turnaroundSumCumRaw) : 0

                    const newCountCum = turnaroundCountCum + 1
                    const newSumCum = turnaroundSumCum + turnaroundMinutes
                    newAvgCum = Math.round(newSumCum / newCountCum)

                    localStorage.setItem('turnaroundCountCum', newCountCum.toString())
                    localStorage.setItem('turnaroundSumCum', newSumCum.toString())

                    // Update sparkline (append new value, keep last 20)
                    newSparkline = [...prev.turnaround.sparkline, { v: turnaroundMinutes }].slice(-20)

                    // Update performance color based on avgDay thresholds
                    newPerformanceColor = newAvgDay < 90 ? 'green' : newAvgDay < 110 ? 'yellow' : 'red'

                    // Clean up entry timestamp
                    delete entryTimestamps[vehicleReg]
                    localStorage.setItem('vehicleEntryTimestamps', JSON.stringify(entryTimestamps))
                  }
                } catch (e) {
                  console.error('Error calculating turnaround time:', e)
                }

                // Calculate dwell time for this vehicle
                let newTotalDwellDay = prev.dwell.totalDwellDay
                let newTotalDwellCum = prev.dwell.totalDwellCum
                let newAvgDwellDay = prev.dwell.avgDwellDay
                let newAvgDwellCum = prev.dwell.avgDwellCum
                let newTotalDwellRatioDay = prev.dwell.totalDwellRatioDay
                let newAvgDwellRatioDay = prev.dwell.avgDwellRatioDay
                let newDwellSparkline = prev.dwell.sparkline

                try {
                  // Get vehicle stage timestamps to calculate dwell time
                  const stageTimestampsRaw = localStorage.getItem('vehicleStageTimestamps')
                  const stageTimestamps = stageTimestampsRaw ? JSON.parse(stageTimestampsRaw) as Record<string, Record<string, number>> : {}

                  if (stageTimestamps[vehicleReg]) {
                    const stages = stageTimestamps[vehicleReg]
                    let totalDwellMinutes = 0

                    // Calculate dwell time as sum of time spent in each stage
                    // Stages: parking, tare, loading, wtpost
                    const stageKeys = ['parking', 'tare', 'loading', 'wtpost']
                    stageKeys.forEach(stage => {
                      if (stages[stage]) {
                        // Each stage timestamp represents when the stage started
                        // Duration is calculated from stage start to next stage start (or exit time for last stage)
                        totalDwellMinutes += stages[stage]
                      }
                    })

                    // If no stage durations recorded, estimate based on standard times
                    if (totalDwellMinutes === 0) {
                      // Estimate: parking (5 min) + tare (5 min) + loading (75 min) + wtpost (5 min) = 90 min
                      totalDwellMinutes = 90
                    }

                    // Update daily totals and averages
                    const dwellCountRaw = sessionStorage.getItem('dwellCountDay')
                    const dwellCount = dwellCountRaw ? parseInt(dwellCountRaw, 10) : 0
                    const dwellSumRaw = sessionStorage.getItem('dwellSumDay')
                    const dwellSum = dwellSumRaw ? parseFloat(dwellSumRaw) : 0

                    const newDwellCount = dwellCount + 1
                    const newDwellSum = dwellSum + totalDwellMinutes
                    newTotalDwellDay = Math.round(newDwellSum)
                    newAvgDwellDay = Math.round(newDwellSum / newDwellCount)

                    sessionStorage.setItem('dwellCountDay', newDwellCount.toString())
                    sessionStorage.setItem('dwellSumDay', newDwellSum.toString())

                    // Update cumulative totals and averages
                    const dwellCountCumRaw = localStorage.getItem('dwellCountCum')
                    const dwellCountCum = dwellCountCumRaw ? parseInt(dwellCountCumRaw, 10) : 0
                    const dwellSumCumRaw = localStorage.getItem('dwellSumCum')
                    const dwellSumCum = dwellSumCumRaw ? parseFloat(dwellSumCumRaw) : 0

                    const newDwellCountCum = dwellCountCum + 1
                    const newDwellSumCum = dwellSumCum + totalDwellMinutes
                    newTotalDwellCum = Math.round(newDwellSumCum)
                    newAvgDwellCum = Math.round(newDwellSumCum / newDwellCountCum)

                    localStorage.setItem('dwellCountCum', newDwellCountCum.toString())
                    localStorage.setItem('dwellSumCum', newDwellSumCum.toString())

                    // Calculate dwell ratios (dwell time / turnaround time * 100)
                    const turnaroundSumDayRaw = sessionStorage.getItem('turnaroundSumDay')
                    const turnaroundSumDay = turnaroundSumDayRaw ? parseFloat(turnaroundSumDayRaw) : 0
                    const turnaroundCountDayRaw = sessionStorage.getItem('turnaroundCountDay')
                    const turnaroundCountDay = turnaroundCountDayRaw ? parseInt(turnaroundCountDayRaw, 10) : 1
                    const avgTurnaroundDay = turnaroundCountDay > 0 ? turnaroundSumDay / turnaroundCountDay : 1

                    if (avgTurnaroundDay > 0) {
                      newTotalDwellRatioDay = Math.round((newTotalDwellDay / (avgTurnaroundDay * newDwellCount)) * 10000) / 100
                      newAvgDwellRatioDay = Math.round((newAvgDwellDay / avgTurnaroundDay) * 10000) / 100
                    }

                    // Update sparkline (append new value, keep last 20)
                    newDwellSparkline = [...prev.dwell.sparkline, { v: totalDwellMinutes }].slice(-20)

                    // Clean up stage timestamps
                    delete stageTimestamps[vehicleReg]
                    localStorage.setItem('vehicleStageTimestamps', JSON.stringify(stageTimestamps))
                  }
                } catch (e) {
                  console.error('Error calculating dwell time:', e)
                }

                try { sessionStorage.setItem(kpiExitKey, '1') } catch { }
                return {
                  ...prev,
                  vehicles: { ...prev.vehicles, outDay, outCum },
                  capacity: { ...prev.capacity, trucksInside, utilization },
                  turnaround: {
                    ...prev.turnaround,
                    avgDay: newAvgDay,
                    avgCum: newAvgCum,
                    sparkline: newSparkline,
                    performanceColor: newPerformanceColor
                  },
                  dwell: {
                    ...prev.dwell,
                    totalDwellDay: newTotalDwellDay,
                    totalDwellCum: newTotalDwellCum,
                    avgDwellDay: newAvgDwellDay,
                    avgDwellCum: newAvgDwellCum,
                    totalDwellRatioDay: newTotalDwellRatioDay,
                    avgDwellRatioDay: newAvgDwellRatioDay,
                    sparkline: newDwellSparkline,
                  },
                  dispatch: {
                    ...prev.dispatch,
                    today: (prev.dispatch.today || 0) + 1,
                    cumMonth: (prev.dispatch.cumMonth || 0) + 1,
                  },
                }
              })
            }
          } catch { }
        })

        // Send alerts for ALL vehicles that completed gate exit
        Object.keys(map || {}).forEach((vehicleReg) => {
          const alertKey = `gateExitAlertShown:${vehicleReg}`
          if (!sessionStorage.getItem(alertKey)) {
            // Wait 3 seconds before showing the alert
            setTimeout(() => {
              try {
                const gateExitTime = new Date()
                AlertManager.sendAlert({
                  vehicleRegNo: vehicleReg,
                  stage: 'Gate Exit',
                  waitTime: 0,
                  standardTime: 0,
                  exceedanceRatio: 0,
                  alertLevel: 'info',
                  timestamp: gateExitTime,
                  recipients: [],
                })
                try { sessionStorage.setItem(alertKey, '1') } catch { }
              } catch { }
            }, 3000)
          }
        })
      } catch { }
    }
    window.addEventListener('vehicleGateExitCompleted-updated', onGateExitCompletedToast)

    // Listen for RFID assignment completion (Gate Entry / Document Verification)
    const onGateEntryCompleted = () => {
      try {
        const rfidMap = rfidAssignmentService.getAssignments()

        // Update KPIs for ALL vehicles that have completed gate entry (not just the special vehicle)
        Object.keys(rfidMap || {}).forEach((vehicleReg) => {
          try {
            const kpiEntryKey = `kpiGateEntryCounted:${vehicleReg}`
            if (!sessionStorage.getItem(kpiEntryKey)) {
              // Store entry timestamp for turnaround time calculation
              try {
                const entryTimestampsRaw = localStorage.getItem('vehicleEntryTimestamps')
                const entryTimestamps = entryTimestampsRaw ? JSON.parse(entryTimestampsRaw) as Record<string, number> : {}
                entryTimestamps[vehicleReg] = Date.now()
                localStorage.setItem('vehicleEntryTimestamps', JSON.stringify(entryTimestamps))
              } catch (e) {
                console.error('Error storing entry timestamp:', e)
              }

              setKpiData((prev) => {
                const inDay = (prev.vehicles.inDay || 0) + 1
                const inCum = (prev.vehicles.inCum || 0) + 1
                const trucksInside = (prev.capacity.trucksInside || 0) + 1
                const plantCapacity = prev.capacity.plantCapacity || 0
                const utilization = calculateUtilization(trucksInside, plantCapacity)
                try { sessionStorage.setItem(kpiEntryKey, '1') } catch { }
                return {
                  ...prev,
                  vehicles: { ...prev.vehicles, inDay, inCum },
                  capacity: { ...prev.capacity, trucksInside, utilization },
                }
              })
            }
          } catch { }
        })

        // Send alerts for ALL vehicles that completed gate entry
        Object.keys(rfidMap || {}).forEach((vehicleReg) => {
          const alertKey = `gateEntryAlertShown:${vehicleReg}`
          if (!sessionStorage.getItem(alertKey)) {
            setTimeout(() => {
              try {
                const gateEntryTime = calculateStageTime(vehicleReg, 'Gate Entry')
                AlertManager.sendAlert({
                  vehicleRegNo: vehicleReg,
                  stage: 'Gate Entry',
                  waitTime: 0,
                  standardTime: 0,
                  exceedanceRatio: 0,
                  alertLevel: 'info',
                  timestamp: gateEntryTime,
                  recipients: [],
                })
                try { sessionStorage.setItem(alertKey, '1') } catch { }
              } catch { }
            }, 3000)
          }
        })
      } catch { }
    }
    window.addEventListener('rfidAssignments-updated', onGateEntryCompleted)

    // Listen for Tare Weight completion
    const onTareWeightCompleted = () => {
      try {
        const raw = localStorage.getItem('vehicleTareWeightCompleted')
        const map = raw ? JSON.parse(raw) as Record<string, string> : {}

        // Send alerts for ALL vehicles that completed tare weight
        Object.keys(map || {}).forEach((vehicleReg) => {
          const alertKey = `tareWeightAlertShown:${vehicleReg}`
          if (!sessionStorage.getItem(alertKey)) {
            setTimeout(() => {
              try {
                const tareWeightTime = calculateStageTime(vehicleReg, 'Tare Weight')
                AlertManager.sendAlert({
                  vehicleRegNo: vehicleReg,
                  stage: 'Tare Weight',
                  waitTime: 0,
                  standardTime: 0,
                  exceedanceRatio: 0,
                  alertLevel: 'info',
                  timestamp: tareWeightTime,
                  recipients: [],
                })
                try { sessionStorage.setItem(alertKey, '1') } catch { }
              } catch { }
            }, 3000)
          }
        })
      } catch { }
    }
    window.addEventListener('vehicleTareWeightCompleted-updated', onTareWeightCompleted)

    // Listen for Loading Gate completion
    const onLoadingGateCompleted = () => {
      try {
        const raw = localStorage.getItem('vehicleLoadingGateCompleted')
        const map = raw ? JSON.parse(raw) as Record<string, string> : {}

        // Send alerts for ALL vehicles that completed loading
        Object.keys(map || {}).forEach((vehicleReg) => {
          const alertKey = `loadingGateAlertShown:${vehicleReg}`
          if (!sessionStorage.getItem(alertKey)) {
            setTimeout(() => {
              try {
                const loadingTime = calculateStageTime(vehicleReg, 'Loading')
                AlertManager.sendAlert({
                  vehicleRegNo: vehicleReg,
                  stage: 'Loading',
                  waitTime: 0,
                  standardTime: 0,
                  exceedanceRatio: 0,
                  alertLevel: 'info',
                  timestamp: loadingTime,
                  recipients: [],
                })
                try { sessionStorage.setItem(alertKey, '1') } catch { }
              } catch { }
            }, 3000)
          }
        })
      } catch { }
    }
    window.addEventListener('vehicleLoadingGateCompleted-updated', onLoadingGateCompleted)

    // Listen for Wt Post Loading completion
    const onWtPostLoadingCompleted = () => {
      try {
        const raw = localStorage.getItem('vehicleWtPostLoadingCompleted')
        const map = raw ? JSON.parse(raw) as Record<string, string> : {}

        // Send alerts for ALL vehicles that completed wt post loading
        Object.keys(map || {}).forEach((vehicleReg) => {
          const alertKey = `wtPostLoadingAlertShown:${vehicleReg}`
          if (!sessionStorage.getItem(alertKey)) {
            setTimeout(() => {
              try {
                const wtPostTime = calculateStageTime(vehicleReg, 'Wt Post Loading')
                AlertManager.sendAlert({
                  vehicleRegNo: vehicleReg,
                  stage: 'Wt Post Loading',
                  waitTime: 0,
                  standardTime: 0,
                  exceedanceRatio: 0,
                  alertLevel: 'info',
                  timestamp: wtPostTime,
                  recipients: [],
                })
                try { sessionStorage.setItem(alertKey, '1') } catch { }
              } catch { }
            }, 3000)
          }
        })
      } catch { }
    }
    window.addEventListener('vehicleWtPostLoadingCompleted-updated', onWtPostLoadingCompleted)

    const interval = setInterval(() => {
      setKpiData((prev) => {
        const jitter = (n: number, d = 5) => Math.max(0, n + Math.round((Math.random() - 0.5) * d))
        const util = Math.max(0, Math.min(100, jitter(prev.capacity.utilization, 6)))
        const avgDay = Math.max(60, jitter(prev.turnaround.avgDay, 6))
        const performanceColor = avgDay < 90 ? 'green' : avgDay < 110 ? 'yellow' : 'red'
        const avgDwell = Math.max(1, jitter(prev.dwell.avgDwellDay, 3))
        return {
          capacity: { ...prev.capacity, utilization: util, trend: { direction: Math.random() > 0.5 ? 'up' : 'down', percentage: Math.round(Math.random() * 5 * 10) / 10 } },
          turnaround: { ...prev.turnaround, avgDay, performanceColor, sparkline: [...prev.turnaround.sparkline.slice(1), { v: avgDay }] },
          vehicles: { ...prev.vehicles, inDay: jitter(prev.vehicles.inDay, 8), outDay: jitter(prev.vehicles.outDay, 8) },
          dispatch: { ...prev.dispatch, today: jitter(prev.dispatch.today, 8) },
          dwell: { ...prev.dwell, avgDwellDay: avgDwell, totalDwellDay: Math.round(avgDwell * 5), totalDwellRatioDay: Math.round((avgDwell / avgDay) * 10000) / 100, avgDwellRatioDay: Math.round((avgDwell / avgDay) * 10000) / 100, sparkline: [...prev.dwell.sparkline.slice(1), { v: avgDwell }] },
        }
      })
      setVehicleData((rows) => rows.map((r) => ({ ...r, progress: Math.min(100, r.progress + (Math.random() > 0.7 ? 1 : 0)) })))
      // Don't randomly change parking statuses - only apply overrides from localStorage
      // This ensures parking grid state is synchronized across pages
      setParkingData((p) => applyOverrides(p))
    }, 30000)

    return () => {
      clearInterval(interval);
      eventsToListen.forEach(ev => window.removeEventListener(ev, refreshVehicleRows))
      window.removeEventListener('vehicleTareWeightAssignments-updated', onTareAssign)
      window.removeEventListener('vehicleLoadingGateAssignments-updated', onLoadingAssign)
      window.removeEventListener('vehicleWtPostLoadingAssignments-updated', onWtPostAssign)
      window.removeEventListener('vehicleWtPostLoadingCompleted-updated', onWtPostCompleted)
      window.removeEventListener('vehicleGateExitCompleted-updated', onGateExitCompletedToast)
      window.removeEventListener('rfidAssignments-updated', onGateEntryCompleted)
      window.removeEventListener('vehicleTareWeightCompleted-updated', onTareWeightCompleted)
      window.removeEventListener('vehicleLoadingGateCompleted-updated', onLoadingGateCompleted)
      window.removeEventListener('vehicleWtPostLoadingCompleted-updated', onWtPostLoadingCompleted)
    }
  }, [])

  return { kpiData, vehicleData, parkingData, loading, allocateSpot }
}
