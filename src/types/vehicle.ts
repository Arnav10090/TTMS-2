export type StageKey = 'gateEntry' | 'tareWeighing' | 'loading' | 'postLoadingWeighing' | 'gateExit'
export type StageState = {
  state: 'completed' | 'active' | 'pending'
  waitTime: number
  stdTime: number
  idleTime?: number // Extra time taken beyond 1.5x standard time
}

export type VehicleRow = {
  sn: number
  regNo: string
  rfidNo?: string
  tareWt: number
  wtAfter: number
  progress: number
  ttr: number
  timestamp: string
  reportingTime?: Date | null
  stages: Record<StageKey, StageState>
  totalDwellTime?: number // Sum of idle times across all stages
  dwellRatio?: number // Total dwell time / TTR
}
