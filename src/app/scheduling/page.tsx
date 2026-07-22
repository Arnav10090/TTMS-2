"use client"

"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSchedulingState } from '@/hooks/useSchedulingState'
import VehicleEntryTable from '@/components/scheduling/VehicleEntryTable'
import FacilityMap from '@/components/scheduling/FacilityMap'
import ManualsList from '@/components/scheduling/ManualsList'
import MultiSelectDropdown from '@/components/scheduling/MultiSelectDropdown'

import { useRealTimeData } from '@/hooks/useRealTimeData'
import SchedulingParkingToggle from '@/components/scheduling/SchedulingParkingToggle'
import LoadingGateStatus from '@/components/scheduling/LoadingGateStatus'

export default function SchedulingPage() {
  const s = useSchedulingState()
  const { parkingData, allocateSpot } = useRealTimeData()

  return (
    <DashboardLayout>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <SchedulingParkingToggle
          data={parkingData}
          onSelect={s.selectParkingSlot}
        />
        <LoadingGateStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <VehicleEntryTable
          rows={s.vehicleEntries}
          onRowsChange={s.setVehicleEntries}
          selectedSlots={s.selectedSlots}
          parkingData={parkingData}
          onExportCSV={s.generateReport}
          onPrint={() => window.print()}
          onAllot={(row) => {
            // Only allocate parking spot if not already allocated and not completed
            try {
              const parkingAssignmentsRaw = localStorage.getItem('vehicleParkingAssignments')
              const parkingAssignments = parkingAssignmentsRaw ? JSON.parse(parkingAssignmentsRaw) as Record<string, { area: string; label: string }> : {}
              
              const parkingCompletedRaw = localStorage.getItem('vehicleParkingCompleted')
              const parkingCompleted = parkingCompletedRaw ? JSON.parse(parkingCompletedRaw) as Record<string, string> : {}
              
              // Only allocate parking if not already assigned and not completed
              if (!parkingAssignments[row.regNo] && !parkingCompleted[row.regNo] && row.position) {
                const labels = (row.position || '').split(',').map(s => s.trim()).filter(Boolean)
                if (labels.length === 0) {
                  const fallback = s.selectedSlots
                  fallback.forEach(lbl => allocateSpot((row.area as 'AREA-1' | 'AREA-2'), lbl, row.regNo))
                } else {
                  labels.forEach(lbl => allocateSpot((row.area as 'AREA-1' | 'AREA-2'), lbl, row.regNo))
                }
              }
            } catch { }
            
            // Persist vehicle -> tare weight assignment and mark station reserved (only if not already assigned or completed)
            if (row.tareWeight && row.tareWeight !== 'COMPLETED') {
              try {
                const assignmentsRaw = localStorage.getItem('vehicleTareWeightAssignments')
                const assignments = assignmentsRaw ? JSON.parse(assignmentsRaw) as Record<string, string> : {}
                
                const completedRaw = localStorage.getItem('vehicleTareWeightCompleted')
                const completed = completedRaw ? JSON.parse(completedRaw) as Record<string, string> : {}
                
                // Only allocate if not already assigned and not completed
                if (!assignments[row.regNo] && !completed[row.regNo]) {
                  assignments[row.regNo] = row.tareWeight
                  localStorage.setItem('vehicleTareWeightAssignments', JSON.stringify(assignments))
                  window.dispatchEvent(new Event('vehicleTareWeightAssignments-updated'))
                  
                  // Mark station as reserved
                  const statusesRaw = localStorage.getItem('tareWeightStatuses')
                  const statuses = statusesRaw ? JSON.parse(statusesRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : Array.from({ length: 4 }, (_, i) => ({ id: `TW-${i + 1}`, status: 'available' as const }))
                  const next = statuses.map(s => s.id === row.tareWeight ? { ...s, status: 'reserved' as const } : s)
                  localStorage.setItem('tareWeightStatuses', JSON.stringify(next))
                  window.dispatchEvent(new Event('tareWeightStatuses-updated'))
                }
              } catch { }
            }
            
            // Persist vehicle -> loading gate assignment and mark gate reserved (skip if No Gate, only if not already assigned or completed)
            if (row.loadingGate && row.loadingGate !== 'COMPLETED') {
              try {
                const assignmentsRaw = localStorage.getItem('vehicleLoadingGateAssignments')
                const assignments = assignmentsRaw ? JSON.parse(assignmentsRaw) as Record<string, string> : {}
                
                const completedRaw = localStorage.getItem('vehicleLoadingGateCompleted')
                const completed = completedRaw ? JSON.parse(completedRaw) as Record<string, string> : {}
                
                // Only allocate if not already assigned and not completed
                if (!assignments[row.regNo] && !completed[row.regNo]) {
                  assignments[row.regNo] = row.loadingGate
                  localStorage.setItem('vehicleLoadingGateAssignments', JSON.stringify(assignments))
                  window.dispatchEvent(new Event('vehicleLoadingGateAssignments-updated'))
                  
                  // Mark gate as reserved
                  const statusesRaw = localStorage.getItem('loadingGateStatuses')
                  const statuses = statusesRaw ? JSON.parse(statusesRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : Array.from({ length: 12 }, (_, i) => ({ id: `G-${i + 1}`, status: 'available' as const }))
                  const next = statuses.map(g => g.id === row.loadingGate ? { ...g, status: 'reserved' as const } : g)
                  localStorage.setItem('loadingGateStatuses', JSON.stringify(next))
                  window.dispatchEvent(new Event('loadingGateStatuses-updated'))
                }
              } catch { }
            }
            
            // Persist vehicle -> wt post loading assignment and mark station reserved (only if not already assigned or completed)
            if (row.wtPostLoading && row.wtPostLoading !== 'COMPLETED') {
              try {
                const assignmentsRaw = localStorage.getItem('vehicleWtPostLoadingAssignments')
                const assignments = assignmentsRaw ? JSON.parse(assignmentsRaw) as Record<string, string> : {}
                
                const completedRaw = localStorage.getItem('vehicleWtPostLoadingCompleted')
                const completed = completedRaw ? JSON.parse(completedRaw) as Record<string, string> : {}
                
                // Only allocate if not already assigned and not completed
                if (!assignments[row.regNo] && !completed[row.regNo]) {
                  assignments[row.regNo] = row.wtPostLoading
                  localStorage.setItem('vehicleWtPostLoadingAssignments', JSON.stringify(assignments))
                  window.dispatchEvent(new Event('vehicleWtPostLoadingAssignments-updated'))
                  
                  // Mark station as reserved
                  const statusesRaw = localStorage.getItem('wtPostLoadingStatuses')
                  const statuses = statusesRaw ? JSON.parse(statusesRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : Array.from({ length: 4 }, (_, i) => ({ id: `WPL-${i + 1}`, status: 'available' as const }))
                  const next = statuses.map(s => s.id === row.wtPostLoading ? { ...s, status: 'reserved' as const } : s)
                  localStorage.setItem('wtPostLoadingStatuses', JSON.stringify(next))
                  window.dispatchEvent(new Event('wtPostLoadingStatuses-updated'))
                }
              } catch { }
            }
          }}
          onRevert={(row, target) => {
            // If target is specified, only revert that specific allocation
            if (target === 'parking') {
              try {
                const pKey = 'vehicleParkingAssignments'
                const pRaw = localStorage.getItem(pKey)
                const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
                const assigned = pMap[row.regNo]
                if (assigned) {
                  const ovKey = 'parkingStatusOverrides'
                  const ovRaw = localStorage.getItem(ovKey)
                  const ov = ovRaw ? JSON.parse(ovRaw) as Record<string, 'available' | 'occupied' | 'reserved'> : {}
                  const k = `${assigned.area}-${assigned.label}`
                  ov[k] = 'available'
                  localStorage.setItem(ovKey, JSON.stringify(ov))
                  delete pMap[row.regNo]
                  localStorage.setItem(pKey, JSON.stringify(pMap))
                  // Update color map to green
                  const colorRaw = localStorage.getItem('parkingColorMap')
                  const colorMap = colorRaw ? JSON.parse(colorRaw) as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> : {}
                  colorMap[k] = 'bg-green-500'
                  localStorage.setItem('parkingColorMap', JSON.stringify(colorMap))
                  window.dispatchEvent(new Event('parkingColorMap-updated'))
                }
              } catch { }
              // Clear position in table for UX
              s.setVehicleEntries((rows) => rows.map(r => r.id === row.id ? { ...r, position: '' } : r))
              return
            }
            
            if (target === 'tare') {
              try {
                const mapKey = 'vehicleTareWeightAssignments'
                const raw = localStorage.getItem(mapKey)
                const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                const stationId = map[row.regNo]
                if (stationId) {
                  delete map[row.regNo]
                  localStorage.setItem(mapKey, JSON.stringify(map))
                  const key = 'tareWeightStatuses'
                  const sRaw = localStorage.getItem(key)
                  const stations = sRaw ? JSON.parse(sRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                  const next = stations.map(s => s.id === stationId ? { ...s, status: 'available' as const } : s)
                  localStorage.setItem(key, JSON.stringify(next))
                  window.dispatchEvent(new Event('tareWeightStatuses-updated'))
                }
              } catch { }
              // Clear tareWeight in table for UX
              s.setVehicleEntries((rows) => rows.map(r => r.id === row.id ? { ...r, tareWeight: '' } : r))
              return
            }
            
            if (target === 'gate') {
              try {
                const mapKey = 'vehicleLoadingGateAssignments'
                const raw = localStorage.getItem(mapKey)
                const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                const gateId = map[row.regNo]
                if (gateId) {
                  delete map[row.regNo]
                  localStorage.setItem(mapKey, JSON.stringify(map))
                  const key = 'loadingGateStatuses'
                  const gRaw = localStorage.getItem(key)
                  const gates = gRaw ? JSON.parse(gRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                  const next = gates.map(g => g.id === gateId ? { ...g, status: 'available' as const } : g)
                  localStorage.setItem(key, JSON.stringify(next))
                  window.dispatchEvent(new Event('loadingGateStatuses-updated'))
                }
              } catch { }
              // Clear loadingGate in table for UX
              s.setVehicleEntries((rows) => rows.map(r => r.id === row.id ? { ...r, loadingGate: '' } : r))
              return
            }
            
            if (target === 'wtpost') {
              try {
                const mapKey = 'vehicleWtPostLoadingAssignments'
                const raw = localStorage.getItem(mapKey)
                const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                const stationId = map[row.regNo]
                if (stationId) {
                  delete map[row.regNo]
                  localStorage.setItem(mapKey, JSON.stringify(map))
                  const key = 'wtPostLoadingStatuses'
                  const sRaw = localStorage.getItem(key)
                  const stations = sRaw ? JSON.parse(sRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                  const next = stations.map(s => s.id === stationId ? { ...s, status: 'available' as const } : s)
                  localStorage.setItem(key, JSON.stringify(next))
                  window.dispatchEvent(new Event('wtPostLoadingStatuses-updated'))
                }
              } catch { }
              // Clear wtPostLoading in table for UX
              s.setVehicleEntries((rows) => rows.map(r => r.id === row.id ? { ...r, wtPostLoading: '' } : r))
              return
            }
            
            if (target === 'exit') {
              try {
                const mapKey = 'vehicleGateExitAssignments'
                const raw = localStorage.getItem(mapKey)
                const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                const exitId = map[row.regNo]
                if (exitId) {
                  delete map[row.regNo]
                  localStorage.setItem(mapKey, JSON.stringify(map))
                  const key = 'gateExitStatuses'
                  const eRaw = localStorage.getItem(key)
                  const exits = eRaw ? JSON.parse(eRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                  const next = exits.map(e => e.id === exitId ? { ...e, status: 'available' as const } : e)
                  localStorage.setItem(key, JSON.stringify(next))
                  window.dispatchEvent(new Event('gateExitStatuses-updated'))
                }
              } catch { }
              return
            }
            
            // If no target specified, revert all allocations
            // Revert parking assignment
            try {
              const pKey = 'vehicleParkingAssignments'
              const pRaw = localStorage.getItem(pKey)
              const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
              const assigned = pMap[row.regNo]
              if (assigned) {
                const ovKey = 'parkingStatusOverrides'
                const ovRaw = localStorage.getItem(ovKey)
                const ov = ovRaw ? JSON.parse(ovRaw) as Record<string, 'available' | 'occupied' | 'reserved'> : {}
                const k = `${assigned.area}-${assigned.label}`
                ov[k] = 'available'
                localStorage.setItem(ovKey, JSON.stringify(ov))
                delete pMap[row.regNo]
                localStorage.setItem(pKey, JSON.stringify(pMap))
                // Update color map to green
                const colorRaw = localStorage.getItem('parkingColorMap')
                const colorMap = colorRaw ? JSON.parse(colorRaw) as Record<string, 'bg-green-500' | 'bg-red-500' | 'bg-yellow-500'> : {}
                colorMap[k] = 'bg-green-500'
                localStorage.setItem('parkingColorMap', JSON.stringify(colorMap))
                window.dispatchEvent(new Event('parkingColorMap-updated'))
              }
            } catch { }
            
            // Revert tare weight assignment
            try {
              const mapKey = 'vehicleTareWeightAssignments'
              const raw = localStorage.getItem(mapKey)
              const map = raw ? JSON.parse(raw) as Record<string, string> : {}
              const stationId = map[row.regNo]
              if (stationId) {
                delete map[row.regNo]
                localStorage.setItem(mapKey, JSON.stringify(map))
                const key = 'tareWeightStatuses'
                const sRaw = localStorage.getItem(key)
                const stations = sRaw ? JSON.parse(sRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next = stations.map(s => s.id === stationId ? { ...s, status: 'available' as const } : s)
                localStorage.setItem(key, JSON.stringify(next))
                window.dispatchEvent(new Event('tareWeightStatuses-updated'))
              }
            } catch { }
            
            // Revert loading gate assignment
            try {
              const mapKey = 'vehicleLoadingGateAssignments'
              const raw = localStorage.getItem(mapKey)
              const map = raw ? JSON.parse(raw) as Record<string, string> : {}
              const gateId = map[row.regNo]
              if (gateId) {
                delete map[row.regNo]
                localStorage.setItem(mapKey, JSON.stringify(map))
                const key = 'loadingGateStatuses'
                const gRaw = localStorage.getItem(key)
                const gates = gRaw ? JSON.parse(gRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next = gates.map(g => g.id === gateId ? { ...g, status: 'available' as const } : g)
                localStorage.setItem(key, JSON.stringify(next))
                window.dispatchEvent(new Event('loadingGateStatuses-updated'))
              }
            } catch { }
            
            // Revert wt post loading assignment
            try {
              const mapKey = 'vehicleWtPostLoadingAssignments'
              const raw = localStorage.getItem(mapKey)
              const map = raw ? JSON.parse(raw) as Record<string, string> : {}
              const stationId = map[row.regNo]
              if (stationId) {
                delete map[row.regNo]
                localStorage.setItem(mapKey, JSON.stringify(map))
                const key = 'wtPostLoadingStatuses'
                const sRaw = localStorage.getItem(key)
                const stations = sRaw ? JSON.parse(sRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next = stations.map(s => s.id === stationId ? { ...s, status: 'available' as const } : s)
                localStorage.setItem(key, JSON.stringify(next))
                window.dispatchEvent(new Event('wtPostLoadingStatuses-updated'))
              }
            } catch { }
            
            // Revert gate exit assignment
            try {
              const mapKey = 'vehicleGateExitAssignments'
              const raw = localStorage.getItem(mapKey)
              const map = raw ? JSON.parse(raw) as Record<string, string> : {}
              const exitId = map[row.regNo]
              if (exitId) {
                delete map[row.regNo]
                localStorage.setItem(mapKey, JSON.stringify(map))
                const key = 'gateExitStatuses'
                const eRaw = localStorage.getItem(key)
                const exits = eRaw ? JSON.parse(eRaw) as { id: string; status: 'available' | 'occupied' | 'reserved' }[] : []
                const next = exits.map(e => e.id === exitId ? { ...e, status: 'available' as const } : e)
                localStorage.setItem(key, JSON.stringify(next))
                window.dispatchEvent(new Event('gateExitStatuses-updated'))
              }
            } catch { }
            
            // Clear all fields in table for UX
            s.setVehicleEntries((rows) => rows.map(r => r.id === row.id ? { ...r, position: '', tareWeight: '', loadingGate: '', wtPostLoading: '' } : r))
          }}
        />
        <FacilityMap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ManualsList />
        <MultiSelectDropdown />
      </div>


    </DashboardLayout>
  )
}
