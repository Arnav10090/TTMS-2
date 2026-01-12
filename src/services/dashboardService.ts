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

    // Hardcoded standard times for each stage in minutes
    const STAGE_STANDARDS: Record<StageKey, number> = {
      gateEntry: 5,
      tareWeighing: 15,
      loading: 75, // 1 hr 15 min
      postLoadingWeighing: 25,
      gateExit: 30,
    }

    return range(25).map((i) => {
      const activeIndex = Math.floor(Math.random()*stages.length)
      const record: Record<StageKey, StageState> = {
        gateEntry: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.gateEntry },
        tareWeighing: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.tareWeighing },
        loading: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.loading },
        postLoadingWeighing: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.postLoadingWeighing },
        gateExit: { state: 'pending', waitTime: 0, stdTime: STAGE_STANDARDS.gateExit },
      }

      stages.forEach((k, idx) => {
        // random wait time up to twice the standard for more realistic data
        const stdTime = STAGE_STANDARDS[k]
        const wt = Math.round(Math.random() * (stdTime * 2))

        // Calculate idle time: if waitTime > 1.5 * stdTime, idle time = waitTime - (1.5 * stdTime)
        const threshold = stdTime * 1.5
        const idleTime = wt > threshold ? wt - threshold : 0

        record[k] = {
          state: idx < activeIndex ? 'completed' : idx === activeIndex ? 'active' : 'pending',
          waitTime: wt,
          stdTime: stdTime,
          idleTime: idleTime,
        }
      })

      // Calculate total dwell time (sum of idle times for all stages)
      const totalDwellTime = stages.reduce((sum, stage) => sum + (record[stage].idleTime || 0), 0)

      const tareWt = Math.round(10 + Math.random()*20) * 100
      const wtAfter = Math.round(tareWt + Math.random()*3000)

      // Calculate TTR from completed stages
      const ttrValue = stages.reduce((sum, stage) => {
        if (record[stage].state === 'completed') {
          return sum + record[stage].waitTime
        }
        return sum
      }, 0)

      // Calculate dwell ratio: totalDwellTime / TTR
      const dwellRatio = ttrValue > 0 ? (totalDwellTime / ttrValue) : 0

      return {
        sn: i+1,
        regNo: `MH12-${1000 + i}`,
        rfidNo: `RFID-${1000 + i}`,
        tareWt,
        wtAfter,
        progress: Math.round(Math.random()*100),
        ttr: ttrValue,
        timestamp: new Date(Date.now() - Math.random()* 1000*60*60*24).toISOString(),
        stages: record,
        totalDwellTime,
        dwellRatio,
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
