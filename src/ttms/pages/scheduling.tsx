"use client"

import DashboardLayout from '@/components/layout/DashboardLayout'
import { useSchedulingState } from '@/hooks/useSchedulingState'
import VehicleEntryTable from '@/components/scheduling/VehicleEntryTable'
import FacilityMap from '@/components/scheduling/FacilityMap'
import ManualsList from '@/components/scheduling/ManualsList'
import MultiSelectDropdown from '@/components/scheduling/MultiSelectDropdown'
import AlertBar from '@/components/scheduling/AlertBar'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import SchedulingParkingToggle from '@/components/scheduling/SchedulingParkingToggle'
import LoadingGateStatus from '@/components/scheduling/LoadingGateStatus'

export default function TTMSSchedulingPage() {
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
          onAllot={(row)=>{
            const labels = (row.position || '').split(',').map(s=>s.trim()).filter(Boolean)
            if (labels.length === 0) {
              const fallback = s.selectedSlots
              fallback.forEach(lbl => allocateSpot((row.area as 'AREA-1'|'AREA-2'), lbl, row.regNo))
            } else {
              labels.forEach(lbl => allocateSpot((row.area as 'AREA-1'|'AREA-2'), lbl, row.regNo))
            }
            if (row.loadingGate) {
              try {
                const key = 'vehicleLoadingGateAssignments'
                const raw = localStorage.getItem(key)
                const map = raw ? JSON.parse(raw) as Record<string, string> : {}
                map[row.regNo] = row.loadingGate
                localStorage.setItem(key, JSON.stringify(map))
              } catch {}
              try {
                const key = 'loadingGateStatuses'
                const raw = localStorage.getItem(key)
                const gates = raw ? JSON.parse(raw) as {id:string; status:'available'|'occupied'|'reserved'}[] : Array.from({length:12},(_,i)=>({id:`G-${i+1}`,status:'available' as const}))
                const next = gates.map(g=> g.id===row.loadingGate ? {...g, status:'occupied' as const} : g)
                localStorage.setItem(key, JSON.stringify(next))
                window.dispatchEvent(new Event('loadingGateStatuses-updated'))
              } catch {}
            }
          }}
          onRevert={(row)=>{
            try {
              const pKey = 'vehicleParkingAssignments'
              const pRaw = localStorage.getItem(pKey)
              const pMap = pRaw ? JSON.parse(pRaw) as Record<string, { area: string; label: string }> : {}
              const assigned = pMap[row.regNo]
              if (assigned) {
                const ovKey = 'parkingStatusOverrides'
                const ovRaw = localStorage.getItem(ovKey)
                const ov = ovRaw ? JSON.parse(ovRaw) as Record<string, 'available'|'occupied'|'reserved'> : {}
                const k = `${assigned.area}-${assigned.label}`
                ov[k] = 'available'
                localStorage.setItem(ovKey, JSON.stringify(ov))
                delete pMap[row.regNo]
                localStorage.setItem(pKey, JSON.stringify(pMap))
                const colorRaw = localStorage.getItem('parkingColorMap')
                const colorMap = colorRaw ? JSON.parse(colorRaw) as Record<string, 'bg-green-500'|'bg-red-500'|'bg-yellow-500'> : {}
                colorMap[k] = 'bg-green-500'
                localStorage.setItem('parkingColorMap', JSON.stringify(colorMap))
                window.dispatchEvent(new Event('parkingColorMap-updated'))
              }
            } catch {}
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
                const gates = gRaw ? JSON.parse(gRaw) as {id:string; status:'available'|'occupied'|'reserved'}[] : []
                const next = gates.map(g=> g.id===gateId ? {...g, status:'available' as const} : g)
                localStorage.setItem(key, JSON.stringify(next))
                window.dispatchEvent(new Event('loadingGateStatuses-updated'))
              }
            } catch {}
            s.setVehicleEntries((rows)=>rows.map(r=> r.id===row.id ? { ...r, position: '' } : r))
          }}
        />
        <FacilityMap />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <ManualsList />
        <MultiSelectDropdown />
      </div>

      <AlertBar alerts={s.alerts} onRefresh={s.refreshAlerts} />
    </DashboardLayout>
  )
}
