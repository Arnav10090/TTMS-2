export type ReportStepKey = 'gateEntry' | 'tareWeight' | 'loading' | 'postLoadingWeight' | 'gateExit'

export type ReportStep = {
  key: ReportStepKey
  label: string
  minutes: number
  color: string
  accent?: string
}
