export type Trend = { direction: 'up'|'down'; percentage: number }

export type CapacityData = {
  utilization: number
  plantCapacity: number
  trucksInside: number
  trend: Trend
}

export type TurnaroundData = {
  avgDay: number
  avgCum: number
  lastYear: number
  trend: Trend
  performanceColor: 'green'|'yellow'|'red'|'blue'
  sparkline: { v: number }[]
}

export type VehiclesData = {
  inDay: number
  outDay: number
  inCum: number
  outCum: number
  trend: Trend
  target: number
}

export type DispatchData = {
  today: number
  cumMonth: number
  targetDay: number
  trend: Trend
}

export type DwellData = {
  totalDwellDay: number
  totalDwellCum: number
  avgDwellDay: number
  avgDwellCum: number
  totalDwellRatioDay: number
  totalDwellRatioCum: number
  avgDwellRatioDay: number
  avgDwellRatioCum: number
  trend: Trend
  sparkline: { v: number }[]
}

export type KPIData = {
  capacity: CapacityData
  turnaround: TurnaroundData
  vehicles: VehiclesData
  dispatch: DispatchData
  dwell: DwellData
}
