import { KPIData } from '@/types/kpi'
import { VehicleRow, StageKey, StageState } from '@/types/vehicle'
import { ParkingData } from '@/types/dashboard'

const range = (n: number) => Array.from({ length: n }, (_, i) => i)

export const dashboardService = {
  async getKPIData(): Promise<KPIData> {
    return {
      capacity: { utilization: 72, plantCapacity: 120, trucksInside: 86, trend: { direction: 'up', percentage: 3.2 } },
      turnaround: { avgDay: 92, avgCum: 95, lastYear: 102, trend: { direction: 'down', percentage: 1.4 }, performanceColor: 'yellow', sparkline: range(20).map(() => ({ v: Math.round(80 + Math.random()*40) })) },
      vehicles: { inDay: 140, outDay: 132, inCum: 1980, outCum: 1968, trend: { direction: 'up', percentage: 5.1 }, target: 150 },
      dispatch: { today: 88, cumMonth: 1220, targetDay: 120, trend: { direction: 'up', percentage: 2.3 } },
    }
  },
  async getVehicleRows(): Promise<VehicleRow[]> {
    const stages: StageKey[] = ['gateEntry','tareWeighing','loading','postLoadingWeighing','gateExit']
    return range(25).map((i) => {
      const activeIndex = Math.floor(Math.random()*stages.length)
      // Set standard time for every stage to 30 minutes as per new requirement
      const DEFAULT_STD = 30
      const record: Record<StageKey, StageState> = {
        gateEntry: { state: 'pending', waitTime: 0, stdTime: DEFAULT_STD },
        tareWeighing: { state: 'pending', waitTime: 0, stdTime: DEFAULT_STD },
        loading: { state: 'pending', waitTime: 0, stdTime: DEFAULT_STD },
        postLoadingWeighing: { state: 'pending', waitTime: 0, stdTime: DEFAULT_STD },
        gateExit: { state: 'pending', waitTime: 0, stdTime: DEFAULT_STD },
      }
      stages.forEach((k, idx) => {
        // random wait time up to twice the standard for more realistic data
        const wt = Math.round(Math.random()* (record[k].stdTime * 2))
        record[k] = {
          state: idx < activeIndex ? 'completed' : idx === activeIndex ? 'active' : 'pending',
          waitTime: wt,
          stdTime: record[k].stdTime,
        }
      })
      const tareWt = Math.round(10 + Math.random()*20) * 100
      const wtAfter = Math.round(tareWt + Math.random()*3000)
      return {
        sn: i+1,
        regNo: `MH12-${1000 + i}`,
        rfidNo: `RFID-${1000 + i}`,
        tareWt,
        wtAfter,
        progress: Math.round(Math.random()*100),
        ttr: Math.round(60 + Math.random()*120),
        timestamp: new Date(Date.now() - Math.random()* 1000*60*60*24).toISOString(),
        stages: record,
      }
    })
  },
  async getParking(): Promise<ParkingData> {
    const mk = () => Array.from({ length: 4 }, (_, r) => Array.from({ length: 5 }, (_, c) => {
      const rnd = Math.random()
      const status = rnd > 0.66 ? 'available' : rnd > 0.33 ? 'occupied' : 'reserved'
      return { status, label: `S${r*5 + c + 1}` }
    }))
    return { 'AREA-1': mk(), 'AREA-2': mk() }
  },
}
