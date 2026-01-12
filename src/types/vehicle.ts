export type StageKey = 'gateEntry' | 'tareWeighing' | 'loading' | 'postLoadingWeighing' | 'gateExit'
export type StageState = {
  state: 'completed' | 'active' | 'pending'
  waitTime: number
  stdTime: number
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
}
