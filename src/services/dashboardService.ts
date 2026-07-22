import { KPIData } from '@/types/kpi'
import { VehicleRow, StageKey, StageState } from '@/types/vehicle'
import { ParkingData } from '@/types/dashboard'
import { getVehicleByIndex, getVehicleEntryTime } from '@/utils/vehicleData'
import { rfidAssignmentService } from '@/utils/rfidAssignments'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export const dashboardService = {
  async getKPIData(): Promise<KPIData> {
    return {
      capacity: { utilization: 72, plantCapacity: 120, trucksInside: 86, trend: { direction: 'up', percentage: 3.2 } },
      turnaround: { avgDay: 92, avgCum: 95, lastYear: 102, trend: { direction: 'down', percentage: 1.4 }, performanceColor: 'yellow', sparkline: range(20).map(() => ({ v: Math.round(80 + Math.random() * 40) })) },
      vehicles: { inDay: 140, outDay: 132, inCum: 1980, outCum: 1968, trend: { direction: 'up', percentage: 5.1 }, target: 150 },
      dispatch: { today: 88, cumMonth: 1220, targetDay: 120, trend: { direction: 'up', percentage: 2.3 } },
      dwell: { totalDwellDay: 125, totalDwellCum: 450, avgDwellDay: 2.5, avgDwellCum: 2.1, totalDwellRatioDay: 2.72, totalDwellRatioCum: 2.35, avgDwellRatioDay: 2.72, avgDwellRatioCum: 2.35, trend: { direction: 'down', percentage: 0.8 }, sparkline: range(20).map(() => ({ v: Math.round(2 + Math.random() * 3) })) },
    }
  },
  async getVehicleRows(): Promise<VehicleRow[]> {
    const stages: StageKey[] = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']

    // Hardcoded standard times for each stage in minutes
    const STAGE_STANDARDS: Record<StageKey, number> = {
      gateEntry: 5,
      tareWeighing: 15,
      loading: 75, // 1 hr 15 min
      postLoadingWeighing: 25,
      gateExit: 30,
    }


    // Get RFID assignments from localStorage
    let rfidAssignments = typeof window !== 'undefined' ? rfidAssignmentService.getAssignments() : {};
    console.log('getVehicleRows - RFID assignments from localStorage:', rfidAssignments);

    // Clear all vehicle assignments and completed statuses on server restart (once per browser session)
    // This ensures that after a server/app restart all dropdowns reset to default state
    if (typeof window !== 'undefined') {
      try {
        const sessionKey = 'vehicleAssignments-initialized'
        const initialized = sessionStorage.getItem(sessionKey)

        if (!initialized) {
          console.log('Server restart detected - clearing all vehicle assignments and completed statuses')

          // Clear RFID assignments for all vehicles (correct key used by rfidAssignmentService)
          try {
            localStorage.removeItem('vehicleRfidAssignments')
            window.dispatchEvent(new Event('rfidAssignments-updated'))
            console.log('Cleared all RFID assignments (vehicleRfidAssignments)')
          } catch { }

          // Clear all stage assignments
          const assignmentKeys = [
            'vehicleParkingAssignments',
            'vehicleTareWeightAssignments',
            'vehicleLoadingGateAssignments',
            'vehicleWtPostLoadingAssignments',
            'vehicleGateExitAssignments'
          ]

          assignmentKeys.forEach((key) => {
            try {
              localStorage.removeItem(key)
              window.dispatchEvent(new Event(`${key}-updated`))
              console.log(`Cleared ${key}`)
            } catch { }
          })

          // Clear all stage completed statuses
          const completedKeys = [
            'vehicleTareWeightCompleted',
            'vehicleLoadingGateCompleted',
            'vehicleWtPostLoadingCompleted',
            'vehicleParkingCompleted',
            'vehicleGateExitCompleted'
          ]

          completedKeys.forEach((key) => {
            try {
              localStorage.removeItem(key)
              window.dispatchEvent(new Event(`${key}-updated`))
              console.log(`Cleared ${key}`)
            } catch { }
          })

          // Clear all pending statuses
          const pendingKeys = [
            'vehicleTareWeightPending',
            'vehicleLoadingGatePending',
            'vehicleWtPostLoadingPending',
            'vehicleGateEntryPending'
          ]

          pendingKeys.forEach((key) => {
            try {
              localStorage.removeItem(key)
              window.dispatchEvent(new Event(`${key}-updated`))
              console.log(`Cleared ${key}`)
            } catch { }
          })

          // Clear document verification related data (remarks and verified vehicles)
          const docVerifKeys = [
            'vehicleRemarks',
            'verifiedVehicles'
          ]

          docVerifKeys.forEach((key) => {
            try {
              localStorage.removeItem(key)
              window.dispatchEvent(new Event(`${key}-updated`))
              console.log(`Cleared ${key}`)
            } catch { }
          })

          // Mark as initialized for this browser session
          sessionStorage.setItem(sessionKey, '1')

          // Refresh RFID assignments
          rfidAssignments = rfidAssignmentService.getAssignments()
        }
      } catch (e) {
        console.error('Error clearing vehicle assignments on restart:', e)
      }
    }

    return range(25).map((i) => {
      // Build a deterministic base record where states are derived from persisted maps only.
      const record: Record<StageKey, StageState> = {
        gateEntry: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.gateEntry },
        tareWeighing: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.tareWeighing },
        loading: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.loading },
        postLoadingWeighing: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.postLoadingWeighing },
        gateExit: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.gateExit },
      }

      // Provide reasonable waitTime defaults (not used for state decisions)
      stages.forEach((k) => {
        const stdTime = STAGE_STANDARDS[k]
        const wt = Math.round(Math.random() * (stdTime * 2))
        const threshold = stdTime * 1.5
        const idleTime = wt > threshold ? wt - threshold : 0
        record[k] = { ...record[k], waitTime: wt, idleTime, stdTime }
      })

      const vehicleRegNo = getVehicleByIndex(i);

      // For MH12AB4829, set specific dwell times (idle times) for gate entry and gate exit
      if (vehicleRegNo === 'MH12AB4829') {
        record.gateEntry = { ...record.gateEntry, idleTime: 2 }
        record.gateExit = { ...record.gateExit, idleTime: 3 }
        // Set other stages to 0 dwell time
        record.tareWeighing = { ...record.tareWeighing, idleTime: 0 }
        record.loading = { ...record.loading, idleTime: 0 }
        record.postLoadingWeighing = { ...record.postLoadingWeighing, idleTime: 0 }
      }

      // Calculate total dwell time (sum of idle times for all stages)
      const totalDwellTime = stages.reduce((sum, stage) => sum + (record[stage].idleTime || 0), 0)

      const tareWt = Math.round(10 + Math.random() * 20) * 100
      const wtAfter = Math.round(tareWt + Math.random() * 3000)

      // Calculate TTR from completed stages
      const ttrValue = stages.reduce((sum, stage) => {
        if (record[stage].state === 'completed') {
          return sum + record[stage].waitTime
        }
        return sum
      }, 0)

      // Calculate dwell ratio: totalDwellTime / TTR
      const dwellRatio = ttrValue > 0 ? (totalDwellTime / ttrValue) : 0

      // RFID is only assigned when document verification is complete and RFID is saved
      const savedRfid = rfidAssignments[vehicleRegNo];
      const finalRfidNo = savedRfid || undefined;

      // Read other assignment maps (persisted) and pending selections
      const tareMap = typeof window !== 'undefined' ? (localStorage.getItem('vehicleTareWeightAssignments') ? JSON.parse(localStorage.getItem('vehicleTareWeightAssignments') as string) : {}) : {}
      const loadingGateMap = typeof window !== 'undefined' ? (localStorage.getItem('vehicleLoadingGateAssignments') ? JSON.parse(localStorage.getItem('vehicleLoadingGateAssignments') as string) : {}) : {}
      const wtPostMap = typeof window !== 'undefined' ? (localStorage.getItem('vehicleWtPostLoadingAssignments') ? JSON.parse(localStorage.getItem('vehicleWtPostLoadingAssignments') as string) : {}) : {}
      const exitMap = typeof window !== 'undefined' ? (localStorage.getItem('vehicleGateExitAssignments') ? JSON.parse(localStorage.getItem('vehicleGateExitAssignments') as string) : {}) : {}

      // Parking-completed and per-stage completed maps: when a vehicle leaves a station we mark completion here
      const parkingCompleted = typeof window !== 'undefined' ? (localStorage.getItem('vehicleParkingCompleted') ? JSON.parse(localStorage.getItem('vehicleParkingCompleted') as string) : {}) : {}
      const tareCompleted = typeof window !== 'undefined' ? (localStorage.getItem('vehicleTareWeightCompleted') ? JSON.parse(localStorage.getItem('vehicleTareWeightCompleted') as string) : {}) : {}
      const loadingCompleted = typeof window !== 'undefined' ? (localStorage.getItem('vehicleLoadingGateCompleted') ? JSON.parse(localStorage.getItem('vehicleLoadingGateCompleted') as string) : {}) : {}
      const wtPostCompleted = typeof window !== 'undefined' ? (localStorage.getItem('vehicleWtPostLoadingCompleted') ? JSON.parse(localStorage.getItem('vehicleWtPostLoadingCompleted') as string) : {}) : {}

      const tarePending = typeof window !== 'undefined' ? (localStorage.getItem('vehicleTareWeightPending') ? JSON.parse(localStorage.getItem('vehicleTareWeightPending') as string) : {}) : {}
      const loadingGatePending = typeof window !== 'undefined' ? (localStorage.getItem('vehicleLoadingGatePending') ? JSON.parse(localStorage.getItem('vehicleLoadingGatePending') as string) : {}) : {}
      const wtPostPending = typeof window !== 'undefined' ? (localStorage.getItem('vehicleWtPostLoadingPending') ? JSON.parse(localStorage.getItem('vehicleWtPostLoadingPending') as string) : {}) : {}
      const gateEntryPending = typeof window !== 'undefined' ? (localStorage.getItem('vehicleGateEntryPending') ? JSON.parse(localStorage.getItem('vehicleGateEntryPending') as string) : {}) : {}

      // Read station status lists (arrays of {id, status}) and convert to maps for quick lookup
      const tareStatusesArr = typeof window !== 'undefined' ? (localStorage.getItem('tareWeightStatuses') ? JSON.parse(localStorage.getItem('tareWeightStatuses') as string) : []) : []
      const loadingGateStatusesArr = typeof window !== 'undefined' ? (localStorage.getItem('loadingGateStatuses') ? JSON.parse(localStorage.getItem('loadingGateStatuses') as string) : []) : []
      const wtPostStatusesArr = typeof window !== 'undefined' ? (localStorage.getItem('wtPostLoadingStatuses') ? JSON.parse(localStorage.getItem('wtPostLoadingStatuses') as string) : []) : []
      const gateExitStatusesArr = typeof window !== 'undefined' ? (localStorage.getItem('gateExitStatuses') ? JSON.parse(localStorage.getItem('gateExitStatuses') as string) : []) : []
      const tareStatusMap: Record<string, string> = {}
      const loadingGateStatusMap: Record<string, string> = {}
      const wtPostStatusMap: Record<string, string> = {}
      const gateExitStatusMap: Record<string, string> = {}
      try { tareStatusesArr.forEach((it: any) => { if (it && it.id) tareStatusMap[it.id] = it.status }) } catch { }
      try { loadingGateStatusesArr.forEach((it: any) => { if (it && it.id) loadingGateStatusMap[it.id] = it.status }) } catch { }
      try { wtPostStatusesArr.forEach((it: any) => { if (it && it.id) wtPostStatusMap[it.id] = it.status }) } catch { }
      try { gateExitStatusesArr.forEach((it: any) => { if (it && it.id) gateExitStatusMap[it.id] = it.status }) } catch { }

      // Determine stage states for this vehicle using assignments and pending selections
      const isGateEntryCompleted = Boolean(savedRfid)
      const isGateEntryPending = Boolean(gateEntryPending[vehicleRegNo])
      // Completed if explicit tare-completed map was set (set after lifecycle).
      // Do NOT treat parking completion as tare completion — parking is a separate stage.
      const isTareCompleted = Boolean(tareCompleted[vehicleRegNo])
      const assignedTareId = tareMap[vehicleRegNo]
      // Consider a tare stage 'active' only when the assigned station is actually allocated (reserved/occupied)
      const isTareAssigned = Boolean(assignedTareId && (tareStatusMap[assignedTareId] === 'reserved' || tareStatusMap[assignedTareId] === 'occupied'))
      const isTarePending = Boolean(tarePending[vehicleRegNo])

      const isLoadingCompleted = Boolean(loadingCompleted[vehicleRegNo])
      const assignedLoadingId = loadingGateMap[vehicleRegNo]
      const isLoadingAssigned = Boolean(assignedLoadingId && (loadingGateStatusMap[assignedLoadingId] === 'reserved' || loadingGateStatusMap[assignedLoadingId] === 'occupied'))
      const isLoadingPending = Boolean(loadingGatePending[vehicleRegNo])

      const isPostLoadingCompleted = Boolean(wtPostCompleted[vehicleRegNo])
      const assignedPostId = wtPostMap[vehicleRegNo]
      const isPostLoadingAssigned = Boolean(assignedPostId && (wtPostStatusMap[assignedPostId] === 'reserved' || wtPostStatusMap[assignedPostId] === 'occupied'))
      const isPostLoadingPending = Boolean(wtPostPending[vehicleRegNo])

      const exitCompletedMap = typeof window !== 'undefined' ? (localStorage.getItem('vehicleGateExitCompleted') ? JSON.parse(localStorage.getItem('vehicleGateExitCompleted') as string) : {}) : {}
      const assignedExitId = exitMap[vehicleRegNo]
      const isExitAssigned = Boolean(assignedExitId && (gateExitStatusMap[assignedExitId] === 'reserved' || gateExitStatusMap[assignedExitId] === 'occupied'))
      const isExitCompleted = Boolean(exitCompletedMap[vehicleRegNo])

      if (vehicleRegNo === 'MH12AB4829') {
        console.log('MH12AB4829 - savedRfid:', savedRfid, 'finalRfidNo:', finalRfidNo);
      }

      return {
        sn: i + 1,
        regNo: vehicleRegNo,
        // Use saved RFID if exists, otherwise use default logic
        rfidNo: finalRfidNo,
        tareWt,
        wtAfter,
        progress: Math.round(Math.random() * 100),
        ttr: ttrValue,
        timestamp: getVehicleEntryTime(i).toISOString(),
        // Build stages object using assignments/pending and then post-process to make next stage active
        stages: (() => {
          const order: StageKey[] = ['gateEntry', 'tareWeighing', 'loading', 'postLoadingWeighing', 'gateExit']
          const stagesObj: Record<StageKey, StageState> = {
            gateEntry: {
              ...record.gateEntry,
              // Only mark gateEntry completed when RFID exists. If user verified docs, mark active (ongoing) via pending map.
              state: isGateEntryCompleted ? 'completed' : (isGateEntryPending ? 'active' : 'pending'),
              waitTime: isGateEntryCompleted ? record.gateEntry.stdTime : (isGateEntryPending ? Math.max(1, Math.round(record.gateEntry.stdTime / 2)) : (record.gateEntry.waitTime || 0)),
            },
            tareWeighing: {
              ...record.tareWeighing,
              // 'active' only when an actual tare assignment exists AND gate entry is completed.
              // This prevents a simultaneous selection for tare+loading from making tare active prematurely.
              state: isTareCompleted ? 'completed' : (isTareAssigned && isGateEntryCompleted ? 'active' : 'pending'),
              waitTime: isTareCompleted ? record.tareWeighing.stdTime : (isTareAssigned && isGateEntryCompleted ? Math.max(1, Math.round(record.tareWeighing.stdTime / 2)) : 0),
            },
            loading: {
              ...record.loading,
              // Require tare completion before loading becomes active even if loading is assigned.
              state: isLoadingCompleted ? 'completed' : (isLoadingAssigned && isTareCompleted ? 'active' : 'pending'),
              waitTime: isLoadingCompleted ? record.loading.stdTime : (isLoadingAssigned && isTareCompleted ? Math.max(1, Math.round(record.loading.stdTime / 2)) : 0),
            },
            postLoadingWeighing: {
              ...record.postLoadingWeighing,
              // Require loading completion before post-loading becomes active.
              state: isPostLoadingCompleted ? 'completed' : (isPostLoadingAssigned && isLoadingCompleted ? 'active' : 'pending'),
              waitTime: isPostLoadingCompleted ? record.postLoadingWeighing.stdTime : (isPostLoadingAssigned && isLoadingCompleted ? Math.max(1, Math.round(record.postLoadingWeighing.stdTime / 2)) : 0),
            },
            gateExit: {
              ...record.gateExit,
              // Gate exit becomes active only when an assignment exists and post-loading is completed
              state: isExitCompleted ? 'completed' : (isExitAssigned && isPostLoadingCompleted ? 'active' : 'pending'),
              waitTime: isExitCompleted ? record.gateExit.stdTime : (isExitAssigned && isPostLoadingCompleted ? Math.max(1, Math.round(record.gateExit.stdTime / 2)) : 0),
            },
          }

          // Find last completed stage index and make the immediate next stage active
          let lastCompleted = -1
          for (let idx = 0; idx < order.length; idx++) {
            if (stagesObj[order[idx]].state === 'completed') lastCompleted = idx
            else break
          }

          const nextIdx = lastCompleted + 1
          if (nextIdx >= 0 && nextIdx < order.length) {
            const nextKey = order[nextIdx]
            // Only promote the next stage to 'active' if an actual assignment (Allot) exists AND the assigned station is allocated (reserved/occupied)
            let assignedForNext = false
            if (nextKey === 'tareWeighing') assignedForNext = Boolean(tareMap[vehicleRegNo] && (tareStatusMap[tareMap[vehicleRegNo]] === 'reserved' || tareStatusMap[tareMap[vehicleRegNo]] === 'occupied'))
            else if (nextKey === 'loading') assignedForNext = Boolean(loadingGateMap[vehicleRegNo] && (loadingGateStatusMap[loadingGateMap[vehicleRegNo]] === 'reserved' || loadingGateStatusMap[loadingGateMap[vehicleRegNo]] === 'occupied'))
            else if (nextKey === 'postLoadingWeighing') assignedForNext = Boolean(wtPostMap[vehicleRegNo] && (wtPostStatusMap[wtPostMap[vehicleRegNo]] === 'reserved' || wtPostStatusMap[wtPostMap[vehicleRegNo]] === 'occupied'))
            else if (nextKey === 'gateExit') assignedForNext = Boolean(exitMap[vehicleRegNo])

            if (assignedForNext && stagesObj[nextKey].state !== 'completed' && stagesObj[nextKey].state !== 'active') {
              stagesObj[nextKey] = {
                ...stagesObj[nextKey],
                state: 'active',
                waitTime: Math.max(1, Math.round(stagesObj[nextKey].stdTime / 2)),
              }
            }
          }

          return stagesObj
        })(),
        totalDwellTime,
        dwellRatio,
      }
    })
  },
  async getParking(): Promise<ParkingData> {
    const mk = () => Array.from({ length: 4 }, (_, r) => Array.from({ length: 5 }, (_, c) => {
      // Start with all spots as available (green)
      return { status: 'available' as const, label: `S${r * 5 + c + 1}` }
    }))
    return { 'AREA-1': mk(), 'AREA-2': mk() }
  },
}
